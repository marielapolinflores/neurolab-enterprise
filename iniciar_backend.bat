@echo off
title NeuroLab Enterprise - Backend FastAPI
cd /d "%~dp0backend"
echo ========================================================
echo    Iniciando NeuroLab Enterprise Backend (FastAPI)
echo ========================================================

if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
    python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
) else (
    py -3.12 -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 || python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 || uvicorn app.main:app --reload --port 8000 --host 0.0.0.0
)

pause
