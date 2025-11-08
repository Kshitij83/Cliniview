#!/usr/bin/env python3
"""
Columbia Disease-Symptom Knowledge Base Parser
Converts the Columbia University dataset to our enhanced format with severity/duration
"""

import pandas as pd
import json
import re
from typing import Dict, List, Tuple

class ColumbiaDatasetParser:
    def __init__(self):
        self.diseases = {}
        self.symptoms = {}
        self.disease_symptom_matrix = {}
        
    def parse_columbia_web_data(self, web_text: str) -> Dict:
        """
        Parse the Columbia dataset from the webpage text
        """
        # Extract the table data using regex patterns
        lines = web_text.split('\n')
        
        current_disease = None
        current_count = 0
        
        # Pattern to match disease lines: | UMLS:C0020538_hypertensive disease | 3363 | UMLS:C0008031_pain chest |
        disease_pattern = r'\|\s*(UMLS:C\d+_[^|]+)\s*\|\s*(\d+)\s*\|\s*(UMLS:C\d+_[^|]+)\s*\|'
        # Pattern to match symptom continuation: |   |   | UMLS:C0392680_shortness of breath |
        symptom_pattern = r'\|\s*\|\s*\|\s*(UMLS:C\d+_[^|]+)\s*\|'
        
        for line in lines:
            # Check for disease line
            disease_match = re.match(disease_pattern, line.strip())
            if disease_match:
                disease_code = disease_match.group(1)
                count = int(disease_match.group(2))
                first_symptom = disease_match.group(3)
                
                # Clean disease name
                disease_name = self._clean_medical_term(disease_code)
                current_disease = disease_name
                current_count = count
                
                # Initialize disease entry
                self.diseases[disease_name] = {
                    'umls_code': disease_code,
                    'frequency': count,
                    'symptoms': []
                }
                
                # Add first symptom
                symptom_name = self._clean_medical_term(first_symptom)
                self.diseases[disease_name]['symptoms'].append({
                    'name': symptom_name,
                    'umls_code': first_symptom,
                    'rank': 1
                })
                
            # Check for symptom continuation
            symptom_match = re.match(symptom_pattern, line.strip())
            if symptom_match and current_disease:
                symptom_code = symptom_match.group(1)
                symptom_name = self._clean_medical_term(symptom_code)
                
                rank = len(self.diseases[current_disease]['symptoms']) + 1
                self.diseases[current_disease]['symptoms'].append({
                    'name': symptom_name,
                    'umls_code': symptom_code,
                    'rank': rank
                })
        
        return self.diseases
    
    def _clean_medical_term(self, umls_term: str) -> str:
        """Clean UMLS term to human-readable format"""
        # Extract term after the underscore
        if '_' in umls_term:
            term = umls_term.split('_', 1)[1]
        else:
            term = umls_term
            
        # Handle compound terms with ^
        if '^' in term:
            term = term.split('^')[0]  # Take first part
            
        # Clean up common patterns
        term = term.replace('_', ' ')
        term = term.replace('-', ' ')
        
        # Capitalize properly
        term = term.title()
        
        # Fix common medical abbreviations
        replacements = {
            'Hiv': 'HIV',
            'Aids': 'AIDS',
            'Copd': 'COPD',
            'Chf': 'CHF',
            'Mi': 'Myocardial Infarction',
            'Copd': 'Chronic Obstructive Pulmonary Disease'
        }
        
        for old, new in replacements.items():
            term = term.replace(old, new)
            
        return term
    
    def enhance_with_severity_duration(self) -> Dict:
        """
        Add severity and duration mappings to the Columbia dataset
        """
        # Define severity mappings based on medical knowledge
        severity_map = {
            # High severity symptoms
            'Chest Pain': 'severe',
            'Shortness Of Breath': 'moderate', 
            'Severe Pain': 'severe',
            'Hemoptysis': 'severe',  # Coughing blood
            'Unconscious State': 'severe',
            'Seizure': 'severe',
            'Stroke': 'severe',
            'Heart Attack': 'severe',
            
            # Moderate severity
            'Fever': 'moderate',
            'Cough': 'moderate',
            'Nausea': 'moderate',
            'Vomiting': 'moderate',
            'Diarrhea': 'moderate',
            'Headache': 'moderate',
            'Fatigue': 'moderate',
            
            # Mild severity
            'Mild Pain': 'mild',
            'Dizziness': 'mild',
            'Sweating': 'mild',
            'Weakness': 'mild'
        }
        
        # Define duration patterns based on symptom type
        duration_map = {
            # Acute symptoms (short duration)
            'Heart Attack': '1 day',
            'Stroke': '1 day', 
            'Seizure': '1 day',
            'Severe Pain': '2-3 days',
            'Vomiting': '2-3 days',
            'Diarrhea': '2-3 days',
            
            # Subacute symptoms 
            'Fever': '1 week',
            'Cough': '1 week',
            'Headache': '1 week',
            'Nausea': '1 week',
            
            # Chronic symptoms
            'Fatigue': '2+ weeks',
            'Weakness': '2+ weeks',
            'Shortness Of Breath': '2+ weeks',
            'Chronic Pain': '2+ weeks'
        }
        
        # Enhance each disease's symptoms
        enhanced_diseases = {}
        
        for disease_name, disease_data in self.diseases.items():
            enhanced_symptoms = []
            
            for symptom in disease_data['symptoms']:
                symptom_name = symptom['name']
                
                # Assign severity (default to moderate)
                severity = 'moderate'
                for pattern, sev in severity_map.items():
                    if pattern.lower() in symptom_name.lower():
                        severity = sev
                        break
                
                # Assign duration (default to 1 week)
                duration = '1 week'
                for pattern, dur in duration_map.items():
                    if pattern.lower() in symptom_name.lower():
                        duration = dur
                        break
                
                enhanced_symptoms.append({
                    'name': symptom_name,
                    'umls_code': symptom.get('umls_code'),
                    'severity': severity,
                    'duration': duration,
                    'rank': symptom.get('rank', 1),
                    'weight': self._calculate_symptom_weight(severity, duration)
                })
            
            enhanced_diseases[disease_name] = {
                'umls_code': disease_data.get('umls_code'),
                'frequency': disease_data.get('frequency', 0),
                'symptoms': enhanced_symptoms,
                'severity': self._classify_disease_severity(disease_name),
                'description': self._generate_disease_description(disease_name)
            }
        
        return enhanced_diseases
    
    def _calculate_symptom_weight(self, severity: str, duration: str) -> float:
        """Calculate symptom weight based on severity and duration"""
        severity_weights = {'mild': 1.0, 'moderate': 2.0, 'severe': 3.0}
        duration_weights = {'1 day': 1.0, '2-3 days': 1.5, '1 week': 2.0, '2+ weeks': 3.0}
        
        return severity_weights.get(severity, 2.0) * duration_weights.get(duration, 2.0)
    
    def _classify_disease_severity(self, disease_name: str) -> str:
        """Classify overall disease severity"""
        serious_diseases = [
            'heart attack', 'stroke', 'myocardial infarction', 'aids', 'hiv', 
            'cancer', 'malignant', 'carcinoma', 'sepsis', 'pneumonia',
            'heart failure', 'respiratory failure'
        ]
        
        moderate_diseases = [
            'diabetes', 'hypertension', 'asthma', 'bronchitis', 'infection',
            'pneumonia', 'depression', 'anxiety'
        ]
        
        disease_lower = disease_name.lower()
        
        if any(serious in disease_lower for serious in serious_diseases):
            return 'serious'
        elif any(mod in disease_lower for mod in moderate_diseases):
            return 'moderate'
        else:
            return 'mild'
    
    def _generate_disease_description(self, disease_name: str) -> str:
        """Generate basic disease description"""
        return f"{disease_name} - A medical condition requiring professional evaluation and appropriate treatment."
    
    def export_to_training_format(self, enhanced_diseases: Dict) -> Tuple[pd.DataFrame, Dict]:
        """
        Export to scikit-learn compatible training format
        """
        # Create symptom vocabulary
        all_symptoms = set()
        for disease_data in enhanced_diseases.values():
            for symptom in disease_data['symptoms']:
                all_symptoms.add(symptom['name'])
        
        symptom_list = sorted(list(all_symptoms))
        
        # Create training data
        training_data = []
        
        for disease_name, disease_data in enhanced_diseases.items():
            # Create feature vector for this disease
            features = [0] * len(symptom_list)
            
            for symptom in disease_data['symptoms']:
                if symptom['name'] in symptom_list:
                    idx = symptom_list.index(symptom['name'])
                    features[idx] = symptom.get('weight', 1.0)
            
            # Add disease label
            row = features + [disease_name]
            training_data.append(row)
        
        # Create DataFrame
        columns = symptom_list + ['prognosis']
        df = pd.DataFrame(training_data, columns=columns)
        
        # Create metadata
        metadata = {
            'diseases': list(enhanced_diseases.keys()),
            'symptoms': symptom_list,
            'source': 'Columbia University Disease-Symptom KB',
            'enhanced_features': ['severity', 'duration', 'weight'],
            'total_diseases': len(enhanced_diseases),
            'total_symptoms': len(symptom_list)
        }
        
        return df, metadata

def main():
    """Test the parser"""
    # Sample Columbia data (would be full dataset in practice)
    sample_data = """
| UMLS:C0020538_hypertensive disease | 3363 | UMLS:C0008031_pain chest |
|   |   | UMLS:C0392680_shortness of breath |
|   |   | UMLS:C0012833_dizziness |
| UMLS:C0011847_diabetes | 1421 | UMLS:C0032617_polyuria |
|   |   | UMLS:C0085602_polydypsia |
|   |   | UMLS:C0392680_shortness of breath |
"""
    
    parser = ColumbiaDatasetParser()
    
    # Parse the data
    diseases = parser.parse_columbia_web_data(sample_data)
    print(f"Parsed {len(diseases)} diseases")
    
    # Enhance with severity/duration
    enhanced = parser.enhance_with_severity_duration()
    print(f"Enhanced {len(enhanced)} diseases with severity/duration")
    
    # Export to training format
    df, metadata = parser.export_to_training_format(enhanced)
    print(f"Created training dataset: {df.shape}")
    print(f"Symptoms: {len(metadata['symptoms'])}")
    
    # Show sample
    print("\nSample enhanced disease:")
    disease_name = list(enhanced.keys())[0]
    print(f"{disease_name}:")
    for symptom in enhanced[disease_name]['symptoms'][:3]:
        print(f"  - {symptom['name']}: {symptom['severity']}, {symptom['duration']}, weight={symptom['weight']:.1f}")

if __name__ == "__main__":
    main()