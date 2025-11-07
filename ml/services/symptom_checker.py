import os
import json
import csv
from typing import List, Dict, Tuple
from collections import Counter
import math

class SymptomChecker:
    """
    AI-based Symptom Checker using symptom severity weights and disease mapping.
    Implements algorithm inspired by open-source disease predictors.
    """
    
    def __init__(self):
        """Initialize the symptom checker with symptom severity and disease mappings."""
        self.symptom_weights = self._load_symptom_weights()
        self.disease_data = self._load_disease_mapping()
        self.all_symptoms = set(self.symptom_weights.keys())
        
    def _load_symptom_weights(self) -> Dict[str, float]:
        """Load symptom severity weights from CSV file."""
        weights = {}
        csv_path = os.path.join(os.path.dirname(__file__), "..", "data", "symptom_severity.csv")
        
        try:
            with open(csv_path, 'r') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    symptom = row['Symptom'].strip().lower().replace(' ', '_')
                    weight = float(row['weight'])
                    weights[symptom] = weight
        except FileNotFoundError:
            print(f"Warning: {csv_path} not found. Using default weights.")
            return {}
            
        return weights
    
    def _load_disease_mapping(self) -> List[Dict]:
        """Load disease-symptom mappings from JSON file."""
        json_path = os.path.join(os.path.dirname(__file__), "..", "data", "symptom_disease_mapping.json")
        
        try:
            with open(json_path, 'r') as file:
                data = json.load(file)
                return data.get('diseases', [])
        except FileNotFoundError:
            print(f"Warning: {json_path} not found. Using empty disease list.")
            return []
    
    def _normalize_symptom(self, symptom: str) -> str:
        """Normalize symptom name to match dataset format."""
        return symptom.strip().lower().replace(' ', '_').replace('-', '_')
    
    def _calculate_symptom_score(self, symptoms: List[str]) -> float:
        """Calculate total severity score for given symptoms."""
        total_score = 0.0
        for symptom in symptoms:
            normalized = self._normalize_symptom(symptom)
            weight = self.symptom_weights.get(normalized, 2.0)  # Default weight: 2.0
            total_score += weight
        return total_score
    
    def _calculate_match_probability(
        self, 
        user_symptoms: List[str], 
        disease_symptoms: List[str]
    ) -> float:
        """
        Calculate probability of disease based on symptom matching.
        Uses Jaccard similarity with severity weighting.
        """
        user_set = set([self._normalize_symptom(s) for s in user_symptoms])
        disease_set = set([self._normalize_symptom(s) for s in disease_symptoms])
        
        # Calculate intersection (matching symptoms)
        intersection = user_set.intersection(disease_set)
        
        if not intersection:
            return 0.0
        
        # Weight by severity
        match_score = sum([self.symptom_weights.get(s, 2.0) for s in intersection])
        disease_total_score = sum([self.symptom_weights.get(s, 2.0) for s in disease_set])
        user_total_score = sum([self.symptom_weights.get(s, 2.0) for s in user_set])
        
        # Normalize using weighted Jaccard index
        if user_total_score + disease_total_score == 0:
            return 0.0
            
        probability = (2 * match_score) / (user_total_score + disease_total_score)
        
        # Boost if user has many disease symptoms
        coverage_bonus = len(intersection) / len(disease_set) if disease_set else 0
        probability = (probability * 0.7) + (coverage_bonus * 0.3)
        
        return min(probability, 1.0)
    
    def predict_diseases(self, symptoms: List[str], top_n: int = 5) -> List[Dict]:
        """
        Predict possible diseases based on input symptoms.
        
        Args:
            symptoms: List of user-reported symptoms
            top_n: Number of top predictions to return
            
        Returns:
            List of disease predictions with confidence scores
        """
        if not symptoms:
            return []
        
        predictions = []
        
        for disease in self.disease_data:
            probability = self._calculate_match_probability(symptoms, disease['symptoms'])
            
            if probability > 0.05:  # Threshold to filter out very low matches
                predictions.append({
                    'disease': disease['name'],
                    'confidence': round(probability, 3),
                    'severity': disease['severity'],
                    'recommendations': disease['recommendations'],
                    'matching_symptoms': len(set([self._normalize_symptom(s) for s in symptoms]).intersection(
                        set([self._normalize_symptom(s) for s in disease['symptoms']])
                    ))
                })
        
        # Sort by confidence (descending)
        predictions.sort(key=lambda x: x['confidence'], reverse=True)
        
        return predictions[:top_n]
    
    def analyze(self, symptoms: List[str]) -> Dict:
        """
        Comprehensive symptom analysis.
        
        Args:
            symptoms: List of reported symptoms
            
        Returns:
            Dictionary with predictions, overall severity, and recommendations
        """
        if not symptoms:
            return {
                'predictions': [],
                'overall_severity': 'unknown',
                'severity_score': 0,
                'recommendation_summary': ['Please enter at least one symptom for analysis'],
                'total_symptoms': 0
            }
        
        # Get disease predictions
        predictions = self.predict_diseases(symptoms, top_n=5)
        
        # Calculate overall severity
        severity_score = self._calculate_symptom_score(symptoms)
        
        # Determine overall severity level
        if severity_score >= 30 or any(p['severity'] == 'high' and p['confidence'] > 0.6 for p in predictions):
            overall_severity = 'high'
        elif severity_score >= 15 or any(p['severity'] == 'medium' and p['confidence'] > 0.5 for p in predictions):
            overall_severity = 'medium'
        else:
            overall_severity = 'low'
        
        # Generate general recommendations
        recommendation_summary = self._generate_general_recommendations(
            overall_severity, 
            len(symptoms),
            predictions
        )
        
        # Create AI response summary
        if predictions:
            top_disease = predictions[0]['disease']
            confidence = predictions[0]['confidence']
            ai_response = (
                f"Based on your {len(symptoms)} symptom(s), the most likely condition is "
                f"{top_disease} with {confidence*100:.1f}% confidence. "
                f"This assessment is based on symptom pattern matching and severity analysis."
            )
        else:
            ai_response = (
                f"Unable to determine a specific condition from the provided symptoms. "
                f"Please consult a healthcare professional for proper diagnosis."
            )
        
        return {
            'predictions': predictions,
            'overall_severity': overall_severity,
            'severity_score': round(severity_score, 2),
            'recommendation_summary': recommendation_summary,
            'total_symptoms': len(symptoms),
            'ai_response': ai_response
        }
    
    def _generate_general_recommendations(
        self, 
        severity: str, 
        symptom_count: int,
        predictions: List[Dict]
    ) -> List[str]:
        """Generate general health recommendations based on analysis."""
        recommendations = []
        
        if severity == 'high':
            recommendations.append('⚠️ Seek immediate medical attention - your symptoms may require urgent care')
            recommendations.append('Do not delay consulting a healthcare professional')
        elif severity == 'medium':
            recommendations.append('Schedule an appointment with your doctor within 24-48 hours')
            recommendations.append('Monitor your symptoms closely for any changes')
        else:
            recommendations.append('Monitor your symptoms for the next 24-48 hours')
            recommendations.append('Consider self-care measures and over-the-counter remedies if appropriate')
        
        # Add common general advice
        recommendations.extend([
            'Stay well hydrated by drinking plenty of water',
            'Get adequate rest and sleep',
            'Avoid self-medication without professional guidance',
            'Keep a record of your symptoms and any changes'
        ])
        
        # Add specific advice from top prediction if available
        if predictions and predictions[0]['confidence'] > 0.5:
            top_recs = predictions[0]['recommendations'][:2]  # First 2 specific recommendations
            recommendations.extend(top_recs)
        
        return recommendations[:8]  # Limit to 8 recommendations
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