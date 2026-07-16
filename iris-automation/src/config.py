import os
import yaml
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

class Settings:
    def __init__(self, path: str | None = None):
        path = path or ROOT / "config.yaml"
        with open(path) as f:
            raw = yaml.safe_load(f)

        self.IRIS_BASE_URL = raw["iris"]["base_url"]
        self.IRIS_LOGIN_URL = raw["iris"]["login_url"]
        self.IRIS_DASHBOARD_URL = raw["iris"]["dashboard_url"]
        self.IRIS_RETURN_URL = raw["iris"]["return_url"]

        self.HEADLESS = raw["browser"]["headless"]
        self.SLOW_MO = raw["browser"]["slow_mo"]
        self.VIEWPORT_WIDTH = raw["browser"]["viewport_width"]
        self.VIEWPORT_HEIGHT = raw["browser"]["viewport_height"]
        self.STORAGE_STATE = str(ROOT / raw["browser"]["storage_state"])

        self.LOGIN_TIMEOUT_MINUTES = raw["login"]["timeout_minutes"]
        self.LOGIN_SUCCESS_INDICATOR = raw["login"]["success_indicator"]

        self.EXCEL_INDIVIDUAL = str(ROOT / raw["excel"]["individual"])

settings = Settings()
