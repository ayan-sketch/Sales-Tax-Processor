import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_accessible_client, get_accessible_resource, scope_client_resource, scope_owned_clients
from app.db.session import Base
from app.models.client import Client
from app.models.task import Task
from app.models.user import User


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(
        engine,
        tables=[User.__table__, Client.__table__, Task.__table__],
    )
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(
            engine,
            tables=[Task.__table__, Client.__table__, User.__table__],
        )


def make_user(user_id: str, role: str = "user") -> User:
    return User(
        id=user_id,
        full_name=user_id,
        username=user_id,
        password_hash="not-used",
        role=role,
        is_active=True,
        is_approved=True,
    )


def seed_two_tenants(db):
    alice = make_user("alice")
    bob = make_user("bob")
    admin = make_user("admin", role="admin")
    alice_client = Client(id="alice-client", owner_id=alice.id, client_name="Alice Client")
    bob_client = Client(id="bob-client", owner_id=bob.id, client_name="Bob Client")
    alice_task = Task(id="alice-task", client_id=alice_client.id, title="Alice Task")
    bob_task = Task(id="bob-task", client_id=bob_client.id, title="Bob Task")
    db.add_all([alice, bob, admin, alice_client, bob_client, alice_task, bob_task])
    db.commit()
    return alice, bob, admin, alice_client, bob_client, alice_task, bob_task


def test_non_admin_queries_only_return_owned_records(db):
    alice, _, _, alice_client, _, alice_task, _ = seed_two_tenants(db)

    clients = scope_owned_clients(db.query(Client), alice).all()
    tasks = scope_client_resource(db.query(Task), Task, alice).all()

    assert [client.id for client in clients] == [alice_client.id]
    assert [task.id for task in tasks] == [alice_task.id]


def test_cross_tenant_detail_access_returns_not_found(db):
    alice, _, _, _, bob_client, _, bob_task = seed_two_tenants(db)

    with pytest.raises(HTTPException) as client_error:
        get_accessible_client(db, bob_client.id, alice)
    with pytest.raises(HTTPException) as task_error:
        get_accessible_resource(db, Task, bob_task.id, alice, "Task not found")

    assert client_error.value.status_code == 404
    assert task_error.value.status_code == 404


def test_admin_queries_retain_global_access(db):
    _, _, admin, _, _, _, _ = seed_two_tenants(db)

    assert scope_owned_clients(db.query(Client), admin).count() == 2
    assert scope_client_resource(db.query(Task), Task, admin).count() == 2
