import os

DEV_AUTH_DISABLED = os.getenv("DEV_AUTH_DISABLED", "true").lower() in {"1", "true", "yes", "on"}
