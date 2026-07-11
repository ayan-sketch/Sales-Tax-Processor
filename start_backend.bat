@echo off
cd /d "c:\Users\fgsdfg\Desktop\sale tax software\backend"
"venv\Scripts\python" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload