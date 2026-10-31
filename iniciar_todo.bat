@echo off
title NeuroLab Enterprise - Sistema Completo
cd /d "%~dp0"
echo ========================================================
echo    Iniciando NeuroLab Enterprise (Backend + Frontend)
echo ========================================================

start "NeuroLab Backend (FastAPI)" cmd /c "%~dp0iniciar_backend.bat"
start "NeuroLab Frontend (Vite)" cmd /c "%~dp0iniciar_frontend.bat"

echo.
echo Los servicios se estan iniciando en ventanas independientes:
echo  - Backend:  http://localhost:8000 (Docs: http://localhost:8000/docs)
echo  - Frontend: http://localhost:5173
echo.
pause

