# Cliniview ML Service

Machine learning service for Cliniview healthcare platform that provides symptom analysis, medical document processing, and health risk predictions.

## Technologies Used

- **Python**: Programming language
- **FastAPI**: API framework
- **TensorFlow/PyTorch**: Deep learning frameworks
- **scikit-learn**: Machine learning library
- **Transformers**: NLP models (BERT, GPT)
- **Pandas/NumPy**: Data processing

## Setup Instructions

1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with configuration values:
   ```
   PORT=5000
   MODEL_PATH=./models
   API_KEY=your_api_key
   BACKEND_URL=http://localhost:3001/api
   ```

5. Start the server:
   ```bash
   python app.py
   ```

## Project Structure

```
/
├── app.py                  # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── models/                 # Pre-trained models
├── data/                   # Training and test data
├── services/
│   ├── symptom_checker.py  # Symptom analysis service
│   ├── health_summary.py   # Health summary generation
│   └── risk_prediction.py  # Risk prediction models
├── utils/
│   ├── data_processing.py  # Data preprocessing utilities
│   ├── model_loader.py     # Model loading utilities
│   └── text_extraction.py  # Text extraction from medical documents
└── tests/                  # Unit tests
```

## API Endpoints

- **POST /api/symptom-check**: Analyze symptoms and predict possible conditions
- **POST /api/health-summary**: Generate a comprehensive health summary from medical records
- **POST /api/risk-prediction**: Predict health risks based on medical data

## Models

The system uses several machine learning models:

1. **Symptom Checker**: BERT-based model fine-tuned on medical symptom data
2. **Medical Text Classification**: CNN model for categorizing medical documents
3. **Risk Prediction**: Ensemble of Random Forest and Gradient Boosting models

## Development

1. Train models:
   ```bash
   python train.py
   ```

2. Run tests:
   ```bash
   pytest
   ```

3. Generate API documentation:
   ```bash
   python -m docs
   ```