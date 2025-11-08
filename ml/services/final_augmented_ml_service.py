#!/usr/bin/env python3
"""
Final Augmented ML Symptom Checker - Production Service
The most powerful medical symptom checker with 721 diseases and 377 symptoms
Enhanced with severity/duration intelligence
"""

import pandas as pd
import numpy as np
import pickle
import json
from typing import List, Dict, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class FinalAugmentedMLSymptomChecker:
    def __init__(self, model_path='models/final_augmented_model_20251108_001822.pkl'):
        """Initialize Final Augmented ML symptom checker"""
        self.model_path = model_path
        self.model = None
        self.label_encoder = None
        self.feature_columns = None
        self.metadata = {}
        self.severity_duration_mapping = {}
        self._load_model()
        
    def _load_model(self):
        """Load the trained Final Augmented model"""
        try:
            with open(self.model_path, 'rb') as f:
                model_data = pickle.load(f)
                
            self.model = model_data['model']
            self.label_encoder = model_data['label_encoder']
            self.feature_columns = model_data['feature_columns']
            self.metadata = model_data.get('metadata', {})
            self.severity_duration_mapping = model_data.get('severity_duration_mapping', {})
            
            print(f"✅ Final Augmented model loaded:")
            print(f"   - Diseases: {len(self.label_encoder.classes_)}")
            print(f"   - Symptoms: {len(self.feature_columns)}")
            print(f"   - Test Accuracy: {self.metadata.get('test_accuracy', 'N/A'):.1%}")
            print(f"   - Severity/Duration Enhanced: ✅")
            
        except FileNotFoundError:
            print(f"❌ Model file not found: {self.model_path}")
            raise
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            raise
    
    def normalize_symptom_name(self, symptom: str) -> str:
        """Normalize symptom name to match dataset format"""
        symptom_normalized = symptom.strip().lower()
        
        # Check exact match first
        for feature in self.feature_columns:
            if feature.lower() == symptom_normalized:
                return feature
                
        # Check partial matches
        for feature in self.feature_columns:
            if symptom_normalized in feature.lower() or feature.lower() in symptom_normalized:
                return feature
        
        # Check word-based matching
        symptom_words = set(symptom_normalized.split())
        for feature in self.feature_columns:
            feature_words = set(feature.lower().split())
            if len(symptom_words.intersection(feature_words)) >= 1:
                return feature
        
        return None
    
    def _calculate_enhancement_weight(self, symptom_name: str, severity: str, duration: str) -> float:
        """Calculate enhancement weight from severity and duration"""
        
        # Get base weight from mapping if available
        base_weight = 1.0
        if symptom_name in self.severity_duration_mapping:
            base_weight = self.severity_duration_mapping[symptom_name].get('base_weight', 1.0)
        
        # Severity multiplier
        severity_multipliers = {
            'mild': 0.7,
            'moderate': 1.0,
            'severe': 1.5,
            'very severe': 2.0
        }
        severity_mult = severity_multipliers.get(severity.lower(), 1.0)
        
        # Duration multiplier  
        duration_multipliers = {
            'less than 1 week': 0.8,
            '1 week': 1.0,
            '2+ weeks': 1.3,
            'more than 1 month': 1.6
        }
        duration_mult = duration_multipliers.get(duration.lower(), 1.0)
        
        # Calculate final enhancement weight
        enhancement_weight = base_weight * severity_mult * duration_mult
        
        # Normalize to reasonable range
        return max(0.5, min(enhancement_weight, 3.0))
    
    def _create_feature_vector_enhanced(self, symptom_objects: List[Dict]) -> Tuple[np.ndarray, List[float], List[Dict]]:
        """Create feature vector with enhancement tracking and weighted features"""
        feature_vector = np.zeros(len(self.feature_columns))
        enhancement_weights = []
        processed_symptoms = []
        
        for symptom_obj in symptom_objects:
            symptom_name = symptom_obj.get('name', symptom_obj.get('symptom', ''))
            severity = symptom_obj.get('severity', 'moderate')
            duration = symptom_obj.get('duration', '1 week')
            
            # Normalize symptom name
            normalized_name = self.normalize_symptom_name(symptom_name)
            
            if normalized_name and normalized_name in self.feature_columns:
                feature_index = self.feature_columns.index(normalized_name)
                
                # Calculate enhancement weight first
                enhancement_weight = self._calculate_enhancement_weight(
                    normalized_name, severity, duration
                )
                
                # Apply weight directly to feature vector for better ML differentiation
                feature_vector[feature_index] = enhancement_weight / 3.0  # Normalize to 0-1 range
                
                enhancement_weights.append(enhancement_weight)
                processed_symptoms.append({
                    'original': symptom_name,
                    'normalized': normalized_name,
                    'severity': severity,
                    'duration': duration,
                    'weight': enhancement_weight
                })
            else:
                print(f"⚠️ Symptom not found: '{symptom_name}'")
        
        return feature_vector, enhancement_weights, processed_symptoms
    
    def _apply_medical_safety_constraints(self, predictions: List[Tuple[str, float]], 
                                         symptom_count: int, enhancement_weights: List[float]) -> List[Tuple[str, float]]:
        """Apply medical safety constraints with Final Augmented intelligence"""
        
        # Medical safety rules for comprehensive disease database
        critical_diseases = [
            'myocardial infarction', 'heart attack', 'stroke', 'cerebral',
            'acute', 'emergency', 'severe', 'critical', 'life threatening'
        ]
        
        chronic_diseases = [
            'diabetes', 'hypertension', 'cancer', 'chronic', 'arthritis'
        ]
        
        adjusted_predictions = []
        avg_enhancement = np.mean(enhancement_weights) if enhancement_weights else 1.0
        
        for disease, confidence in predictions:
            adjusted_confidence = confidence
            disease_lower = disease.lower()
            
            # Rule 1: Single symptom safety
            if symptom_count == 1:
                if any(critical in disease_lower for critical in critical_diseases):
                    adjusted_confidence *= 0.15  # Very conservative for critical diseases
                else:
                    adjusted_confidence *= 0.4   # Conservative for single symptoms
            
            # Rule 2: Enhancement factor influence
            if avg_enhancement > 1.5:  # High severity/long duration
                if any(critical in disease_lower for critical in critical_diseases):
                    adjusted_confidence *= 1.2  # Slight boost for critical diseases with severe symptoms
                    
            elif avg_enhancement < 0.8:  # Low severity/short duration
                if any(critical in disease_lower for critical in critical_diseases):
                    adjusted_confidence *= 0.6  # Reduce critical disease likelihood for mild symptoms
            
            # Rule 3: Multiple symptom patterns
            if symptom_count >= 3:
                adjusted_confidence *= 1.1  # Slight boost for multiple symptoms
            
            # Rule 4: Cap confidence for safety
            adjusted_confidence = min(adjusted_confidence, 0.85)
            
            adjusted_predictions.append((disease, adjusted_confidence))
        
        return adjusted_predictions
    
    def predict_diseases_enhanced(self, symptom_objects: List[Dict], top_k: int = 5) -> Dict:
        """
        Enhanced disease prediction using Final Augmented model
        """
        if not symptom_objects:
            return {
                'predictions': [],
                'model_info': 'final_augmented_enhanced',
                'error': 'No symptoms provided'
            }
        
        try:
            # Create enhanced feature vector with weights applied
            feature_vector, enhancement_weights, processed_symptoms = self._create_feature_vector_enhanced(symptom_objects)
            
            # Get predictions with enhanced features
            probabilities = self.model.predict_proba([feature_vector])[0]
            
            # Calculate average enhancement for reporting
            avg_enhancement = np.mean(enhancement_weights) if enhancement_weights else 1.0
            
            # Get disease names and confidences (no additional enhancement needed)
            diseases = self.label_encoder.classes_
            predictions = list(zip(diseases, probabilities))
            
            # Sort by confidence
            predictions.sort(key=lambda x: x[1], reverse=True)
            
            # Apply medical safety constraints
            predictions = self._apply_medical_safety_constraints(
                predictions, len(symptom_objects), enhancement_weights
            )
            
            # Re-sort after safety adjustments
            predictions.sort(key=lambda x: x[1], reverse=True)
            
            # Take top predictions
            top_predictions = predictions[:top_k]
            
            # Format results
            formatted_predictions = []
            for disease, confidence in top_predictions:
                formatted_predictions.append({
                    'disease': disease,
                    'confidence': float(confidence),
                    'confidence_percentage': f"{confidence * 100:.1f}%",
                    'recommendation': self._get_disease_recommendation(disease, confidence),
                    'severity_category': self._categorize_disease_severity(disease)
                })
            
            return {
                'predictions': formatted_predictions,
                'model_info': 'final_augmented_enhanced',
                'total_symptoms': len(symptom_objects),
                'processed_symptoms': len(processed_symptoms),
                'enhancement_factor': f"{avg_enhancement:.2f}x",
                'processed_symptom_details': processed_symptoms,
                'model_metadata': {
                    'diseases_count': len(self.label_encoder.classes_),
                    'symptoms_count': len(self.feature_columns),
                    'test_accuracy': f"{self.metadata.get('test_accuracy', 0):.1%}",
                    'training_records': f"{self.metadata.get('total_samples', 0):,}"
                }
            }
            
        except Exception as e:
            return {
                'predictions': [],
                'model_info': 'final_augmented_enhanced',
                'error': f'Prediction error: {str(e)}'
            }
    
    def _get_disease_recommendation(self, disease: str, confidence: float) -> str:
        """Get recommendation based on disease and confidence"""
        disease_lower = disease.lower()
        
        # Critical/emergency conditions
        critical_keywords = ['myocardial', 'heart attack', 'stroke', 'acute', 'emergency']
        if any(keyword in disease_lower for keyword in critical_keywords):
            if confidence > 0.3:
                return "⚠️ URGENT: Seek immediate emergency medical attention"
            else:
                return "Consult healthcare provider promptly if symptoms persist"
        
        # Standard recommendations based on confidence
        if confidence < 0.2:
            return "Low confidence - Monitor symptoms and consult healthcare provider if they worsen"
        elif confidence < 0.4:
            return "Moderate confidence - Consider consulting a healthcare provider"
        elif confidence < 0.6:
            return "High confidence - Recommend consulting a healthcare provider for evaluation"
        else:
            return "Very high confidence - Strongly recommend consultation with a healthcare provider"
    
    def _categorize_disease_severity(self, disease: str) -> str:
        """Categorize disease by severity level"""
        disease_lower = disease.lower()
        
        if any(keyword in disease_lower for keyword in ['myocardial', 'heart attack', 'stroke', 'acute']):
            return 'critical'
        elif any(keyword in disease_lower for keyword in ['chronic', 'cancer', 'diabetes']):
            return 'serious'
        elif any(keyword in disease_lower for keyword in ['infection', 'inflammatory']):
            return 'moderate'
        else:
            return 'mild'
    
    def predict_diseases_legacy(self, symptoms: List[str]) -> Dict:
        """Legacy prediction for backward compatibility"""
        # Convert string symptoms to symptom objects
        symptom_objects = []
        for symptom in symptoms:
            symptom_objects.append({
                'name': symptom,
                'severity': 'moderate',
                'duration': '1 week'
            })
        
        return self.predict_diseases_enhanced(symptom_objects)
    
    def get_model_info(self) -> Dict:
        """Get comprehensive model information"""
        return {
            'model_type': 'Final Augmented Disease-Symptom Database (246K+ records)',
            'diseases': len(self.label_encoder.classes_),
            'symptoms': len(self.feature_columns),
            'diseases_list': self.label_encoder.classes_.tolist()[:50],  # Sample 50
            'symptoms_list': self.feature_columns[:50],  # Sample 50  
            'metadata': self.metadata,
            'enhancement_features': {
                'severity_weighting': True,
                'duration_weighting': True,
                'medical_safety_constraints': True,
                'symptom_normalization': True
            },
            'performance': {
                'test_accuracy': f"{self.metadata.get('test_accuracy', 0):.1%}",
                'cross_validation': f"{self.metadata.get('cv_accuracy_mean', 0):.1%} ± {self.metadata.get('cv_accuracy_std', 0):.1%}",
                'training_records': f"{self.metadata.get('total_samples', 0):,}"
            }
        }

def test_final_augmented_service():
    """Test the Final Augmented ML service"""
    print("🧪 Testing Final Augmented ML Symptom Checker")
    print("=" * 55)
    
    try:
        # Initialize service
        final_ml = FinalAugmentedMLSymptomChecker()
        
        # Test cases with severity/duration
        test_cases = [
            {
                'name': 'Heart Attack Symptoms',
                'symptoms': [
                    {'name': 'sharp chest pain', 'severity': 'severe', 'duration': 'less than 1 week'},
                    {'name': 'shortness of breath', 'severity': 'moderate', 'duration': 'less than 1 week'},
                    {'name': 'sweating', 'severity': 'severe', 'duration': 'less than 1 week'}
                ]
            },
            {
                'name': 'Diabetes Symptoms',
                'symptoms': [
                    {'name': 'excessive urination', 'severity': 'moderate', 'duration': '2+ weeks'},
                    {'name': 'thirst', 'severity': 'moderate', 'duration': '2+ weeks'},
                    {'name': 'fatigue', 'severity': 'mild', 'duration': 'more than 1 month'}
                ]
            },
            {
                'name': 'Mild Cold Symptoms',
                'symptoms': [
                    {'name': 'cough', 'severity': 'mild', 'duration': '1 week'},
                    {'name': 'nasal congestion', 'severity': 'mild', 'duration': '1 week'}
                ]
            },
            {
                'name': 'Single Headache (Safety Test)',
                'symptoms': [
                    {'name': 'headache', 'severity': 'moderate', 'duration': '1 week'}
                ]
            }
        ]
        
        for test_case in test_cases:
            print(f"\n🔍 Test: {test_case['name']}")
            result = final_ml.predict_diseases_enhanced(test_case['symptoms'])
            
            if 'error' in result:
                print(f"   ❌ Error: {result['error']}")
                continue
                
            print(f"   📊 Symptoms processed: {result['processed_symptoms']}/{result['total_symptoms']}")
            print(f"   ⚡ Enhancement factor: {result['enhancement_factor']}")
            print(f"   🏥 Top predictions:")
            
            for i, pred in enumerate(result['predictions'][:3], 1):
                print(f"      {i}. {pred['disease']} ({pred['confidence_percentage']})")
                print(f"         🔹 {pred['recommendation']}")
                print(f"         🔹 Severity: {pred['severity_category']}")
        
        # Model performance info
        model_info = final_ml.get_model_info()
        print(f"\n📋 Final Augmented Model Performance:")
        print(f"   - Training Records: {model_info['performance']['training_records']}")
        print(f"   - Test Accuracy: {model_info['performance']['test_accuracy']}")
        print(f"   - Cross Validation: {model_info['performance']['cross_validation']}")
        print(f"   - Diseases: {model_info['diseases']}")
        print(f"   - Symptoms: {model_info['symptoms']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_final_augmented_service()