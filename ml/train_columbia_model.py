#!/usr/bin/env python3
"""
Enhanced ML Training for Columbia Dataset
Trains model on weighted symptom features with medical safety constraints
"""

import pandas as pd
import numpy as np
import pickle
import json
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

class ColumbiaDiseaseModelTrainer:
    def __init__(self, data_file=None):
        """Initialize trainer with Columbia dataset"""
        self.data_file = data_file
        self.model = None
        self.label_encoder = None
        self.feature_columns = None
        self.model_metadata = {}
        
    def load_latest_columbia_data(self):
        """Load the most recent Columbia training dataset"""
        import glob
        import os
        
        if self.data_file:
            data_file = self.data_file
        else:
            # Find the most recent Columbia augmented file first
            pattern = "data/columbia_augmented_*.csv"
            files = glob.glob(pattern)
            
            if files:
                # Get the most recent augmented file
                data_file = max(files, key=os.path.getctime)
                print(f"📂 Found augmented dataset: {data_file}")
            else:
                # Fall back to original Columbia training files
                pattern = "data/columbia_training_*.csv"
                files = glob.glob(pattern)
                
                if not files:
                    raise FileNotFoundError("No Columbia datasets found. Run integrate_columbia.py first.")
                
                data_file = max(files, key=os.path.getctime)
                print(f"📂 Loading original dataset: {data_file}")
        
        self.df = pd.read_csv(data_file)
        print(f"📊 Dataset loaded: {self.df.shape}")
        print(f"   - Features: {len(self.df.columns) - 1}")
        print(f"   - Diseases: {len(self.df['prognosis'].unique())}")
        
        # Check if it's augmented data
        samples_per_disease = len(self.df) // len(self.df['prognosis'].unique())
        if samples_per_disease > 1:
            print(f"   - Augmented: ~{samples_per_disease} samples per disease")
        
        return self.df
    
    def prepare_data(self):
        """Prepare weighted features and labels for training"""
        print("\n🔧 Preparing weighted training data...")
        
        # Separate features and labels
        self.feature_columns = [col for col in self.df.columns if col != 'prognosis']
        X = self.df[self.feature_columns]
        y = self.df['prognosis']
        
        # Clean disease names (remove extra spaces)
        y = y.str.strip()
        
        # Encode labels
        self.label_encoder = LabelEncoder()
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Analyze feature weights
        print(f"   ✅ Feature analysis:")
        print(f"      - Total features: {len(self.feature_columns)}")
        
        # Check weight distribution
        feature_weights = X.values.flatten()
        feature_weights = feature_weights[feature_weights > 0]  # Only non-zero weights
        
        print(f"      - Non-zero weights: {len(feature_weights)}")
        print(f"      - Weight range: {feature_weights.min():.1f} - {feature_weights.max():.1f}")
        print(f"      - Mean weight: {feature_weights.mean():.1f}")
        
        # Disease distribution
        disease_counts = pd.Series(y).value_counts()
        print(f"   ✅ Disease distribution:")
        print(f"      - Most common: {disease_counts.head(3).to_dict()}")
        
        return X, y_encoded, y
    
    def train_weighted_model(self, X, y_encoded):
        """Train Random Forest with weighted features"""
        print("\n🤖 Training weighted Random Forest model...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
        )
        
        print(f"   📊 Training set: {X_train.shape}")
        print(f"   📊 Test set: {X_test.shape}")
        
        # Train Random Forest optimized for weighted features
        self.model = RandomForestClassifier(
            n_estimators=200,           # More trees for weighted features
            max_depth=15,              # Deeper trees for complex patterns
            min_samples_split=3,       # Allow smaller splits
            min_samples_leaf=1,        # Single-sample leaves OK for weighted data
            random_state=42,
            class_weight='balanced',   # Handle class imbalance
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate model
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        print(f"   ✅ Training accuracy: {train_score:.3f}")
        print(f"   ✅ Test accuracy: {test_score:.3f}")
        
        # Cross-validation
        cv_scores = cross_val_score(
            self.model, X, y_encoded, cv=5, scoring='accuracy'
        )
        print(f"   ✅ CV accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
        
        # Predictions
        y_pred = self.model.predict(X_test)
        
        # Store metadata
        self.model_metadata = {
            'training_date': datetime.now().isoformat(),
            'dataset_type': 'columbia_weighted',
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'features': len(self.feature_columns),
            'diseases': len(self.label_encoder.classes_),
            'train_accuracy': float(train_score),
            'test_accuracy': float(test_score),
            'cv_accuracy_mean': float(cv_scores.mean()),
            'cv_accuracy_std': float(cv_scores.std()),
            'feature_columns': self.feature_columns,
            'disease_classes': self.label_encoder.classes_.tolist()
        }
        
        return X_test, y_test, y_pred
    
    def analyze_feature_importance(self):
        """Analyze which symptoms are most important for prediction"""
        print("\n📈 Feature Importance Analysis...")
        
        # Get feature importances
        importances = self.model.feature_importances_
        feature_importance_df = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': importances
        }).sort_values('importance', ascending=False)
        
        # Top 15 most important symptoms
        top_features = feature_importance_df.head(15)
        print("   🔝 Top 15 Most Predictive Symptoms:")
        
        for i, (_, row) in enumerate(top_features.iterrows(), 1):
            print(f"      {i:2d}. {row['feature']:<25} ({row['importance']:.4f})")
        
        # Save feature importance
        feature_importance_df.to_csv('data/columbia_feature_importance.csv', index=False)
        print("   💾 Saved feature importance to data/columbia_feature_importance.csv")
        
        return feature_importance_df
    
    def test_medical_predictions(self):
        """Test medical accuracy with Columbia dataset"""
        print("\n🏥 Medical Accuracy Testing...")
        
        # Test cases for Columbia diseases
        test_cases = [
            {
                'name': 'Pneumonia symptoms',
                'symptoms': ['Cough', 'Fever', 'Shortness Of Breath'],
                'weights': [4.0, 4.0, 6.0],
                'expected': 'Pneumonia'
            },
            {
                'name': 'Heart attack symptoms',
                'symptoms': ['Pain Chest', 'Shortness Of Breath', 'Sweat'],
                'weights': [4.0, 6.0, 4.0],
                'expected': 'Myocardial Infarction'
            },
            {
                'name': 'Diabetes symptoms',
                'symptoms': ['Polyuria', 'Polydypsia', 'Asthenia'],
                'weights': [4.0, 4.0, 4.0],
                'expected': 'Diabetes'
            },
            {
                'name': 'Single fever (safety test)',
                'symptoms': ['Fever'],
                'weights': [4.0],
                'expected': None  # Should have low confidence
            }
        ]
        
        print("   🧪 Testing medical scenario predictions:")
        
        for test_case in test_cases:
            # Create feature vector
            feature_vector = np.zeros(len(self.feature_columns))
            
            for symptom, weight in zip(test_case['symptoms'], test_case['weights']):
                if symptom in self.feature_columns:
                    idx = self.feature_columns.index(symptom)
                    feature_vector[idx] = weight
            
            # Predict
            probabilities = self.model.predict_proba([feature_vector])[0]
            predicted_idx = np.argmax(probabilities)
            predicted_disease = self.label_encoder.inverse_transform([predicted_idx])[0]
            confidence = probabilities[predicted_idx]
            
            # Get top 3 predictions
            top_indices = np.argsort(probabilities)[-3:][::-1]
            top_predictions = [
                (self.label_encoder.inverse_transform([idx])[0], probabilities[idx])
                for idx in top_indices
            ]
            
            print(f"\n      🔍 {test_case['name']}:")
            print(f"         Symptoms: {', '.join(test_case['symptoms'])}")
            print(f"         Weights: {test_case['weights']}")
            print(f"         Predicted: {predicted_disease} ({confidence:.1%})")
            
            if test_case['expected']:
                match = predicted_disease == test_case['expected']
                print(f"         Expected: {test_case['expected']} {'✅' if match else '❌'}")
            else:
                # Safety test - should have low confidence
                safe = confidence < 0.8
                print(f"         Safety test: {'✅ Low confidence' if safe else '❌ High confidence'}")
            
            print(f"         Top 3: {[(d, f'{p:.1%}') for d, p in top_predictions[:3]]}")
    
    def save_model(self):
        """Save trained model and metadata"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save model
        model_file = f'models/columbia_disease_model_{timestamp}.pkl'
        with open(model_file, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'label_encoder': self.label_encoder,
                'feature_columns': self.feature_columns,
                'metadata': self.model_metadata
            }, f)
        
        print(f"💾 Saved model: {model_file}")
        
        # Save metadata separately
        metadata_file = f'models/columbia_model_metadata_{timestamp}.json'
        with open(metadata_file, 'w') as f:
            json.dump(self.model_metadata, f, indent=2)
        
        print(f"💾 Saved metadata: {metadata_file}")
        
        # Create symlink to latest model
        latest_model_file = 'models/latest_columbia_model.pkl'
        try:
            import os
            if os.path.exists(latest_model_file):
                os.remove(latest_model_file)
            os.symlink(os.path.basename(model_file), latest_model_file)
            print(f"🔗 Created symlink: {latest_model_file}")
        except Exception as e:
            print(f"⚠️  Could not create symlink: {e}")
        
        return model_file

def main():
    """Main training process for Columbia dataset"""
    print("🎓 Columbia Disease Model Training")
    print("=" * 50)
    
    # Check for command line argument
    import sys
    data_file = sys.argv[1] if len(sys.argv) > 1 else None
    
    try:
        # Initialize trainer
        trainer = ColumbiaDiseaseModelTrainer(data_file=data_file)
        
        # Load data
        trainer.load_latest_columbia_data()
        
        # Prepare weighted features
        X, y_encoded, y_raw = trainer.prepare_data()
        
        # Train model
        X_test, y_test, y_pred = trainer.train_weighted_model(X, y_encoded)
        
        # Analyze features
        trainer.analyze_feature_importance()
        
        # Test medical accuracy
        trainer.test_medical_predictions()
        
        # Save model
        model_file = trainer.save_model()
        
        print("\n🎉 Columbia Model Training Complete!")
        print("=" * 40)
        print(f"📊 Model Statistics:")
        print(f"   - Diseases: {trainer.model_metadata['diseases']}")
        print(f"   - Features: {trainer.model_metadata['features']}")
        print(f"   - Test Accuracy: {trainer.model_metadata['test_accuracy']:.1%}")
        print(f"   - CV Accuracy: {trainer.model_metadata['cv_accuracy_mean']:.1%}")
        
        print(f"\n📁 Generated Files:")
        print(f"   - Model: {model_file}")
        print(f"   - Feature importance: data/columbia_feature_importance.csv")
        
        return True
        
    except Exception as e:
        print(f"❌ Training failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    main()