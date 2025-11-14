@echo off
echo 🚀 Deploying DocuMind on Windows...

:: Check if .env exists
if not exist ".env" (
    echo ⚠️ .env file not found! Creating template...
    (
        echo GEMINI_API_KEY=your_gemini_api_key_here
    ) > .env
    echo 📝 Please edit .env file with your actual API key before running again
    pause
    exit /b 1
)

:: Validate .env has actual API key
findstr "your_gemini_api_key_here" .env >nul
if not errorlevel 1 (
    echo ❌ Please update .env file with your actual Gemini API key
    pause
    exit /b 1
)

echo 📦 Building Docker images...
docker-compose build --no-cache --parallel

echo 🔄 Starting services...
docker-compose down
docker-compose up -d

echo ⏳ Waiting for services to be healthy...
timeout /t 10 /nobreak

echo 🔍 Waiting for backend to be ready...
for /l %%i in (1,1,30) do (
    curl -s http://localhost:8000/health >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Backend is healthy
        goto backend_healthy
    )
    timeout /t 2 /nobreak >nul
)
echo ❌ Backend failed to start
docker-compose logs backend
pause
exit /b 1

:backend_healthy
echo 🔍 Waiting for frontend to be ready...
for /l %%i in (1,1,30) do (
    curl -s http://localhost/health >nul 2>&1
    if not errorlevel 1 (
        echo ✅ Frontend is healthy
        goto frontend_healthy
    )
    timeout /t 2 /nobreak >nul
)
echo ❌ Frontend failed to start
docker-compose logs frontend
pause
exit /b 1

:frontend_healthy
echo 🔍 Checking service status...
docker-compose ps

echo ✅ Deployment complete!
echo.
echo 🌐 Your application is running at:
echo    Frontend: http://localhost
echo    Backend API: http://localhost:8000
echo    API Documentation: http://localhost:8000/docs
echo.
echo 📊 Useful commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart: docker-compose restart
echo    View resource usage: docker stats

pause