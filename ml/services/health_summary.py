import os
from typing import List, Dict
import json
from utils.model_loader import load_health_summary_model
from utils.text_extraction import extract_text_from_document

class HealthSummaryGenerator:
    def __init__(self):
        """Initialize the health summary generator with pre-trained models."""
        self.model = load_health_summary_model()
        
        # Load medical terminology mapping
        with open(os.path.join("data", "medical_terms.json"), "r") as f:
            self.medical_terms = json.load(f)
    
    def generate(self, patient_id: str, document_urls: List[str], document_types: List[str]) -> Dict:
        """
        Generate a comprehensive health summary from medical documents.
        
        Args:
            patient_id: Patient identifier
            document_urls: List of URLs to medical documents
            document_types: Types of documents (corresponding to document_urls)
            
        Returns:
            Dictionary with summary, risk factors, recommendations, and confidence
        """
        # In a real implementation, we would:
        # 1. Extract text from documents
        # 2. Process text through NLP models
        # 3. Generate summary and insights
        
        # Mock implementation for demonstration
        extracted_texts = []
        
        for i, url in enumerate(document_urls):
            doc_type = document_types[i] if i < len(document_types) else "unknown"
            # In production, this would download and process actual documents
            text = extract_text_from_document(url, doc_type)
            extracted_texts.append(text)
        
        # Generate summary from extracted text
        summary = self._generate_mock_summary(extracted_texts, document_types)
        
        # Identify risk factors
        risk_factors = self._identify_risk_factors(extracted_texts)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(risk_factors)
        
        return {
            "summary": summary,
            "risk_factors": risk_factors,
            "recommendations": recommendations,
            "confidence": 0.85  # Mock confidence score
        }
    
    def _generate_mock_summary(self, texts: List[str], document_types: List[str]) -> str:
        """Generate a mock health summary - in production, this would use a trained model."""
        # This is a simplified mock function
        summary_parts = []
        
        # Look for patterns in the mock texts
        has_prescription = "prescription" in " ".join(document_types).lower()
        has_lab_report = "lab" in " ".join(document_types).lower() or "report" in " ".join(document_types).lower()
        has_medical_history = "history" in " ".join(document_types).lower()
        
        # Generate appropriate summary sections
        if has_medical_history:
            summary_parts.append("Patient has a history of hypertension and type 2 diabetes, diagnosed in 2018.")
        
        if has_lab_report:
            summary_parts.append("Recent laboratory tests show elevated HbA1c levels (7.2%), indicating suboptimal glycemic control. Lipid profile shows moderately elevated LDL cholesterol (142 mg/dL).")
        
        if has_prescription:
            summary_parts.append("Current medications include Metformin 500mg twice daily, Lisinopril 10mg once daily, and Atorvastatin 20mg once daily.")
        
        # Default section if we don't have specific document types
        if not summary_parts:
            summary_parts.append("Patient medical records indicate regular check-ups but insufficient documentation to generate a comprehensive health summary.")
        
        # Add general conclusion
        summary_parts.append("Overall, the patient shows signs of metabolic syndrome with cardiovascular risk factors that require continued monitoring and lifestyle modifications alongside medication management.")
        
        return " ".join(summary_parts)
    
    def _identify_risk_factors(self, texts: List[str]) -> List[str]:
        """Identify health risk factors from medical texts."""
        # In production, this would use NLP to identify actual risk factors
        # For mock purposes, return common risk factors
        risk_factors = [
            "Type 2 Diabetes",
            "Hypertension",
            "Elevated LDL cholesterol",
            "Overweight (BMI 28.4)",
            "Sedentary lifestyle"
        ]
        
        return risk_factors
    
    def _generate_recommendations(self, risk_factors: List[str]) -> List[str]:
        """Generate health recommendations based on identified risk factors."""
        recommendations = []
        
        # Map common risk factors to recommendations
        risk_recommendation_map = {
            "diabetes": [
                "Monitor blood glucose regularly",
                "Follow a low-glycemic diet",
                "Engage in regular physical activity"
            ],
            "hypertension": [
                "Limit sodium intake to less than 2,300mg daily",
                "Monitor blood pressure regularly",
                "Consider the DASH diet"
            ],
            "cholesterol": [
                "Increase intake of soluble fiber",
                "Limit saturated and trans fats",
                "Consider plant sterols supplements"
            ],
            "overweight": [
                "Aim for 150 minutes of moderate exercise weekly",
                "Focus on portion control",
                "Keep a food journal to track caloric intake"
            ],
            "sedentary": [
                "Break up sitting time with short walks",
                "Consider standing desk options",
                "Schedule regular exercise sessions"
            ]
        }
        
        # Generate recommendations based on identified risk factors
        for factor in risk_factors:
            factor_lower = factor.lower()
            for key, recs in risk_recommendation_map.items():
                if key in factor_lower:
                    recommendations.extend(recs)
        
        # Add general recommendations
        general_recommendations = [
            "Schedule regular follow-up appointments",
            "Maintain consistent medication adherence",
            "Consider consulting with a registered dietitian"
        ]
        
        recommendations.extend(general_recommendations)
        
        return list(set(recommendations))  # Remove duplicates