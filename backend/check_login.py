import sqlite3
import sys

conn = sqlite3.connect(r'tax_compliance.db')
c = conn.cursor()
c.execute('SELECT name FROM sqlite_master WHERE type="table"')
tables = c.fetchall()
print('Tables:', [t[0] for t in tables], flush=True)
c.execute('SELECT username, email, is_active FROM users')
users = c.fetchall()
print('Users:', users, flush=True)
if users:
    c.execute('SELECT password_hash FROM users WHERE username = ?', (users[0][0],))
    pw = c.fetchone()[0]
    print('Hash starts with:', pw[:30], flush=True)
conn.close()