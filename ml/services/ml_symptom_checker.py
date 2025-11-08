#!/usr/bin/env python3
"""
ML-based Symptom Checker for CliniView Healthcare Platform
Uses trained Decision Tree classifier for disease prediction.

Replaces rule-based symptom matching with real machine learning.
Maintains same API interface as original SymptomChecker.
"""

import os
import json
import csv
import pickle
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from collections import Counter
import warnings

warnings.filterwarnings("ignore", category=UserWarning)

class MLSymptomChecker:
    """
    AI-based Symptom Checker using trained Machine Learning model.
    Uses Decision Tree classifier trained on 4,920 medical cases.
    """
    
    def __init__(self):
        """Initialize the ML symptom checker with trained model and metadata."""
        self.model = None
        self.symptom_columns = []
        self.label_encoder = None
        self.disease_descriptions = {}
        self.model_metadata = {}
        
        # Load all components
        self._load_model()
        self._load_disease_descriptions()
        
        print(f"✅ ML Symptom Checker loaded: {len(self.symptom_columns)} symptoms, {len(self.label_encoder.classes_)} diseases")
    
    def _load_model(self):
        """Load the trained ML model and associated metadata."""
        models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
        
        try:
            # Load trained model
            model_path = os.path.join(models_dir, "symptom_classifier.pkl")
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            
            # Load symptom columns (feature names)
            symptoms_path = os.path.join(models_dir, "symptom_columns.pkl")
            with open(symptoms_path, 'rb') as f:
                self.symptom_columns = pickle.load(f)
            
            # Load label encoder (disease names)
            encoder_path = os.path.join(models_dir, "label_encoder.pkl")
            with open(encoder_path, 'rb') as f:
                self.label_encoder = pickle.load(f)
            
            # Load model metadata
            metadata_path = os.path.join(models_dir, "model_metadata.pkl")
            with open(metadata_path, 'rb') as f:
                self.model_metadata = pickle.load(f)
                
        except FileNotFoundError as e:
            raise RuntimeError(f"ML model files not found: {e}. Please run train_model.py first.")
        except Exception as e:
            raise RuntimeError(f"Failed to load ML model: {e}")
    
    def _load_disease_descriptions(self) -> Dict[str, str]:
        """Load disease descriptions for better user experience."""
        descriptions_path = os.path.join(os.path.dirname(__file__), "..", "data", "symptom_Description.csv")
        
        descriptions = {}
        try:
            with open(descriptions_path, 'r') as file:
                reader = csv.reader(file)
                for row in reader:
                    if len(row) >= 2:
                        disease = row[0].strip()
                        description = row[1].strip()
                        descriptions[disease] = description
            
            self.disease_descriptions = descriptions
            
        except FileNotFoundError:
            print(f"Warning: {descriptions_path} not found. Disease descriptions unavailable.")
            self.disease_descriptions = {}
    
    def _normalize_symptom(self, symptom: str) -> str:
        """Normalize symptom name to match training data format."""
        normalized = symptom.lower().strip().replace(' ', '_').replace('-', '_')
        
        # Smart mapping for common frontend → training data mismatches
        symptom_mappings = {
            'fever': 'high_fever',  # Map generic fever to high_fever
            'cough': 'cough',       # Direct match
            'headache': 'headache', # Direct match
            'fatigue': 'fatigue',   # Direct match
            'nausea': 'nausea',     # Direct match
            'vomiting': 'vomiting', # Direct match
            'diarrhea': 'diarrhoea', # Spelling variant
            'diarrhoea': 'diarrhoea',
            'stomach_ache': 'stomach_pain',
            'stomach_pain': 'stomach_pain',
            'abdominal_pain': 'abdominal_pain',
            'chest_pain': 'chest_pain',
            'back_pain': 'back_pain',
            'joint_pain': 'joint_pain',
            'muscle_pain': 'muscle_pain',
            'muscle_weakness': 'muscle_weakness',
            'shortness_of_breath': 'breathlessness',
            'difficulty_breathing': 'breathlessness',
            'breathlessness': 'breathlessness',
            'skin_rash': 'skin_rash',
            'rash': 'skin_rash',
            'itching': 'itching',
            'sweating': 'sweating',
            'dizziness': 'dizziness',
            'weakness': 'weakness_in_limbs',
            'weight_loss': 'weight_loss',
            'weight_gain': 'weight_gain',
            'loss_of_appetite': 'loss_of_appetite',
            'constipation': 'constipation',
            'dehydration': 'dehydration',
            'chills': 'chills',
            'shivering': 'shivering'
        }
        
        return symptom_mappings.get(normalized, normalized)
        
        # Handle common symptom name variations and mappings
        symptom_mappings = {
            'fever': 'high_fever',  # Default fever to high_fever
            'mild_fever': 'mild_fever',
            'high_fever': 'high_fever',
            'severe_fever': 'high_fever',
            'pain_behind_eyes': 'pain_behind_the_eyes',
            'back_pain': 'back_pain',
            'chest_pain': 'chest_pain',
            'neck_pain': 'neck_pain',
            'knee_pain': 'knee_pain',
            'hip_pain': 'hip_joint_pain',
            'muscle_pain': 'muscle_pain',
            'joint_pain': 'joint_pain',
            'stomach_pain': 'stomach_pain',
            'abdominal_pain': 'abdominal_pain',
            'headache': 'headache',
            'nausea': 'nausea',
            'vomiting': 'vomiting',
            'diarrhea': 'diarrhoea',
            'diarrhoea': 'diarrhoea',
            'constipation': 'constipation',
            'fatigue': 'fatigue',
            'weakness': 'muscle_weakness',
            'muscle_weakness': 'muscle_weakness',
            'cough': 'cough',
            'sneezing': 'continuous_sneezing',
            'runny_nose': 'runny_nose',
            'sore_throat': 'throat_irritation',
            'throat_irritation': 'throat_irritation',
            'skin_rash': 'skin_rash',
            'rash': 'skin_rash',
            'itching': 'itching',
            'sweating': 'sweating',
            'chills': 'chills',
            'shivering': 'shivering',
            'breathlessness': 'breathlessness',
            'difficulty_breathing': 'breathlessness',
            'shortness_of_breath': 'breathlessness',
            'dizziness': 'dizziness',
            'weight_loss': 'weight_loss',
            'weight_gain': 'weight_gain',
            'loss_of_appetite': 'loss_of_appetite',
            'appetite_loss': 'loss_of_appetite'
        }
        
        # Try direct mapping first
        if normalized in symptom_mappings:
            return symptom_mappings[normalized]
        
        # Try fuzzy matching for unmapped symptoms
        for key, value in symptom_mappings.items():
            if normalized in key or key in normalized:
                return value
        
        return normalized
    
    def _create_feature_vector_enhanced(self, symptom_objects: List[Dict]) -> np.ndarray:
        """
        Create enhanced feature vector from symptom objects with severity and duration.
        
        Args:
            symptom_objects: List of {"name": str, "severity": str, "duration": str}
        
        Returns:
            Numpy array ready for ML model prediction
        """
        # Initialize feature vector with zeros
        feature_vector = np.zeros(len(self.symptom_columns))
        matched_symptoms = []
        unmatched_symptoms = []
        
        # Severity mapping: mild -> 2, moderate -> 4.5, severe -> 7
        severity_weights = {
            'mild': 2.0,
            'moderate': 4.5, 
            'severe': 7.0
        }
        
        # Duration multipliers: longer duration = more concerning
        duration_multipliers = {
            '1 day': 0.7,
            '2-3 days': 1.0,
            '1 week': 1.3,
            '2+ weeks': 1.8
        }
        
        # Process each symptom object
        for symptom_obj in symptom_objects:
            if isinstance(symptom_obj, dict):
                symptom_name = symptom_obj.get('name', '')
                severity = symptom_obj.get('severity', 'moderate')
                duration = symptom_obj.get('duration', '2-3 days')
            else:
                # Backward compatibility: plain string symptom
                symptom_name = str(symptom_obj)
                severity = 'moderate'
                duration = '2-3 days'
            
            normalized_symptom = self._normalize_symptom(symptom_name)
            
            # Try to find matching column in training data
            found_match = False
            for j, col_symptom in enumerate(self.symptom_columns):
                col_normalized = col_symptom.lower().strip().replace(' ', '_').replace('-', '_')
                
                if col_normalized == normalized_symptom:
                    # Calculate enhanced score using severity and duration
                    severity_score = severity_weights.get(severity, 4.5)
                    duration_multiplier = duration_multipliers.get(duration, 1.0)
                    
                    # Final score: (severity / 7.0) * duration_multiplier
                    feature_vector[j] = (severity_score / 7.0) * duration_multiplier
                    
                    matched_symptoms.append(f"{symptom_name} ({severity}, {duration}) → {col_symptom}")
                    found_match = True
                    break
            
            if not found_match:
                unmatched_symptoms.append(f"{symptom_name} (severity: {severity}, duration: {duration})")
        
        # Debug output
        print(f"🔍 Enhanced Symptom Matching Results:")
        print(f"   ✅ Matched ({len(matched_symptoms)}): {matched_symptoms}")
        if unmatched_symptoms:
            print(f"   ❌ Unmatched ({len(unmatched_symptoms)}): {unmatched_symptoms}")
        print(f"   📊 Enhanced feature vector sum: {feature_vector.sum():.2f}")
        
        return feature_vector
        """
        Create feature vector from symptoms for ML model prediction.
        
        Args:
            symptoms: List of symptom names
            severities: Optional list of severity scores (1-7) for each symptom
        
        Returns:
            Numpy array ready for ML model prediction
        """
        # Initialize feature vector with zeros
        feature_vector = np.zeros(len(self.symptom_columns))
        
        # Normalize input symptoms using improved mapping
        normalized_symptoms = []
        for symptom in symptoms:
            normalized = self._normalize_symptom(symptom)
            normalized_symptoms.append(normalized)
        
        print(f"🔍 DEBUG: Original symptoms: {symptoms}")
        print(f"🔍 DEBUG: Normalized symptoms: {normalized_symptoms}")
        
        # Map symptoms to feature vector with better matching
        matched_symptoms = []
        for i, col_symptom in enumerate(self.symptom_columns):
            col_normalized = col_symptom.lower().strip().replace(' ', '_').replace('-', '_')
            
            # Try exact match first
            if col_normalized in normalized_symptoms:
                symptom_index = normalized_symptoms.index(col_normalized)
                
                # Use severity if provided, otherwise binary (1)
                if severities and len(severities) > symptom_index:
                    # Scale severity (1-7) to (0.2-1.0) for better ML performance
                    severity = severities[symptom_index]
                    feature_vector[i] = min(max(severity / 7.0, 0.1), 1.0)
                else:
                    feature_vector[i] = 1.0
                
                matched_symptoms.append(col_symptom)
        
        print(f"✅ DEBUG: Matched {len(matched_symptoms)} symptoms: {matched_symptoms}")
        print(f"📊 DEBUG: Feature vector sum: {feature_vector.sum()}")
        
        return feature_vector
    
    def _get_disease_severity(self, disease_name: str) -> str:
        """Estimate disease severity based on disease name and medical knowledge."""
        disease_lower = disease_name.lower()
        
        # High severity conditions
        high_severity_keywords = [
            'heart attack', 'stroke', 'hemorrhage', 'hepatitis', 'tuberculosis',
            'pneumonia', 'paralysis', 'aids', 'cancer', 'tumor'
        ]
        
        # Medium severity conditions  
        medium_severity_keywords = [
            'diabetes', 'hypertension', 'asthma', 'arthritis', 'migraine',
            'ulcer', 'gastroenteritis', 'bronchial', 'thyroid'
        ]
        
        # Check for high severity
        if any(keyword in disease_lower for keyword in high_severity_keywords):
            return 'high'
        
        # Check for medium severity
        if any(keyword in disease_lower for keyword in medium_severity_keywords):
            return 'medium'
        
        # Default to low severity
        return 'low'
    
    def _apply_medical_safety_constraints(self, predictions: List[Dict], symptom_objects: List[Dict]) -> List[Dict]:
        """Apply medical logic to filter unrealistic predictions."""
        safe_predictions = []
        symptom_count = len(symptom_objects)
        
        # Extract symptom names for analysis
        symptom_names = []
        for obj in symptom_objects:
            if isinstance(obj, dict):
                symptom_names.append(obj.get('name', '').lower())
            else:
                symptom_names.append(str(obj).lower())
        
        for pred in predictions:
            disease_name = pred['disease'].lower()
            original_confidence = pred['confidence']
            
            # Medical safety rules
            confidence_multiplier = 1.0
            safety_notes = []
            
            # Rule 1: High-stakes diseases need multiple symptoms
            serious_diseases = ['aids', 'heart attack', 'stroke', 'cancer', 'tuberculosis', 
                             'paralysis', 'brain hemorrhage', 'hepatitis']
            
            if any(serious in disease_name for serious in serious_diseases):
                if symptom_count < 3:
                    confidence_multiplier *= 0.15  # Drastically reduce confidence
                    safety_notes.append("Serious conditions typically require multiple symptoms")
                elif symptom_count < 2:
                    confidence_multiplier *= 0.05  # Almost eliminate
                    safety_notes.append("Single-symptom diagnosis of serious conditions is unreliable")
            
            # Rule 2: Common symptoms shouldn't directly suggest rare diseases
            common_symptoms = ['fever', 'headache', 'fatigue', 'cough', 'nausea']
            if (len([s for s in symptom_names if any(common in s for common in common_symptoms)]) >= symptom_count * 0.7):
                rare_diseases = ['aids', 'malaria', 'tuberculosis', 'hepatitis c']
                if any(rare in disease_name for rare in rare_diseases):
                    confidence_multiplier *= 0.3
                    safety_notes.append("Common symptoms rarely indicate rare diseases without specific risk factors")
            
            # Rule 3: Single symptom constraints
            if symptom_count == 1:
                single_symptom = symptom_names[0] if symptom_names else ''
                
                # Cap confidence for single symptoms
                confidence_multiplier *= 0.4  # Max 40% confidence
                
                # Special case: Fever alone should not suggest serious diseases
                if 'fever' in single_symptom:
                    if any(serious in disease_name for serious in serious_diseases):
                        confidence_multiplier *= 0.1  # Very low confidence
                        safety_notes.append("Fever alone is insufficient to diagnose serious conditions")
            
            # Apply confidence adjustment
            adjusted_confidence = original_confidence * confidence_multiplier
            
            # Skip very low confidence predictions
            if adjusted_confidence < 0.03:
                continue
            
            # Update prediction with safety constraints
            pred_copy = pred.copy()
            pred_copy['confidence'] = float(adjusted_confidence)
            pred_copy['safety_notes'] = safety_notes
            pred_copy['original_confidence'] = float(original_confidence)
            
            safe_predictions.append(pred_copy)
        
        # Sort by adjusted confidence
        safe_predictions.sort(key=lambda x: x['confidence'], reverse=True)
        
        # If no reasonable predictions remain, add general advice
        if not safe_predictions or max(p['confidence'] for p in safe_predictions) < 0.15:
            safe_predictions.insert(0, {
                'disease': 'General Medical Concern',
                'confidence': 0.0,
                'severity': 'unknown',
                'recommendations': [
                    "Your symptoms require professional medical evaluation",
                    "Please provide more specific symptoms for better assessment",
                    "Consider consulting a healthcare provider for accurate diagnosis"
                ],
                'matching_symptoms': symptom_count,
                'description': "Symptoms provided are too general for specific diagnosis",
                'safety_notes': ["Medical AI has limitations - human evaluation recommended"]
            })
        
        return safe_predictions
    
    def _get_disease_severity(self, disease_name: str) -> str:
        """Classify disease severity based on medical knowledge."""
        serious_diseases = ['aids', 'cancer', 'heart_attack', 'stroke', 'meningitis', 'tuberculosis']
        moderate_diseases = ['diabetes', 'hypertension', 'hepatitis', 'pneumonia', 'malaria']
        
        disease_lower = disease_name.lower()
        
        if any(serious in disease_lower for serious in serious_diseases):
            return 'serious'
        elif any(mod in disease_lower for mod in moderate_diseases):
            return 'moderate'
        else:
            return 'mild'
    
    def _get_disease_recommendations(self, disease_name: str, severity: str) -> List[str]:
        """Get appropriate recommendations based on disease and severity."""
        
        if severity == 'serious':
            return [
                "🚨 URGENT: Seek immediate medical attention",
                "Go to emergency room or call emergency services",
                "Do not delay professional medical evaluation"
            ]
        elif severity == 'moderate':
            return [
                "⚕️ Schedule an appointment with a healthcare provider soon",
                "Monitor symptoms closely and seek care if they worsen",
                "Consider seeing a specialist if symptoms persist"
            ]
        else:  # mild
            return [
                "💊 Consider rest, hydration, and over-the-counter remedies",
                "Monitor symptoms for 2-3 days",
                "See a healthcare provider if symptoms persist or worsen"
            ]
            recommendations.extend([
                "Single symptoms often resolve with self-care",
                "Monitor for additional symptoms over the next 24-48 hours"
            ])
        
        # General recommendations
        recommendations.extend([
            "Stay hydrated and get adequate rest",
            "Avoid self-diagnosis - this tool provides guidance only",
            "Contact your doctor if symptoms worsen or you're concerned"
        ])
        
        # Low confidence warning
        if predictions and predictions[0]['confidence'] < 0.3:
            recommendations.insert(0, "💡 Limited symptom information makes diagnosis uncertain")
        
        return recommendations
        """Generate recommendations based on predicted disease and severity."""
        recommendations = []
        
        # Severity-based recommendations
        if severity == 'high':
            recommendations.extend([
                "Seek immediate medical attention",
                "Contact your doctor or visit emergency room",
                "Do not delay treatment for this condition"
            ])
        elif severity == 'medium':
            recommendations.extend([
                "Schedule an appointment with your healthcare provider within 1-2 days",
                "Monitor symptoms closely for any worsening",
                "Follow prescribed treatment if you have this condition"
            ])
        else:
            recommendations.extend([
                "Consider consulting with a healthcare provider if symptoms persist",
                "Monitor symptoms and seek care if they worsen",
                "Practice good self-care and rest"
            ])
        
        # Disease-specific recommendations
        disease_lower = disease_name.lower()
        
        if 'cold' in disease_lower or 'flu' in disease_lower:
            recommendations.extend([
                "Get plenty of rest and stay hydrated",
                "Use over-the-counter symptom relievers if needed",
                "Avoid close contact with others to prevent spread"
            ])
        elif 'diabetes' in disease_lower:
            recommendations.extend([
                "Monitor blood sugar levels regularly",
                "Follow prescribed diet and medication regimen",
                "Maintain regular exercise routine"
            ])
        elif 'hypertension' in disease_lower:
            recommendations.extend([
                "Monitor blood pressure regularly",
                "Reduce sodium intake and maintain healthy diet",
                "Engage in regular physical activity"
            ])
        elif 'asthma' in disease_lower:
            recommendations.extend([
                "Keep rescue inhaler accessible",
                "Avoid known triggers (smoke, allergens)",
                "Follow asthma action plan"
            ])
        
        return recommendations
    
    def predict_diseases_enhanced(self, symptom_objects: List[Dict], top_n: int = 5) -> List[Dict]:
        """
        Enhanced disease prediction using symptom objects with severity and duration.
        
        Args:
            symptom_objects: List of {"name": str, "severity": str, "duration": str}
            top_n: Number of top predictions to return
        
        Returns:
            List of disease predictions with medical safety constraints applied
        """
        if not symptom_objects:
            return []
        
        try:
            # Create enhanced feature vector
            feature_vector = self._create_feature_vector_enhanced(symptom_objects)
            
            # Handle case where no symptoms matched
            if feature_vector.sum() == 0:
                print("⚠️  No valid symptoms matched the medical database")
                return [{
                    'disease': 'Insufficient Information',
                    'confidence': 0.0,
                    'severity': 'unknown',
                    'recommendations': ["Please enter recognizable medical symptoms"],
                    'matching_symptoms': 0,
                    'description': "No valid symptoms were recognized"
                }]
            
            # Get ML model predictions
            probabilities = self.model.predict_proba([feature_vector])[0]
            
            # Get top N predictions
            top_indices = np.argsort(probabilities)[-top_n*2:][::-1]  # Get more for filtering
            
            raw_predictions = []
            for idx in top_indices:
                confidence = probabilities[idx]
                
                if confidence > 0.01:  # Basic threshold
                    disease_name = self.label_encoder.inverse_transform([idx])[0]
                    severity = self._get_disease_severity(disease_name)
                    
                    # Count matching symptoms
                    symptom_names = [
                        obj.get('name') if isinstance(obj, dict) else str(obj) 
                        for obj in symptom_objects
                    ]
                    matching_symptoms = sum(1 for s in symptom_names 
                                          if self._normalize_symptom(s) in self.symptom_columns)
                    
                    raw_predictions.append({
                        'disease': disease_name,
                        'confidence': float(confidence),
                        'severity': severity,
                        'recommendations': [],  # Will be filled by safety constraints
                        'matching_symptoms': matching_symptoms,
                        'description': self.disease_descriptions.get(disease_name, 
                                     f"Medical condition requiring professional evaluation.")
                    })
            
            # Apply medical safety constraints
            safe_predictions = self._apply_medical_safety_constraints(raw_predictions, symptom_objects)
            
            # Add disease-specific recommendations
            for pred in safe_predictions[:top_n]:
                pred['recommendations'] = self._get_disease_recommendations(pred['disease'], pred['severity'])
            
            return safe_predictions[:top_n]
            
        except Exception as e:
            print(f"Error in enhanced ML prediction: {e}")
            return []
        """
        Predict diseases using trained ML model.
        
        Args:
            symptoms: List of symptom names
            top_n: Number of top predictions to return
            severities: Optional severity scores (1-7) for each symptom
        
        Returns:
            List of disease predictions with confidence scores
        """
        if not symptoms:
            return []
        
        try:
            # Create feature vector
            feature_vector = self._create_feature_vector(symptoms, severities)
            
            # Get prediction probabilities
            probabilities = self.model.predict_proba([feature_vector])[0]
            
            # Get top N predictions
            top_indices = np.argsort(probabilities)[-top_n:][::-1]
            
            predictions = []
            for idx in top_indices:
                confidence = probabilities[idx]
                
                # Only include predictions with reasonable confidence
                if confidence > 0.01:  # 1% minimum threshold
                    disease_name = self.label_encoder.inverse_transform([idx])[0]
                    severity = self._get_disease_severity(disease_name)
                    recommendations = self._get_disease_recommendations(disease_name, severity)
                    
                    # Count matching symptoms
                    matching_symptoms = sum(1 for s in symptoms 
                                          if self._normalize_symptom(s) in self.symptom_columns)
                    
                    predictions.append({
                        'disease': disease_name,
                        'confidence': float(confidence),
                        'severity': severity,
                        'recommendations': recommendations,
                        'matching_symptoms': matching_symptoms,
                        'description': self.disease_descriptions.get(disease_name, 
                                     f"Medical condition requiring professional evaluation.")
                    })
            
            return predictions
            
        except Exception as e:
            print(f"Error in ML prediction: {e}")
            return []
    
    def _calculate_symptom_score(self, symptoms: List[str], severities: List[int] = None) -> float:
        """Calculate overall symptom severity score."""
        if not symptoms:
            return 0.0
        
        # Base score from number of symptoms
        base_score = len(symptoms) * 3.0
        
        # Add severity weighting if provided
        if severities:
            severity_bonus = sum(severities) / len(severities) if severities else 3.5
            base_score *= (severity_bonus / 7.0)  # Normalize to 0-1 multiplier
        
        # High-severity symptom keywords
        high_severity_keywords = [
            'severe', 'acute', 'intense', 'chronic', 'persistent', 
            'blood', 'hemorrhage', 'chest_pain', 'difficulty_breathing'
        ]
        
        severity_multiplier = 1.0
        for symptom in symptoms:
            normalized = self._normalize_symptom(symptom)
            if any(keyword in normalized for keyword in high_severity_keywords):
                severity_multiplier += 0.3
        
        return base_score * severity_multiplier
    
    def _generate_general_recommendations(self, overall_severity: str, num_symptoms: int, 
                                        predictions: List[Dict]) -> List[str]:
        """Generate general health recommendations."""
        recommendations = []
        
        # Severity-based recommendations
        if overall_severity == 'high':
            recommendations.extend([
                "Seek immediate medical attention for proper diagnosis and treatment",
                "Monitor symptoms closely and seek emergency care if they worsen",
                "Do not rely solely on self-diagnosis for serious symptoms"
            ])
        elif overall_severity == 'medium':
            recommendations.extend([
                "Schedule an appointment with your healthcare provider soon",
                "Keep track of symptom progression and any new symptoms",
                "Follow any existing treatment plans for known conditions"
            ])
        else:
            recommendations.extend([
                "Monitor your symptoms for the next 24-48 hours",
                "Consider self-care measures and over-the-counter remedies if appropriate",
                "Contact your healthcare provider if symptoms persist or worsen"
            ])
        
        # General health recommendations
        recommendations.extend([
            "Stay well hydrated by drinking plenty of water",
            "Get adequate rest and sleep",
            "Avoid self-medication without professional guidance",
            "Keep a record of your symptoms and any changes"
        ])
        
        return recommendations
    
    def analyze(self, symptoms: List[str], top_n: int = 5) -> Dict:
        """
        Legacy method for backward compatibility.
        Converts string symptoms to symptom objects and uses enhanced prediction.
        """
        # Convert string symptoms to symptom objects with default values
        symptom_objects = []
        for symptom in symptoms:
            symptom_objects.append({
                'name': symptom,
                'severity': 'moderate',  # Default severity
                'duration': '2-3 days'   # Default duration
            })
        
        # Use enhanced prediction method
        predictions = self.predict_diseases_enhanced(symptom_objects, top_n)
        
        return {
            'predictions': predictions,
            'method': 'ml_enhanced',
            'total_symptoms': len(symptoms),
            'matched_symptoms': sum(1 for s in symptoms 
                                  if self._normalize_symptom(s) in self.symptom_columns)
        }
    
    def analyze_enhanced(self, symptom_objects: List[Dict], top_n: int = 5) -> Dict:
        """
        Enhanced analysis method using symptom objects with severity and duration.
        
        Args:
            symptom_objects: List of {"name": str, "severity": str, "duration": str}
            top_n: Number of top predictions to return
        
        Returns:
            Enhanced analysis results with medical safety constraints
        """
        predictions = self.predict_diseases_enhanced(symptom_objects, top_n)
        
        # Count symptoms that matched the medical database
        matched_symptoms = 0
        for obj in symptom_objects:
            symptom_name = obj.get('name', '') if isinstance(obj, dict) else str(obj)
            if self._normalize_symptom(symptom_name) in self.symptom_columns:
                matched_symptoms += 1
        
        return {
            'predictions': predictions,
            'method': 'ml_enhanced',
            'total_symptoms': len(symptom_objects),
            'matched_symptoms': matched_symptoms,
            'safety_features': {
                'medical_constraints_applied': True,
                'severity_weighting': True,
                'duration_factors': True
            }
        }
        """
        Comprehensive ML-based symptom analysis.
        
        Args:
            symptoms: List of reported symptoms
            severities: Optional severity scores (1-7) for each symptom
            
        Returns:
            Dictionary with ML predictions, severity assessment, and recommendations
        """
        if not symptoms:
            return {
                'predictions': [],
                'overall_severity': 'unknown',
                'severity_score': 0.0,
                'recommendation_summary': ['Please enter at least one symptom for analysis'],
                'total_symptoms': 0,
                'ai_response': 'No symptoms provided for analysis.',
                'model_info': {
                    'type': 'ML Decision Tree',
                    'version': self.model_metadata.get('version', '1.0.0'),
                    'accuracy': self.model_metadata.get('test_accuracy', 'unknown')
                }
            }
        
        # Get ML disease predictions
        predictions = self.predict_diseases(symptoms, top_n=5, severities=severities)
        
        # Calculate overall severity score
        severity_score = self._calculate_symptom_score(symptoms, severities)
        
        # Determine overall severity level
        if severity_score >= 25 or any(p['severity'] == 'high' and p['confidence'] > 0.3 for p in predictions):
            overall_severity = 'high'
        elif severity_score >= 12 or any(p['severity'] == 'medium' and p['confidence'] > 0.2 for p in predictions):
            overall_severity = 'medium'
        else:
            overall_severity = 'low'
        
        # Generate recommendations
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
                f"Based on your {len(symptoms)} symptom(s), the ML model predicts "
                f"{top_disease} with {confidence*100:.1f}% confidence. "
                f"This assessment uses a Decision Tree trained on 4,920 medical cases. "
                f"Please consult a healthcare professional for proper diagnosis."
            )
        else:
            ai_response = (
                f"Unable to provide reliable predictions for the {len(symptoms)} symptom(s) provided. "
                f"Please consult with a healthcare professional for proper evaluation."
            )
        
        return {
            'predictions': predictions,
            'overall_severity': overall_severity,
            'severity_score': float(severity_score),
            'recommendation_summary': recommendation_summary,
            'total_symptoms': len(symptoms),
            'ai_response': ai_response,
            'model_info': {
                'type': 'ML Decision Tree',
                'version': self.model_metadata.get('version', '1.0.0'),
                'accuracy': f"{self.model_metadata.get('test_accuracy', 0)*100:.1f}%",
                'symptoms_in_model': len(self.symptom_columns),
                'diseases_in_model': len(self.label_encoder.classes_)
            }
        }
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded ML model."""
        return {
            'model_type': type(self.model).__name__,
            'num_features': len(self.symptom_columns),
            'num_diseases': len(self.label_encoder.classes_),
            'diseases': self.label_encoder.classes_.tolist(),
            'test_accuracy': self.model_metadata.get('test_accuracy', 'unknown'),
            'training_date': self.model_metadata.get('training_date', 'unknown'),
            'version': self.model_metadata.get('version', '1.0.0')
        }

# Backward compatibility alias
SymptomChecker = MLSymptomChecker