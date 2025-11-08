#!/usr/bin/env python3
"""
Columbia Dataset Augmentation
Creates multiple training samples per disease for proper ML training
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime

class ColumbiaDatasetAugmenter:
    def __init__(self, input_file=None):
        """Initialize with Columbia training data"""
        self.input_file = input_file
        
    def load_columbia_data(self):
        """Load the Columbia training dataset"""
        import glob
        import os
        
        if self.input_file:
            data_file = self.input_file
        else:
            # Find the most recent Columbia training file
            pattern = "data/columbia_training_*.csv"
            files = glob.glob(pattern)
            
            if not files:
                raise FileNotFoundError("No Columbia training files found")
            
            data_file = max(files, key=os.path.getctime)
        
        print(f"📂 Loading Columbia data: {data_file}")
        self.df = pd.read_csv(data_file)
        print(f"📊 Original dataset: {self.df.shape}")
        
        return self.df
    
    def create_symptom_variations(self, disease_row, num_variations=100):
        """
        Create variations of a disease by:
        1. Adding/removing symptoms probabilistically
        2. Varying symptom weights
        3. Adding mild background symptoms
        """
        variations = []
        disease_name = disease_row['prognosis']
        feature_columns = [col for col in self.df.columns if col != 'prognosis']
        
        # Get the base symptom pattern
        base_symptoms = disease_row[feature_columns].values
        
        # Identify primary symptoms (non-zero in original)
        primary_symptom_indices = np.where(base_symptoms > 0)[0]
        primary_weights = base_symptoms[primary_symptom_indices]
        
        for i in range(num_variations):
            # Start with zeros
            variation = np.zeros(len(feature_columns))
            
            # Always include core symptoms (with some variation)
            for idx, weight in zip(primary_symptom_indices, primary_weights):
                # Core symptoms: 80-120% of original weight
                variation_factor = np.random.uniform(0.8, 1.2)
                variation[idx] = weight * variation_factor
            
            # Randomly drop some symptoms (simulate incomplete reporting)
            if len(primary_symptom_indices) > 2 and np.random.random() < 0.3:
                # Remove 1 symptom 30% of the time
                drop_idx = np.random.choice(primary_symptom_indices)
                variation[drop_idx] = 0
            
            # Add mild background symptoms (common symptoms at low weight)
            background_symptoms = ['Fatigue', 'Asthenia', 'Dizziness', 'Nausea']
            for symptom in background_symptoms:
                if symptom in feature_columns:
                    idx = feature_columns.index(symptom)
                    if variation[idx] == 0 and np.random.random() < 0.2:
                        # Add mild background symptom
                        variation[idx] = np.random.uniform(1.0, 2.5)
            
            # Create variation row
            var_row = dict(zip(feature_columns, variation))
            var_row['prognosis'] = disease_name
            variations.append(var_row)
        
        return variations
    
    def augment_dataset(self, variations_per_disease=100):
        """Create augmented dataset with multiple samples per disease"""
        print(f"\n🔄 Augmenting dataset with {variations_per_disease} variations per disease...")
        
        augmented_data = []
        
        for idx, row in self.df.iterrows():
            disease_name = row['prognosis']
            print(f"   📋 Generating variations for: {disease_name}")
            
            # Create variations
            variations = self.create_symptom_variations(row, variations_per_disease)
            augmented_data.extend(variations)
        
        # Convert to DataFrame
        augmented_df = pd.DataFrame(augmented_data)
        
        print(f"\n✅ Augmentation complete:")
        print(f"   - Original: {len(self.df)} samples")
        print(f"   - Augmented: {len(augmented_df)} samples")
        print(f"   - Diseases: {len(augmented_df['prognosis'].unique())}")
        
        # Show distribution
        disease_counts = augmented_df['prognosis'].value_counts()
        print(f"   - Samples per disease: {disease_counts.iloc[0]} (target: {variations_per_disease})")
        
        return augmented_df
    
    def validate_augmentation(self, augmented_df):
        """Validate the quality of augmented data"""
        print(f"\n🔍 Validating augmented dataset...")
        
        feature_columns = [col for col in augmented_df.columns if col != 'prognosis']
        
        # Check each disease
        for disease in augmented_df['prognosis'].unique():
            disease_data = augmented_df[augmented_df['prognosis'] == disease]
            
            # Calculate symptom frequency for this disease
            symptom_freq = {}
            for col in feature_columns:
                non_zero_count = (disease_data[col] > 0).sum()
                freq = non_zero_count / len(disease_data)
                if freq > 0.5:  # Symptom appears in >50% of cases
                    symptom_freq[col] = freq
            
            print(f"   🏥 {disease}:")
            print(f"      - Samples: {len(disease_data)}")
            print(f"      - Core symptoms: {list(symptom_freq.keys())}")
        
        return True
    
    def save_augmented_dataset(self, augmented_df):
        """Save the augmented dataset"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save augmented training data
        output_file = f"data/columbia_augmented_{timestamp}.csv"
        augmented_df.to_csv(output_file, index=False)
        print(f"\n💾 Saved augmented dataset: {output_file}")
        
        # Save metadata
        metadata = {
            'creation_date': datetime.now().isoformat(),
            'source_dataset': 'columbia_training',
            'augmentation_method': 'symptom_variations',
            'total_samples': len(augmented_df),
            'diseases': len(augmented_df['prognosis'].unique()),
            'features': len([col for col in augmented_df.columns if col != 'prognosis']),
            'samples_per_disease': int(len(augmented_df) / len(augmented_df['prognosis'].unique())),
            'disease_list': sorted(augmented_df['prognosis'].unique().tolist())
        }
        
        metadata_file = f"data/columbia_augmented_metadata_{timestamp}.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"💾 Saved metadata: {metadata_file}")
        
        return output_file, metadata

def main():
    """Main augmentation process"""
    print("🔄 Columbia Dataset Augmentation")
    print("=" * 40)
    
    try:
        # Initialize augmenter
        augmenter = ColumbiaDatasetAugmenter()
        
        # Load original Columbia data
        augmenter.load_columbia_data()
        
        # Create augmented dataset
        augmented_df = augmenter.augment_dataset(variations_per_disease=100)
        
        # Validate augmentation
        augmenter.validate_augmentation(augmented_df)
        
        # Save augmented dataset
        output_file, metadata = augmenter.save_augmented_dataset(augmented_df)
        
        print("\n🎉 Dataset Augmentation Complete!")
        print("=" * 40)
        print(f"📊 Results:")
        print(f"   - Total samples: {metadata['total_samples']:,}")
        print(f"   - Diseases: {metadata['diseases']}")
        print(f"   - Features: {metadata['features']}")
        print(f"   - Samples per disease: {metadata['samples_per_disease']}")
        
        print(f"\n📁 Files:")
        print(f"   - Dataset: {output_file}")
        print(f"   - Metadata: {output_file.replace('.csv', '_metadata.json')}")
        
        print(f"\n➡️  Next: Run 'python train_columbia_model.py {output_file}' to train the model")
        
        return True
        
    except Exception as e:
        print(f"❌ Augmentation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    main()