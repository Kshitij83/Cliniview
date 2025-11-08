#!/usr/bin/env python3
"""
Columbia University ML Symptom Checker
Enhanced ML service using Columbia Disease-Symptom Knowledge Base
"""

import pandas as pd
import numpy as np
import pickle
import json
from typing import List, Dict, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class ColumbiaMLSymptomChecker:
    def __init__(self, model_path='models/latest_columbia_model.pkl'):
        """Initialize Columbia ML symptom checker"""
        self.model_path = model_path
        self.model = None
        self.label_encoder = None
        self.feature_columns = None
        self.metadata = {}
        self.columbia_symptom_mapping = {}
        self._load_model()
        self._load_columbia_mapping()
        
    def _load_model(self):
        """Load the trained Columbia model"""
        try:
            with open(self.model_path, 'rb') as f:
                model_data = pickle.load(f)
                
            self.model = model_data['model']
            self.label_encoder = model_data['label_encoder']
            self.feature_columns = model_data['feature_columns']
            self.metadata = model_data.get('metadata', {})
            
            print(f"✅ Columbia model loaded: {len(self.label_encoder.classes_)} diseases, {len(self.feature_columns)} features")
            
        except FileNotFoundError:
            print(f"❌ Model file not found: {self.model_path}")
            raise
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            raise
    
    def _load_columbia_mapping(self):
        """Load Columbia symptom mapping for enhanced features"""
        try:
            import glob
            mapping_files = glob.glob("data/columbia_symptom_mapping_*.json")
            
            if mapping_files:
                latest_mapping = max(mapping_files, key=lambda x: x.split('_')[-1])
                with open(latest_mapping, 'r') as f:
                    self.columbia_symptom_mapping = json.load(f)
                print(f"✅ Columbia symptom mapping loaded: {len(self.columbia_symptom_mapping)} symptoms")
            else:
                print("⚠️ No Columbia symptom mapping found")
                
        except Exception as e:
            print(f"⚠️ Could not load Columbia mapping: {e}")
    
    def normalize_symptom_name(self, symptom: str) -> str:
        """Normalize symptom name to match Columbia dataset format"""
        # Columbia dataset has trailing spaces in symptom names
        symptom_normalized = symptom.strip().title().replace('_', ' ')
        
        # Check if symptom exists with trailing space
        symptom_with_space = symptom_normalized + ' '
        if symptom_with_space in self.feature_columns:
            return symptom_with_space
        
        # Check exact match
        if symptom_normalized in self.feature_columns:
            return symptom_normalized
        
        # Check case variations
        for feature in self.feature_columns:
            if feature.strip().lower() == symptom_normalized.lower():
                return feature
        
        return None
    
    def _create_feature_vector_enhanced(self, symptom_objects: List[Dict]) -> np.ndarray:
        """
        Create feature vector from symptom objects with severity/duration weighting
        """
        feature_vector = np.zeros(len(self.feature_columns))
        
        for symptom_obj in symptom_objects:
            symptom_name = symptom_obj.get('name', symptom_obj.get('symptom', ''))
            severity = symptom_obj.get('severity', 'moderate')
            duration = symptom_obj.get('duration', '1 week')
            
            # Normalize symptom name
            normalized_name = self.normalize_symptom_name(symptom_name)
            
            if normalized_name and normalized_name in self.feature_columns:
                feature_index = self.feature_columns.index(normalized_name)
                
                # Calculate weight based on severity and duration
                weight = self._calculate_symptom_weight(severity, duration, symptom_name)
                feature_vector[feature_index] = weight
            else:
                print(f"⚠️ Symptom not found in model: '{symptom_name}' (tried: '{normalized_name}')")
        
        return feature_vector
    
    def _calculate_symptom_weight(self, severity: str, duration: str, symptom_name: str) -> float:
        """Calculate weighted symptom value based on severity and duration"""
        # Base weight from Columbia mapping if available
        base_weight = 4.0  # Default weight
        
        if symptom_name in self.columbia_symptom_mapping:
            base_weight = self.columbia_symptom_mapping[symptom_name].get('weight', 4.0)
        
        # Severity multiplier
        severity_multipliers = {
            'mild': 0.7,
            'moderate': 1.0,
            'severe': 1.4,
            'very severe': 1.8
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
        
        # Calculate final weight
        final_weight = base_weight * severity_mult * duration_mult
        
        # Cap the weight to prevent extreme values
        return min(max(final_weight, 1.0), 8.0)
    
    def _apply_columbia_medical_safety(self, predictions: List[Tuple[str, float]], 
                                       symptom_count: int) -> List[Tuple[str, float]]:
        """Apply medical safety constraints for Columbia diseases"""
        
        # Medical safety rules for Columbia diseases
        safety_rules = {
            'single_symptom_diseases': [
                'Myocardial Infarction',  # Heart attack needs multiple symptoms
                'Accident Cerebrovascular',  # Stroke needs multiple symptoms  
                'Pneumonia'  # Pneumonia needs multiple symptoms
            ],
            'high_severity_diseases': [
                'Myocardial Infarction',
                'Accident Cerebrovascular', 
                'Failure Heart Congestive'
            ]
        }
        
        adjusted_predictions = []
        
        for disease, confidence in predictions:
            adjusted_confidence = confidence
            
            # Rule 1: Single symptom safety
            if symptom_count == 1:
                if disease in safety_rules['single_symptom_diseases']:
                    adjusted_confidence *= 0.1  # Reduce by 90%
                else:
                    adjusted_confidence *= 0.3  # Reduce by 70%
            
            # Rule 2: High severity diseases need strong evidence
            if disease in safety_rules['high_severity_diseases']:
                if symptom_count < 3:
                    adjusted_confidence *= 0.4  # Reduce if insufficient symptoms
            
            # Rule 3: Cap confidence for safety
            adjusted_confidence = min(adjusted_confidence, 0.85)
            
            adjusted_predictions.append((disease, adjusted_confidence))
        
        return adjusted_predictions
    
    def predict_diseases_enhanced(self, symptom_objects: List[Dict], 
                                  top_k: int = 5) -> Dict:
        """
        Predict diseases using Columbia model with enhanced features
        """
        if not symptom_objects:
            return {
                'predictions': [],
                'model_info': 'columbia_enhanced',
                'error': 'No symptoms provided'
            }
        
        try:
            # Create feature vector
            feature_vector = self._create_feature_vector_enhanced(symptom_objects)
            
            # Get predictions
            probabilities = self.model.predict_proba([feature_vector])[0]
            
            # Get disease names and confidences
            diseases = self.label_encoder.classes_
            predictions = list(zip(diseases, probabilities))
            
            # Sort by confidence
            predictions.sort(key=lambda x: x[1], reverse=True)
            
            # Apply medical safety constraints
            predictions = self._apply_columbia_medical_safety(predictions, len(symptom_objects))
            
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
                    'recommendation': self._get_disease_recommendation(disease, confidence)
                })
            
            return {
                'predictions': formatted_predictions,
                'model_info': 'columbia_enhanced',
                'total_symptoms': len(symptom_objects),
                'processed_symptoms': sum(1 for s in symptom_objects 
                                         if self.normalize_symptom_name(s.get('name', '')) in self.feature_columns),
                'model_metadata': {
                    'diseases_count': len(self.label_encoder.classes_),
                    'features_count': len(self.feature_columns),
                    'training_accuracy': self.metadata.get('test_accuracy', 'N/A')
                }
            }
            
        except Exception as e:
            return {
                'predictions': [],
                'model_info': 'columbia_enhanced',
                'error': f'Prediction error: {str(e)}'
            }
    
    def _get_disease_recommendation(self, disease: str, confidence: float) -> str:
        """Get recommendation based on disease and confidence"""
        
        if confidence < 0.3:
            return "Low confidence - Monitor symptoms and consult healthcare provider if they persist"
        elif confidence < 0.6:
            return "Moderate confidence - Consider consulting a healthcare provider"
        elif confidence < 0.8:
            return "High confidence - Recommend consulting a healthcare provider for proper evaluation"
        else:
            return "Very high confidence - Strongly recommend immediate consultation with a healthcare provider"
    
    def get_model_info(self) -> Dict:
        """Get information about the Columbia model"""
        return {
            'model_type': 'Columbia University Disease-Symptom Knowledge Base',
            'diseases': len(self.label_encoder.classes_) if self.label_encoder else 0,
            'symptoms': len(self.feature_columns) if self.feature_columns else 0,
            'diseases_list': self.label_encoder.classes_.tolist() if self.label_encoder else [],
            'symptoms_list': self.feature_columns if self.feature_columns else [],
            'metadata': self.metadata,
            'columbia_mapping_available': len(self.columbia_symptom_mapping) > 0
        }
    
    def predict_diseases_legacy(self, symptoms: List[str]) -> Dict:
        """Legacy prediction method for backward compatibility"""
        # Convert string symptoms to symptom objects
        symptom_objects = []
        for symptom in symptoms:
            symptom_objects.append({
                'name': symptom,
                'severity': 'moderate',  # Default
                'duration': '1 week'     # Default
            })
        
        return self.predict_diseases_enhanced(symptom_objects)

# Test the Columbia ML service
def test_columbia_ml_service():
    """Test the Columbia ML service with sample data"""
    print("🧪 Testing Columbia ML Symptom Checker")
    print("=" * 45)
    
    try:
        # Initialize service
        columbia_ml = ColumbiaMLSymptomChecker()
        
        # Test cases
        test_cases = [
            {
                'name': 'Pneumonia Case',
                'symptoms': [
                    {'name': 'Cough', 'severity': 'moderate', 'duration': '1 week'},
                    {'name': 'Fever', 'severity': 'severe', 'duration': '1 week'},
                    {'name': 'Shortness Of Breath', 'severity': 'moderate', 'duration': '1 week'}
                ]
            },
            {
                'name': 'Heart Attack Case', 
                'symptoms': [
                    {'name': 'Pain Chest', 'severity': 'severe', 'duration': 'less than 1 week'},
                    {'name': 'Shortness Of Breath', 'severity': 'moderate', 'duration': 'less than 1 week'},
                    {'name': 'Sweat', 'severity': 'severe', 'duration': 'less than 1 week'}
                ]
            },
            {
                'name': 'Diabetes Case',
                'symptoms': [
                    {'name': 'Polyuria', 'severity': 'moderate', 'duration': '2+ weeks'},
                    {'name': 'Polydypsia', 'severity': 'moderate', 'duration': '2+ weeks'},
                    {'name': 'Fatigue', 'severity': 'mild', 'duration': 'more than 1 month'}
                ]
            },
            {
                'name': 'Single Fever (Safety Test)',
                'symptoms': [
                    {'name': 'Fever', 'severity': 'moderate', 'duration': '1 week'}
                ]
            }
        ]
        
        for test_case in test_cases:
            print(f"\n🔍 Test: {test_case['name']}")
            result = columbia_ml.predict_diseases_enhanced(test_case['symptoms'])
            
            if 'error' in result:
                print(f"   ❌ Error: {result['error']}")
                continue
                
            print(f"   📊 Symptoms processed: {result['processed_symptoms']}/{result['total_symptoms']}")
            print(f"   🏥 Top predictions:")
            
            for i, pred in enumerate(result['predictions'][:3], 1):
                print(f"      {i}. {pred['disease']} ({pred['confidence_percentage']})")
                print(f"         {pred['recommendation']}")
        
        # Model info
        model_info = columbia_ml.get_model_info()
        print(f"\n📋 Model Information:")
        print(f"   - Type: {model_info['model_type']}")
        print(f"   - Diseases: {model_info['diseases']}")
        print(f"   - Symptoms: {model_info['symptoms']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    test_columbia_ml_service()