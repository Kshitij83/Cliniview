import os
from typing import List, Dict, Optional
import numpy as np
import json
from utils.model_loader import load_symptom_model

class SymptomChecker:
    def __init__(self):
        """Initialize the symptom checker with pre-trained models."""
        self.model = load_symptom_model()
        # Load symptom-disease mappings
        with open(os.path.join("data", "symptom_mapping.json"), "r") as f:
            self.symptom_map = json.load(f)
        
        # Initialize severity levels and recommendations
        self.severity_thresholds = {
            "high": 0.7,
            "medium": 0.4,
            "low": 0.0
        }
        
    def analyze(
        self, 
        symptoms: List[str],
        age: Optional[int] = None,
        gender: Optional[str] = None,
        medical_history: Optional[List[str]] = None
    ) -> Dict:
        """
        Analyze symptoms and return possible conditions.
        
        Args:
            symptoms: List of reported symptoms
            age: Patient age (optional)
            gender: Patient gender (optional)
            medical_history: List of pre-existing conditions (optional)
            
        Returns:
            Dictionary with possible conditions, recommendations, severity, and explanation
        """
        # In a real implementation, we would:
        # 1. Preprocess symptoms
        # 2. Run them through a trained model
        # 3. Return predictions with confidence scores
        
        # Mock implementation for demonstration
        possible_conditions = self._mock_condition_prediction(symptoms, medical_history)
        
        # Determine severity based on highest probability condition
        max_prob = max([c["probability"] for c in possible_conditions])
        severity = "high" if max_prob >= self.severity_thresholds["high"] else \
                  "medium" if max_prob >= self.severity_thresholds["medium"] else "low"
        
        # Generate recommendations based on conditions and severity
        recommendations = self._generate_recommendations(possible_conditions, severity)
        
        # Generate explanation
        explanation = self._generate_explanation(symptoms, possible_conditions)
        
        return {
            "possible_conditions": possible_conditions,
            "recommendations": recommendations,
            "severity": severity,
            "explanation": explanation
        }
    
    def _mock_condition_prediction(self, symptoms: List[str], medical_history: Optional[List[str]] = None) -> List[Dict]:
        """Mock prediction function - in production, this would use a trained model."""
        # Map of common symptoms to conditions with probabilities
        common_mappings = {
            "headache": [
                {"name": "Migraine", "probability": 0.65},
                {"name": "Tension headache", "probability": 0.45},
                {"name": "Sinusitis", "probability": 0.30}
            ],
            "fever": [
                {"name": "Common cold", "probability": 0.70},
                {"name": "Influenza", "probability": 0.60},
                {"name": "COVID-19", "probability": 0.50}
            ],
            "cough": [
                {"name": "Common cold", "probability": 0.75},
                {"name": "Bronchitis", "probability": 0.45},
                {"name": "COVID-19", "probability": 0.40}
            ],
            "fatigue": [
                {"name": "Influenza", "probability": 0.55},
                {"name": "Anemia", "probability": 0.40},
                {"name": "Depression", "probability": 0.35}
            ],
            "shortness of breath": [
                {"name": "Asthma", "probability": 0.70},
                {"name": "COVID-19", "probability": 0.50},
                {"name": "Heart failure", "probability": 0.30}
            ],
            "chest pain": [
                {"name": "Angina", "probability": 0.60},
                {"name": "Myocardial infarction", "probability": 0.40},
                {"name": "Acid reflux", "probability": 0.30}
            ]
        }
        
        # Aggregate condition probabilities from all symptoms
        condition_scores = {}
        
        for symptom in symptoms:
            symptom = symptom.lower()
            if symptom in common_mappings:
                for condition in common_mappings[symptom]:
                    if condition["name"] not in condition_scores:
                        condition_scores[condition["name"]] = 0
                    
                    # Increase score based on symptom's contribution
                    condition_scores[condition["name"]] += condition["probability"]
        
        # Normalize and adjust for medical history
        if medical_history:
            for condition in condition_scores:
                for history_item in medical_history:
                    if condition.lower() in history_item.lower():
                        condition_scores[condition] *= 1.5  # Boost score for relevant history
        
        # Convert to list and normalize
        result = []
        for condition, score in condition_scores.items():
            # Normalize to 0-1 range
            prob = min(score / (len(symptoms) * 0.8), 1.0)
            
            result.append({
                "name": condition,
                "probability": round(prob, 2),
                "description": f"A condition characterized by {', '.join(symptoms)}."
            })
        
        # Sort by probability
        result.sort(key=lambda x: x["probability"], reverse=True)
        
        # Return top conditions
        return result[:5] if result else [{"name": "Insufficient data", "probability": 0.0, "description": "Not enough symptoms to determine a condition."}]
    
    def _generate_recommendations(self, conditions: List[Dict], severity: str) -> List[str]:
        """Generate recommendations based on conditions and severity."""
        recommendations = []
        
        # Basic recommendations based on severity
        if severity == "high":
            recommendations.append("Seek immediate medical attention.")
        elif severity == "medium":
            recommendations.append("Schedule an appointment with your doctor within the next few days.")
        else:
            recommendations.append("Monitor your symptoms. If they persist or worsen, consult your doctor.")
        
        # Add condition-specific recommendations
        for condition in conditions[:2]:  # Only use top two conditions
            if condition["name"] == "COVID-19":
                recommendations.append("Self-isolate and get tested for COVID-19.")
            elif condition["name"] in ["Migraine", "Tension headache"]:
                recommendations.append("Rest in a dark, quiet room and stay hydrated.")
            elif condition["name"] in ["Common cold", "Influenza"]:
                recommendations.append("Get plenty of rest and drink fluids.")
            elif condition["name"] == "Asthma":
                recommendations.append("Use your prescribed inhaler and avoid triggers.")
        
        return list(set(recommendations))  # Remove duplicates
    
    def _generate_explanation(self, symptoms: List[str], conditions: List[Dict]) -> str:
        """Generate a human-readable explanation of the analysis."""
        if not conditions or conditions[0]["name"] == "Insufficient data":
            return "There's not enough symptom information to make a reliable assessment."
        
        top_condition = conditions[0]
        explanation = f"Based on your symptoms ({', '.join(symptoms)}), "
        explanation += f"the most likely condition is {top_condition['name']} "
        explanation += f"with a {int(top_condition['probability'] * 100)}% probability. "
        
        if len(conditions) > 1:
            explanation += f"Other possibilities include {', '.join([c['name'] for c in conditions[1:3]])}. "
        
        if top_condition["probability"] >= 0.7:
            explanation += "The analysis has high confidence in this assessment."
        elif top_condition["probability"] >= 0.4:
            explanation += "The analysis has moderate confidence in this assessment."
        else:
            explanation += "The analysis has low confidence in this assessment and more information may be needed."
        
        return explanation