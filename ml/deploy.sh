#!/bin/bash

# Deployment script for Cliniview ML Service

echo "Starting Cliniview ML Service deployment..."

# Check for Python version
python --version
if [ $? -ne 0 ]; then
    echo "Python is not installed. Please install Python 3.10+ and try again."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists, copy from example if not
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "Please edit .env file with your actual configuration values."
fi

# Create models/saved directory if it doesn't exist
if [ ! -d "models/saved" ]; then
    echo "Creating models directory..."
    mkdir -p models/saved
fi

# Generate dummy models for testing
echo "Generating dummy models..."
python models/create_dummy_model.py

# Run tests
echo "Running tests..."
pytest -xvs tests/

# Start the service
echo "Starting ML service..."
python app.py