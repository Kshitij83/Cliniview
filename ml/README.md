# Cliniview ML Service - Symptom Checker

AI-powered symptom analysis service for Cliniview healthcare platform. Predicts possible diseases based on user-reported symptoms using weighted similarity algorithms.

## Technologies Used

- **Python 3.9+**: Programming language
- **FastAPI 0.109.2**: Modern API framework
- **Pydantic 2.6.1**: Data validation
- **Uvicorn 0.27.1**: ASGI server

## Setup Instructions

1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   - **Windows**: `venv\Scripts\activate`
   - **Unix/MacOS**: `source venv/bin/activate`

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file (optional):
   ```env
   PORT=5001
   API_KEY=your_api_key_here
   ```

5. Start the server:
   ```bash
   python app.py
   ```
   
   Server runs on: `http://localhost:5001`

## Project Structure

```
ml/
├── app.py                       # FastAPI application entry point
├── requirements.txt             # Python dependencies (full)
├── requirements-minimal.txt     # Minimal dependencies
├── data/
│   ├── symptom_severity.csv           # 130+ symptoms with severity weights
│   └── symptom_disease_mapping.json   # 20+ disease profiles with recommendations
├── services/
│   └── symptom_checker.py       # Core symptom analysis algorithm
└── SYMPTOM_CHECKER_GUIDE.md     # Testing and implementation guide
```

## API Endpoints

### Main Endpoint

**POST /predict_symptom**
- **Description**: Predict possible diseases from symptoms
- **Authentication**: None required
- **Request Body**:
  ```json
  {
    "symptoms": ["fever", "cough", "headache"]
  }
  ```
- **Response**:
  ```json
  {
    "predictions": [
      {
        "disease": "Common Cold",
        "confidence": 0.782,
        "severity": "low",
        "recommendations": ["Get plenty of rest", "Stay hydrated"],
        "matching_symptoms": 3
      }
    ],
    "overall_severity": "medium",
    "severity_score": 14.0,
    "recommendation_summary": ["Monitor symptoms for 24-48 hours"],
    "total_symptoms": 3,
    "ai_response": "Based on your 3 symptom(s)..."
  }
  ```

### Health Check

**GET /health**
- Returns service health status

### Legacy Endpoint

**POST /api/symptom-check** (requires API key)
- Backward compatible endpoint

## Algorithm Details

### Symptom Matching
- Uses **Weighted Jaccard Similarity** algorithm
- Each symptom has severity weight (1-7 scale)
- Compares user symptoms against 20+ disease profiles
- Returns top 5 matches with confidence scores

### Severity Calculation
- **High**: Total score ≥ 30 OR high-severity disease with >60% confidence
- **Medium**: Total score ≥ 15 OR medium-severity disease with >50% confidence
- **Low**: Total score < 15

### Data Sources
- **symptom_severity.csv**: 130+ medical symptoms with weights
- **symptom_disease_mapping.json**: Disease profiles with:
  - Associated symptoms
  - Severity level (low/medium/high)
  - Professional medical recommendations

## Testing

### Quick Test
```bash
curl -X POST http://localhost:5001/predict_symptom \
  -H "Content-Type: application/json" \
  -d '{"symptoms": ["fever", "cough", "headache"]}'
```

### Expected Response
```json
{
  "predictions": [
    {"disease": "Common Cold", "confidence": 0.782},
    {"disease": "Influenza", "confidence": 0.651}
  ],
  "overall_severity": "medium"
}
```

## Integration

This service integrates with:
- **Backend**: Node.js/Express (`/api/ai/symptom-check`)
- **Frontend**: Next.js symptom checker page
- **Database**: Results saved to MongoDB

See `SYMPTOM_CHECKER_GUIDE.md` for full integration details.

## Development

### Run in development mode:
```bash
uvicorn app:app --reload --port 5001
```

### View API documentation:
- Swagger UI: `http://localhost:5001/docs`
- ReDoc: `http://localhost:5001/redoc`

## Notes

- ⚠️ This is a **prediction tool**, not a diagnostic system
- Always recommend users consult healthcare professionals
- Symptom names use underscore format: `high_fever`, `chest_pain`
- Frontend automatically converts user input to correct format
