from fastapi import FastAPI, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader, APIKey
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict, Any
import uvicorn
import os
from dotenv import load_dotenv

# Load services
from services.ml_symptom_checker import MLSymptomChecker
from services.columbia_ml_symptom_checker import ColumbiaMLSymptomChecker
from services.final_augmented_ml_service import FinalAugmentedMLSymptomChecker

# Load environment variables
load_dotenv()
API_KEY = os.getenv("API_KEY")
PORT = int(os.getenv("PORT", 5001))

# Initialize API key security
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# Initialize FastAPI app
app = FastAPI(
    title="Cliniview ML API - Enhanced",
    description="Enhanced Machine Learning API with Columbia University Disease-Symptom Knowledge Base",
    version="2.0.0"
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
try:
    final_augmented_checker = FinalAugmentedMLSymptomChecker()
    print("✅ Final Augmented ML service initialized (PRIMARY)")
except Exception as e:
    final_augmented_checker = None
    print(f"⚠️ Final Augmented ML service unavailable: {e}")

try:
    columbia_checker = ColumbiaMLSymptomChecker()
    print("✅ Columbia ML service initialized (SECONDARY)")
except Exception as e:
    columbia_checker = None
    print(f"⚠️ Columbia ML service unavailable: {e}")

try:
    legacy_checker = MLSymptomChecker()
    print("✅ Legacy ML service initialized (FALLBACK)")
except Exception as e:
    legacy_checker = None
    print(f"⚠️ Legacy ML service unavailable: {e}")

# Primary symptom checker (Final Augmented preferred, then Columbia, then legacy)
symptom_checker = final_augmented_checker or columbia_checker or legacy_checker

if not symptom_checker:
    print("❌ No ML services available")
    raise RuntimeError("No ML services could be initialized")

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
    return {
        "message": "Cliniview ML API - Enhanced with Final Augmented Dataset", 
        "version": "3.0.0",
        "models_available": {
            "final_augmented": final_augmented_checker is not None,
            "columbia": columbia_checker is not None,
            "legacy": legacy_checker is not None
        },
        "primary_model": "final_augmented" if final_augmented_checker else "columbia" if columbia_checker else "legacy",
        "performance": {
            "diseases": 721 if final_augmented_checker else 15 if columbia_checker else 41,
            "symptoms": 377 if final_augmented_checker else 55 if columbia_checker else 132,
            "records": "246K+" if final_augmented_checker else "1.5K" if columbia_checker else "5K"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "cliniview-ml-final-augmented",
        "models": {
            "final_augmented": "available" if final_augmented_checker else "unavailable",
            "columbia": "available" if columbia_checker else "unavailable",
            "legacy": "available" if legacy_checker else "unavailable"
        }
    }

@app.post("/predict_symptom")
async def predict_symptoms(request: Dict[str, Any]):
    """
    Enhanced symptom prediction with Columbia Dataset.
    Supports both string arrays and enhanced symptom objects.
    
    Format 1: {"symptoms": ["fever", "cough", "headache"]}
    Format 2: {"symptoms": [{"name": "fever", "severity": "mild", "duration": "2 days"}]}
    """
    try:
        symptoms = request.get("symptoms", [])
        if not symptoms:
            raise HTTPException(status_code=400, detail="At least one symptom is required")
        
        # Use Final Augmented checker if available, then Columbia, then legacy
        active_checker = final_augmented_checker or columbia_checker or legacy_checker
        
        # Check if symptoms are objects or strings
        if symptoms and isinstance(symptoms[0], dict):
            # Enhanced format with symptom objects
            if hasattr(active_checker, 'predict_diseases_enhanced'):
                result = active_checker.predict_diseases_enhanced(symptoms)
            else:
                result = active_checker.analyze_enhanced(symptoms)
        else:
            # Legacy format with strings
            if hasattr(active_checker, 'predict_diseases_legacy'):
                result = active_checker.predict_diseases_legacy(symptoms)
            else:
                result = active_checker.analyze(symptoms)
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing symptoms: {str(e)}")

@app.post("/predict_symptom_enhanced")
async def predict_symptoms_enhanced(request: Dict[str, Any]):
    """
    Enhanced symptom prediction using severity and duration data with Columbia Dataset.
    Expects: {"symptoms": [{"name": "fever", "severity": "mild|moderate|severe", "duration": "1 day|2-3 days|1 week|2+ weeks"}]}
    """
    try:
        symptoms = request.get("symptoms", [])
        if not symptoms:
            raise HTTPException(status_code=400, detail="At least one symptom is required")
        
        # Validate symptom objects format
        for i, symptom in enumerate(symptoms):
            if not isinstance(symptom, dict):
                raise HTTPException(status_code=400, detail=f"Symptom {i+1} must be an object with name, severity, and duration")
            
            if 'name' not in symptom:
                raise HTTPException(status_code=400, detail=f"Symptom {i+1} is missing 'name' field")
            
            # Set defaults if missing
            if 'severity' not in symptom:
                symptom['severity'] = 'moderate'
            if 'duration' not in symptom:
                symptom['duration'] = '1 week'
        
        # Use Final Augmented checker if available, then Columbia, then legacy
        active_checker = final_augmented_checker or columbia_checker or legacy_checker
        
        if hasattr(active_checker, 'predict_diseases_enhanced'):
            result = active_checker.predict_diseases_enhanced(symptoms)
        else:
            result = active_checker.analyze_enhanced(symptoms)
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing symptoms: {str(e)}")

@app.post("/predict_final_augmented")
async def predict_with_final_augmented(request: Dict[str, Any]):
    """
    Direct Final Augmented Dataset prediction endpoint (246K records, 721 diseases).
    """
    if not final_augmented_checker:
        raise HTTPException(status_code=503, detail="Final Augmented ML service not available")
        
    try:
        symptoms = request.get("symptoms", [])
        if not symptoms:
            raise HTTPException(status_code=400, detail="At least one symptom is required")
        
        if isinstance(symptoms[0], dict):
            result = final_augmented_checker.predict_diseases_enhanced(symptoms)
        else:
            result = final_augmented_checker.predict_diseases_legacy(symptoms)
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Final Augmented prediction failed: {str(e)}")

@app.post("/predict_columbia")
async def predict_with_columbia(request: Dict[str, Any]):
    """
    Direct Columbia University Dataset prediction endpoint.
    """
    if not columbia_checker:
        raise HTTPException(status_code=503, detail="Columbia ML service not available")
        
    try:
        symptoms = request.get("symptoms", [])
        if not symptoms:
            raise HTTPException(status_code=400, detail="At least one symptom is required")
        
        if isinstance(symptoms[0], dict):
            result = columbia_checker.predict_diseases_enhanced(symptoms)
        else:
            result = columbia_checker.predict_diseases_legacy(symptoms)
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Columbia prediction failed: {str(e)}")

@app.post("/predict_legacy")
async def predict_with_legacy(request: Dict[str, Any]):
    """
    Legacy ML model prediction endpoint.
    """
    if not legacy_checker:
        raise HTTPException(status_code=503, detail="Legacy ML service not available")
        
    try:
        symptoms = request.get("symptoms", [])
        if not symptoms:
            raise HTTPException(status_code=400, detail="At least one symptom is required")
        
        if isinstance(symptoms[0], dict):
            result = legacy_checker.analyze_enhanced(symptoms)
        else:
            result = legacy_checker.analyze(symptoms)
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Legacy prediction failed: {str(e)}")

@app.get("/model_info")
async def get_model_info():
    """Get information about available models"""
    info = {
        "available_models": [],
        "primary_model": None
    }
    
    if final_augmented_checker:
        try:
            final_info = final_augmented_checker.get_model_info()
            info["available_models"].append({
                "name": "final_augmented",
                "type": final_info["model_type"],
                "diseases": final_info["diseases"],
                "symptoms": final_info["symptoms"],
                "status": "primary",
                "performance": final_info["performance"]
            })
            info["primary_model"] = "final_augmented"
        except Exception as e:
            print(f"Error getting Final Augmented model info: {e}")
    
    if columbia_checker:
        try:
            columbia_info = columbia_checker.get_model_info()
            info["available_models"].append({
                "name": "columbia",
                "type": columbia_info["model_type"],
                "diseases": columbia_info["diseases"],
                "symptoms": columbia_info["symptoms"],
                "status": "active"
            })
            info["primary_model"] = "columbia"
        except Exception as e:
            print(f"Error getting Columbia model info: {e}")
    
    if legacy_checker:
        try:
            legacy_info = legacy_checker.get_model_info()
            info["available_models"].append({
                "name": "legacy", 
                "type": "Healthcare Chatbot Dataset",
                "diseases": legacy_info.get("diseases", 0),
                "symptoms": legacy_info.get("symptoms", 0), 
                "status": "available"
            })
            
            if not info["primary_model"]:
                info["primary_model"] = "legacy"
        except Exception as e:
            print(f"Error getting legacy model info: {e}")
    
    return info

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