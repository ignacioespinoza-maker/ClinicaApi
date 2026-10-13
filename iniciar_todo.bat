@echo off
title Sistema Evaluaciones Clinicas - Iniciador
echo ===================================================
echo   Iniciando Sistema de Evaluaciones Clinicas
echo ===================================================
echo.

echo [1/2] Iniciando Backend (.NET 10 API en http://localhost:5242)...
start "Backend - ClinicaApi (.NET)" powershell -NoExit -Command "cd '%~dp0ClinicaApi'; Write-Host 'Iniciando Backend API en http://localhost:5242...' -ForegroundColor Cyan; dotnet run"

timeout /t 3 /nobreak >nul

echo [2/2] Iniciando Frontend (React 19 + Vite en http://localhost:5173)...
start "Frontend - Clinica Web (React)" powershell -NoExit -Command "$env:Path = 'C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Microsoft\VisualStudio\NodeJs;' + $env:Path; cd '%~dp0clinica-frontend'; Write-Host 'Iniciando Frontend React en http://localhost:5173...' -ForegroundColor Green; npm run dev"

echo.
echo ===================================================
echo   Ambos servicios han sido lanzados en ventanas separadas!
echo   - Backend:  http://localhost:5242/swagger
echo   - Frontend: http://localhost:5173
echo ===================================================
echo Puedes cerrar esta ventana.
pause
