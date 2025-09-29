from typing import Dict, List
import numpy as np
from utils.model_loader import load_risk_model

class RiskPredictor:
    def __init__(self):
        """Initialize the risk prediction models."""
        self.model = load_risk_model()
        self.risk_types = [
            "cardiovascular", 
            "diabetes", 
            "respiratory", 
            "cancer",
            "mental_health"
        ]
    
    def predict(self, patient_id: str, medical_data: Dict) -> Dict:
        """
        Predict health risks based on medical data.
        
        Args:
            patient_id: Patient identifier
            medical_data: Dictionary containing medical information
            
        Returns:
            Dictionary with risk scores and recommendations
        """
        # In a real implementation, we would:
        # 1. Preprocess the medical data
        # 2. Run it through trained risk prediction models
        # 3. Generate scores and recommendations
        
        # Mock implementation for demonstration
        risk_scores = self._calculate_mock_risk_scores(medical_data)
        recommendations = self._generate_recommendations(risk_scores)
        
        return {
            "risk_scores": risk_scores,
            "recommendations": recommendations
        }
    
    def _calculate_mock_risk_scores(self, medical_data: Dict) -> Dict[str, float]:
        """Calculate mock risk scores for demonstration."""
        risk_scores = {}
        
        # Extract relevant factors from medical data (mock implementation)
        age = medical_data.get("age", 45)
        bmi = medical_data.get("bmi", 25)
        systolic_bp = medical_data.get("systolic_bp", 120)
        diastolic_bp = medical_data.get("diastolic_bp", 80)
        cholesterol = medical_data.get("cholesterol", 200)
        glucose = medical_data.get("glucose", 100)
        smoking = medical_data.get("smoking", False)
        family_history = medical_data.get("family_history", {})
        
        # Calculate cardiovascular risk (mock algorithm)
        cv_risk = 0.0
        cv_risk += (age - 40) * 0.01 if age > 40 else 0
        cv_risk += (bmi - 25) * 0.02 if bmi > 25 else 0
        cv_risk += (systolic_bp - 120) * 0.005 if systolic_bp > 120 else 0
        cv_risk += (diastolic_bp - 80) * 0.005 if diastolic_bp > 80 else 0
        cv_risk += (cholesterol - 200) * 0.001 if cholesterol > 200 else 0
        cv_risk += 0.1 if smoking else 0
        cv_risk += 0.05 if family_history.get("heart_disease") else 0
        risk_scores["cardiovascular"] = min(max(cv_risk, 0.0), 1.0)
        
        # Calculate diabetes risk (mock algorithm)
        db_risk = 0.0
        db_risk += (bmi - 25) * 0.03 if bmi > 25 else 0
        db_risk += (glucose - 100) * 0.002 if glucose > 100 else 0
        db_risk += 0.1 if family_history.get("diabetes") else 0
        db_risk += (age - 40) * 0.005 if age > 40 else 0
        risk_scores["diabetes"] = min(max(db_risk, 0.0), 1.0)
        
        # Calculate respiratory risk (mock algorithm)
        resp_risk = 0.0
        resp_risk += 0.3 if smoking else 0
        resp_risk += 0.1 if medical_data.get("asthma") else 0
        resp_risk += 0.05 if family_history.get("respiratory_disease") else 0
        risk_scores["respiratory"] = min(max(resp_risk, 0.0), 1.0)
        
        # Calculate cancer risk (mock algorithm)
        cancer_risk = 0.0
        cancer_risk += 0.2 if smoking else 0
        cancer_risk += (age - 50) * 0.005 if age > 50 else 0
        cancer_risk += 0.1 if family_history.get("cancer") else 0
        risk_scores["cancer"] = min(max(cancer_risk, 0.0), 1.0)
        
        # Calculate mental health risk (mock algorithm)
        mental_risk = 0.0
        mental_risk += 0.1 if medical_data.get("stress") else 0
        mental_risk += 0.2 if medical_data.get("depression_history") else 0
        mental_risk += 0.1 if family_history.get("mental_health") else 0
        risk_scores["mental_health"] = min(max(mental_risk, 0.0), 1.0)
        
        return {k: round(v, 2) for k, v in risk_scores.items()}
    
    def _generate_recommendations(self, risk_scores: Dict[str, float]) -> Dict[str, List[str]]:
        """Generate recommendations based on risk scores."""
        recommendations = {}
        
        # Thresholds for risk levels
        high_threshold = 0.7
        medium_threshold = 0.4
        
        # Cardiovascular risk recommendations
        cv_score = risk_scores.get("cardiovascular", 0)
        cv_recs = []
        
        if cv_score >= high_threshold:
            cv_recs = [
                "Schedule an appointment with a cardiologist within the next month",
                "Start daily monitoring of blood pressure",
                "Consider a heart-healthy Mediterranean diet",
                "Begin a monitored exercise program with professional guidance"
            ]
        elif cv_score >= medium_threshold:
            cv_recs = [
                "Schedule a cardiovascular check-up within the next 3 months",
                "Monitor blood pressure weekly",
                "Reduce sodium intake to less than 2,300mg daily",
                "Begin 150 minutes of moderate aerobic exercise weekly"
            ]
        else:
            cv_recs = [
                "Continue regular cardiovascular check-ups",
                "Maintain a heart-healthy lifestyle"
            ]
        
        recommendations["cardiovascular"] = cv_recs
        
        # Diabetes risk recommendations
        db_score = risk_scores.get("diabetes", 0)
        db_recs = []
        
        if db_score >= high_threshold:
            db_recs = [
                "Schedule an appointment with an endocrinologist",
                "Begin glucose monitoring",
                "Adopt a low-glycemic diet plan",
                "Aim for 30 minutes of daily physical activity"
            ]
        elif db_score >= medium_threshold:
            db_recs = [
                "Schedule glucose tolerance test",
                "Limit refined carbohydrates and added sugars",
                "Include more fiber-rich foods in your diet",
                "Aim for 150 minutes of moderate exercise weekly"
            ]
        else:
            db_recs = [
                "Maintain healthy blood sugar with balanced diet",
                "Continue regular health check-ups"
            ]
        
        recommendations["diabetes"] = db_recs
        
        # Similar patterns for other risk categories
        # (simplified for this mock implementation)
        
        # Add general recommendations for all categories
        for category in self.risk_types:
            if category not in recommendations:
                recommendations[category] = [
                    "Continue regular health check-ups",
                    "Maintain a balanced diet and regular exercise"
                ]
        
        return recommendations