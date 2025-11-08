#!/usr/bin/env python3
"""
Final Augmented Model Trainer with Severity/Duration Enhancement
Hybrid approach: Train on binary data but enhance predictions with severity/duration
"""

import pandas as pd
import numpy as np
import pickle
import json
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.class_weight import compute_class_weight
import warnings
warnings.filterwarnings('ignore')

class FinalAugmentedModelTrainer:
    def __init__(self, data_file=None):
        """Initialize trainer with Final Augmented dataset"""
        self.data_file = data_file or "data/final_augmented_cliniview_20251107_224903.csv"
        self.model = None
        self.label_encoder = None
        self.feature_columns = None
        self.model_metadata = {}
        self.severity_duration_weights = {}
        
    def load_final_augmented_data(self):
        """Load the Final Augmented dataset efficiently"""
        print("📂 Loading Final Augmented Dataset...")
        print("⚡ Using optimized loading for 246K records...")
        
        # Load in chunks to handle memory efficiently
        chunk_size = 10000
        chunks = []
        
        total_chunks = 0
        for chunk in pd.read_csv(self.data_file, chunksize=chunk_size):
            chunks.append(chunk)
            total_chunks += 1
            
            if total_chunks % 10 == 0:
                print(f"   Loaded {total_chunks * chunk_size:,} records...")
                
        self.df = pd.concat(chunks, ignore_index=True)
        
        print(f"✅ Dataset loaded: {self.df.shape}")
        print(f"   - Records: {len(self.df):,}")
        print(f"   - Features: {len(self.df.columns) - 1}")
        print(f"   - Diseases: {len(self.df['prognosis'].unique())}")
        
        return self.df
    
    def prepare_hybrid_features(self):
        """
        Prepare features with severity/duration mapping for enhancement
        """
        print("\n🔧 Preparing Hybrid Features (Binary + Severity/Duration mapping)...")
        
        # Separate features and labels
        self.feature_columns = [col for col in self.df.columns if col != 'prognosis']
        X = self.df[self.feature_columns]
        y = self.df['prognosis']
        
        # Clean disease names
        y = y.str.strip()
        
        # Filter out diseases with too few samples (minimum 5 for reliable training)
        print("   🔍 Filtering rare diseases...")
        disease_counts = y.value_counts()
        min_samples = 5
        
        valid_diseases = disease_counts[disease_counts >= min_samples].index
        mask = y.isin(valid_diseases)
        
        X = X[mask]
        y = y[mask]
        
        print(f"   ✅ Filtered dataset:")
        print(f"      - Kept diseases with ≥{min_samples} samples: {len(valid_diseases)}")
        print(f"      - Removed rare diseases: {len(disease_counts) - len(valid_diseases)}")
        print(f"      - Final records: {len(X):,}")
        
        # Encode labels
        self.label_encoder = LabelEncoder()
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Create severity/duration mapping for symptoms
        self.severity_duration_weights = self._create_severity_duration_mapping()
        
        print(f"   ✅ Features prepared:")
        print(f"      - Binary features: {len(self.feature_columns)}")
        print(f"      - Diseases: {len(self.label_encoder.classes_)}")
        print(f"      - Severity/Duration mapping: {len(self.severity_duration_weights)} symptoms")
        
        # Analyze class distribution
        unique, counts = np.unique(y_encoded, return_counts=True)
        print(f"      - Average samples per disease: {counts.mean():.0f}")
        print(f"      - Min/Max samples: {counts.min()}/{counts.max()}")
        
        return X, y_encoded, y
    
    def _create_severity_duration_mapping(self):
        """
        Create intelligent severity/duration mapping based on medical knowledge
        """
        print("   🧠 Creating medical severity/duration mapping...")
        
        # Medical knowledge-based severity mapping
        severity_mapping = {
            # High severity symptoms (life-threatening)
            'high': [
                'sharp chest pain', 'chest tightness', 'difficulty breathing',
                'severe headache', 'loss of consciousness', 'severe abdominal pain',
                'blood in vomit', 'severe bleeding', 'severe shortness of breath'
            ],
            # Moderate severity symptoms (significant discomfort)
            'moderate': [
                'headache', 'nausea', 'vomiting', 'dizziness', 'fever',
                'abdominal pain', 'back pain', 'joint pain', 'cough'
            ],
            # Mild severity symptoms (minor discomfort)
            'mild': [
                'fatigue', 'mild headache', 'slight fever', 'minor pain',
                'skin irritation', 'mild nausea', 'restlessness'
            ]
        }
        
        # Duration mapping based on typical medical patterns
        duration_mapping = {
            # Acute (short-term)
            'acute': [
                'sharp chest pain', 'severe headache', 'difficulty breathing',
                'severe abdominal pain', 'acute pain', 'sudden symptoms'
            ],
            # Chronic (long-term)
            'chronic': [
                'back pain', 'joint pain', 'fatigue', 'depression',
                'chronic pain', 'persistent symptoms'
            ],
            # Episodic (intermittent)
            'episodic': [
                'headache', 'dizziness', 'nausea', 'palpitations',
                'anxiety', 'panic symptoms'
            ]
        }
        
        # Create mapping for each symptom
        symptom_weights = {}
        
        for symptom in self.feature_columns:
            symptom_lower = symptom.lower()
            
            # Determine severity
            severity = 'moderate'  # default
            if any(high_sym in symptom_lower for high_sym in severity_mapping['high']):
                severity = 'severe'
            elif any(mild_sym in symptom_lower for mild_sym in severity_mapping['mild']):
                severity = 'mild'
            
            # Determine duration pattern
            duration = '1 week'  # default
            if any(acute_sym in symptom_lower for acute_sym in duration_mapping['acute']):
                duration = 'less than 1 week'
            elif any(chronic_sym in symptom_lower for chronic_sym in duration_mapping['chronic']):
                duration = 'more than 1 month'
            elif any(episodic_sym in symptom_lower for episodic_sym in duration_mapping['episodic']):
                duration = '2+ weeks'
            
            symptom_weights[symptom] = {
                'default_severity': severity,
                'default_duration': duration,
                'base_weight': self._calculate_base_weight(severity, duration)
            }
        
        return symptom_weights
    
    def _calculate_base_weight(self, severity: str, duration: str) -> float:
        """Calculate base weight from severity and duration"""
        severity_multipliers = {
            'mild': 0.8,
            'moderate': 1.0,
            'severe': 1.5
        }
        
        duration_multipliers = {
            'less than 1 week': 0.9,
            '1 week': 1.0,
            '2+ weeks': 1.2,
            'more than 1 month': 1.4
        }
        
        return 4.0 * severity_multipliers.get(severity, 1.0) * duration_multipliers.get(duration, 1.0)
    
    def train_final_augmented_model(self, X, y_encoded):
        """Train ML model on Final Augmented dataset"""
        print("\n🤖 Training Final Augmented Model...")
        print("🎯 Using Random Forest for optimal performance on large dataset")
        
        # Split data with stratification
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded, test_size=0.15, random_state=42, stratify=y_encoded
        )
        
        print(f"   📊 Training set: {X_train.shape[0]:,} samples")
        print(f"   📊 Test set: {X_test.shape[0]:,} samples")
        
        # Use Random Forest optimized for large datasets
        self.model = RandomForestClassifier(
            n_estimators=200,           # Reasonable for large dataset
            max_depth=20,              # Deep enough for complex patterns
            min_samples_split=10,      # Prevent overfitting with large dataset
            min_samples_leaf=5,        # Minimum samples in leaf
            max_features='sqrt',       # Feature subsampling
            random_state=42,
            class_weight='balanced',   # Handle class imbalance
            n_jobs=-1,                # Use all CPU cores
            verbose=1                  # Show progress
        )
        
        print("   🚀 Training Random Forest model...")
        self.model.fit(X_train, y_train)
        
        # Evaluate model
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        print(f"   ✅ Training accuracy: {train_score:.3f}")
        print(f"   ✅ Test accuracy: {test_score:.3f}")
        
        # Cross-validation on subset (due to size)
        print("   🔄 Running cross-validation...")
        cv_subset_size = 30000  # Use subset for CV due to size
        
        if len(X) > cv_subset_size:
            # Random sample for CV
            cv_indices = np.random.choice(len(X), cv_subset_size, replace=False)
            X_cv = X.iloc[cv_indices]
            y_cv = y_encoded[cv_indices]
        else:
            X_cv = X
            y_cv = y_encoded
        
        cv_scores = cross_val_score(
            self.model, X_cv, y_cv, cv=3, scoring='accuracy'
        )
        
        print(f"   ✅ CV accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
        
        # Store metadata
        self.model_metadata = {
            'training_date': datetime.now().isoformat(),
            'dataset_type': 'final_augmented_binary_with_severity_mapping',
            'total_samples': len(X),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'features': len(self.feature_columns),
            'diseases': len(self.label_encoder.classes_),
            'train_accuracy': float(train_score),
            'test_accuracy': float(test_score),
            'cv_accuracy_mean': float(cv_scores.mean()),
            'cv_accuracy_std': float(cv_scores.std()),
            'model_type': 'RandomForestClassifier',
            'feature_columns': self.feature_columns,
            'disease_classes': self.label_encoder.classes_.tolist(),
            'severity_duration_mapping': True
        }
        
        return X_test, y_test
    
    def create_enhanced_prediction_method(self) -> str:
        """
        Create method that uses binary model + severity/duration enhancement
        """
        print("\n🎯 Creating Enhanced Prediction Method...")
        
        enhanced_code = '''
def predict_with_severity_duration_enhancement(self, symptom_objects: List[Dict]) -> Dict:
    """
    Enhanced prediction using binary model + severity/duration weighting
    """
    if not symptom_objects:
        return {"predictions": [], "error": "No symptoms provided"}
    
    # Create binary feature vector
    feature_vector = np.zeros(len(self.feature_columns))
    enhancement_weights = []
    
    for symptom_obj in symptom_objects:
        symptom_name = symptom_obj.get('name', '')
        severity = symptom_obj.get('severity', 'moderate')
        duration = symptom_obj.get('duration', '1 week')
        
        # Find matching feature
        matching_feature = None
        for feature in self.feature_columns:
            if feature.lower().replace(' ', '') == symptom_name.lower().replace(' ', ''):
                matching_feature = feature
                break
        
        if matching_feature:
            feature_index = self.feature_columns.index(matching_feature)
            feature_vector[feature_index] = 1  # Binary activation
            
            # Calculate severity/duration enhancement weight
            enhancement_weight = self._calculate_enhancement_weight(
                symptom_name, severity, duration
            )
            enhancement_weights.append(enhancement_weight)
    
    # Get base prediction
    base_probabilities = self.model.predict_proba([feature_vector])[0]
    
    # Apply severity/duration enhancement
    if enhancement_weights:
        avg_enhancement = np.mean(enhancement_weights)
        enhanced_probabilities = base_probabilities * avg_enhancement
        enhanced_probabilities = enhanced_probabilities / enhanced_probabilities.sum()
    else:
        enhanced_probabilities = base_probabilities
    
    # Get top predictions
    top_indices = np.argsort(enhanced_probabilities)[-5:][::-1]
    
    predictions = []
    for idx in top_indices:
        disease = self.label_encoder.inverse_transform([idx])[0]
        confidence = enhanced_probabilities[idx]
        
        predictions.append({
            'disease': disease,
            'confidence': float(confidence),
            'confidence_percentage': f"{confidence * 100:.1f}%"
        })
    
    return {
        'predictions': predictions,
        'model_info': 'final_augmented_enhanced',
        'enhancement_applied': len(enhancement_weights) > 0
    }
'''
        
        # Save enhanced method
        method_file = "services/final_augmented_enhanced_method.py"
        with open(method_file, 'w') as f:
            f.write(enhanced_code)
        
        print(f"✅ Enhanced prediction method saved: {method_file}")
        return method_file
    
    def save_model(self):
        """Save the trained model with severity/duration mapping"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save model
        model_file = f'models/final_augmented_model_{timestamp}.pkl'
        with open(model_file, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'label_encoder': self.label_encoder,
                'feature_columns': self.feature_columns,
                'metadata': self.model_metadata,
                'severity_duration_mapping': self.severity_duration_weights
            }, f)
        
        print(f"\n💾 Model saved: {model_file}")
        
        # Save metadata
        metadata_file = f'models/final_augmented_metadata_{timestamp}.json'
        with open(metadata_file, 'w') as f:
            json.dump(self.model_metadata, f, indent=2)
        
        print(f"💾 Metadata saved: {metadata_file}")
        
        return model_file

def main():
    """Main training process"""
    print("🚀 Final Augmented Model Training with Severity/Duration Enhancement")
    print("=" * 70)
    
    try:
        # Initialize trainer
        trainer = FinalAugmentedModelTrainer()
        
        # Load data
        trainer.load_final_augmented_data()
        
        # Prepare features
        X, y_encoded, y_raw = trainer.prepare_hybrid_features()
        
        # Train model
        trainer.train_final_augmented_model(X, y_encoded)
        
        # Create enhanced prediction method
        trainer.create_enhanced_prediction_method()
        
        # Save model
        model_file = trainer.save_model()
        
        print("\n🎉 Final Augmented Training Complete!")
        print("=" * 50)
        print("📊 Model Statistics:")
        print(f"   - Records: {trainer.model_metadata['total_samples']:,}")
        print(f"   - Diseases: {trainer.model_metadata['diseases']}")
        print(f"   - Symptoms: {trainer.model_metadata['features']}")
        print(f"   - Test Accuracy: {trainer.model_metadata['test_accuracy']:.1%}")
        print(f"   - Enhanced with severity/duration: ✅")
        
        print("\n🎯 Strategy: Binary ML model + Severity/Duration enhancement")
        print("✅ Best of both worlds: Scale + Medical precision")
        
        return True
        
    except Exception as e:
        print(f"❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    main()