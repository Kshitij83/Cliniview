from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader, APIKey
from pydantic import BaseModel
from typing import Optional, List
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
    allow_origins=["*"],  # In production, specify allowed origins
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

# Models
class SymptomRequest(BaseModel):
    patient_id: str
    symptoms: List[str]
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[List[str]] = None

class ConditionPrediction(BaseModel):
    name: str
    probability: float
    description: str

class SymptomResponse(BaseModel):
    possible_conditions: List[ConditionPrediction]
    recommendations: List[str]
    severity: str
    explanation: str

# Routes
@app.get("/")
async def root():
    return {"message": "Cliniview ML API is running"}

@app.post("/api/symptom-check", response_model=SymptomResponse)
async def analyze_symptoms(request: SymptomRequest, api_key: APIKey = Depends(get_api_key)):
    try:
        result = symptom_checker.analyze(
            request.symptoms,
            age=request.age,
            gender=request.gender,
            medical_history=request.medical_history
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing symptoms: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=PORT, reload=True)