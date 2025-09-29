# Deployment script for Cliniview ML Service

Write-Host "Starting Cliniview ML Service deployment..." -ForegroundColor Green

# Check for Python version
try {
    $pythonVersion = python --version
    Write-Host "Found $pythonVersion" -ForegroundColor Green
}
catch {
    Write-Host "Python is not installed. Please install Python 3.10+ and try again." -ForegroundColor Red
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Check if .env file exists, copy from example if not
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "Please edit .env file with your actual configuration values." -ForegroundColor Red
}

# Create models/saved directory if it doesn't exist
if (-not (Test-Path "models\saved")) {
    Write-Host "Creating models directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "models\saved" -Force
}

# Generate dummy models for testing
Write-Host "Generating dummy models..." -ForegroundColor Yellow
python models/create_dummy_model.py

# Run tests
Write-Host "Running tests..." -ForegroundColor Yellow
pytest -xvs tests/

# Start the service
Write-Host "Starting ML service..." -ForegroundColor Green
python app.py