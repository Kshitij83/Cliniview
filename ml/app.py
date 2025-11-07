from fastapi import FastAPI, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader, APIKey
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict, Any
import uvicorn
import os
from dotenv import load_dotenv

# Load services
from services.symptom_checker import SymptomChecker

# Load environment variables
load_dotenv()
API_KEY = os.getenv("API_KEY")
PORT = int(os.getenv("PORT", 5001))

# Initialize API key security
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# Initialize FastAPI app
app = FastAPI(
    title="Cliniview ML API",
    description="Machine Learning API for Cliniview Healthcare Platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML services
symptom_checker = SymptomChecker()

# API key dependency
async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key == API_KEY:
        return api_key
    raise HTTPException(
        status_code=403, detail="Invalid API Key"
    )

# Routes
@app.get("/")
async def root():
    return {"message": "Cliniview ML API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "cliniview-ml"}

@app.post("/predict_symptom")
async def predict_symptoms(request: Dict[str, Any]):
    """
    Predict possible diseases from symptoms.
    Expects: {"symptoms": ["fever", "cough", "headache"]}
    """
    try:
        symptoms = request.get("symptoms", [])
        if not symptoms:
            raise HTTPException(status_code=400, detail="At least one symptom is required")
        
        result = symptom_checker.analyze(symptoms)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing symptoms: {str(e)}")

@app.post("/api/symptom-check")
async def analyze_symptoms(request: Dict[str, Any], api_key: APIKey = Security(get_api_key)):
    """Legacy endpoint for backward compatibility."""
    try:
        symptoms = request.get("symptoms", [])
        result = symptom_checker.analyze(symptoms)
        
        # Convert to legacy format
        conditions = [
            {
                "name": pred['disease'],
                "probability": pred['confidence'],
                "description": f"Severity: {pred['severity']}"
            }
            for pred in result['predictions'][:3]
        ]
        
        return {
            "possible_conditions": conditions,
            "recommendations": result['recommendation_summary'],
            "severity": result['overall_severity'],
            "explanation": result['ai_response']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing symptoms: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=PORT, reload=True)