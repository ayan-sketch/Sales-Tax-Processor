@echo off
cd /d "C:\Users\Zain Khan\Desktop\sale tax software\backend"
"C:\Users\Zain Khan\Desktop\sale tax software\backend\venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000
