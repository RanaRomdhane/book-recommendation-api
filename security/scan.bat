@echo off
echo 🔒 Running Security Scans...

echo Checking if Trivy is installed...
trivy --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Trivy is not installed. Skipping Trivy scans.
    echo To install Trivy, run: choco install trivy -y
    goto :dependency_scan
)

echo.
echo 1. SAST with Trivy...
trivy fs . --exit-code 0

echo.
echo 2. Container vulnerability scanning...
echo Note: This requires a built Docker image
if exist "Dockerfile" (
    echo Building and scanning Docker image...
    docker build -t book-recommendation-api-scan .
    trivy image book-recommendation-api-scan --exit-code 0
) else (
    echo Dockerfile not found, skipping container scan
)

:dependency_scan
echo.
echo 3. Dependency vulnerability scan...
npm audit --audit-level moderate

echo.
echo 4. Secret detection...
echo Note: git-secrets not available on Windows, skipping...

echo.
echo ✅ Security scans completed!
pause