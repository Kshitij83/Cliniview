#!/usr/bin/env python3
"""
Large Dataset Handler for 190MB Medical Dataset
Efficient processing and analysis of massive medical datasets
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime
import os
import sys
from typing import Dict, List, Optional, Iterator
import warnings
warnings.filterwarnings('ignore')

class LargeDatasetHandler:
    def __init__(self, dataset_path: str = None):
        """Initialize handler for large medical dataset"""
        self.dataset_path = dataset_path
        self.chunk_size = 10000  # Process in chunks to handle memory
        self.metadata = {}
        
    def analyze_dataset_structure(self) -> Dict:
        """
        Analyze the structure of the large dataset without loading it entirely
        """
        print("🔍 Analyzing Large Dataset Structure (190MB)")
        print("=" * 50)
        
        if not self.dataset_path or not os.path.exists(self.dataset_path):
            print("❌ Dataset file not found!")
            return {}
        
        # Get file info
        file_size = os.path.getsize(self.dataset_path) / (1024*1024)  # MB
        print(f"📊 File Size: {file_size:.1f} MB")
        
        # Read first chunk to understand structure
        try:
            # Try different separators and encodings
            sample_df = pd.read_csv(self.dataset_path, nrows=1000)
            
            structure_info = {
                'file_size_mb': file_size,
                'total_columns': len(sample_df.columns),
                'column_names': sample_df.columns.tolist(),
                'data_types': sample_df.dtypes.to_dict(),
                'sample_rows': len(sample_df),
                'has_header': True,
                'potential_target_columns': [],
                'potential_feature_columns': [],
                'missing_values': sample_df.isnull().sum().to_dict()
            }
            
            # Identify potential target columns (disease/diagnosis)
            target_keywords = ['disease', 'diagnosis', 'condition', 'label', 'target', 'class']
            for col in sample_df.columns:
                if any(keyword in col.lower() for keyword in target_keywords):
                    structure_info['potential_target_columns'].append(col)
            
            # Identify potential symptom/feature columns
            symptom_keywords = ['symptom', 'sign', 'feature', 'clinical']
            for col in sample_df.columns:
                if any(keyword in col.lower() for keyword in symptom_keywords) or \
                   col.lower().startswith(('has_', 'is_', 'patient_')):
                    structure_info['potential_feature_columns'].append(col)
            
            print(f"✅ Dataset Structure Analysis:")
            print(f"   - Columns: {structure_info['total_columns']}")
            print(f"   - Sample rows analyzed: {structure_info['sample_rows']}")
            print(f"   - Potential target columns: {structure_info['potential_target_columns']}")
            print(f"   - Potential feature columns: {len(structure_info['potential_feature_columns'])}")
            
            # Show first few rows
            print(f"\n📋 Sample Data Preview:")
            print(sample_df.head(3).to_string())
            
            return structure_info
            
        except Exception as e:
            print(f"❌ Error analyzing dataset: {e}")
            return {}
    
    def estimate_dataset_size(self) -> Dict:
        """
        Estimate total rows and processing requirements
        """
        try:
            # Count total rows efficiently
            with open(self.dataset_path, 'r') as f:
                total_rows = sum(1 for line in f) - 1  # Subtract header
            
            # Estimate memory requirements
            sample_df = pd.read_csv(self.dataset_path, nrows=1000)
            memory_per_1k_rows = sample_df.memory_usage(deep=True).sum() / (1024*1024)  # MB
            estimated_memory = (total_rows / 1000) * memory_per_1k_rows
            
            size_info = {
                'total_rows': total_rows,
                'estimated_memory_mb': estimated_memory,
                'recommended_chunk_size': min(10000, max(1000, int(500 / memory_per_1k_rows * 1000))),
                'processing_chunks': int(total_rows / self.chunk_size) + 1
            }
            
            print(f"\n📏 Dataset Size Estimation:")
            print(f"   - Total rows: {total_rows:,}")
            print(f"   - Estimated memory: {estimated_memory:.1f} MB")
            print(f"   - Recommended chunk size: {size_info['recommended_chunk_size']:,}")
            print(f"   - Processing chunks needed: {size_info['processing_chunks']}")
            
            return size_info
            
        except Exception as e:
            print(f"❌ Error estimating dataset size: {e}")
            return {}
    
    def process_in_chunks(self, processing_function) -> List[Dict]:
        """
        Process the large dataset in manageable chunks
        """
        results = []
        chunk_num = 0
        
        try:
            for chunk in pd.read_csv(self.dataset_path, chunksize=self.chunk_size):
                chunk_num += 1
                print(f"📦 Processing chunk {chunk_num} ({len(chunk):,} rows)...")
                
                chunk_result = processing_function(chunk, chunk_num)
                if chunk_result:
                    results.append(chunk_result)
                    
                # Memory cleanup
                del chunk
                
        except Exception as e:
            print(f"❌ Error processing chunk {chunk_num}: {e}")
            
        return results
    
    def extract_medical_features(self, chunk: pd.DataFrame, chunk_num: int) -> Dict:
        """
        Extract medical features from a data chunk
        """
        try:
            # Analyze this chunk for medical patterns
            chunk_analysis = {
                'chunk_number': chunk_num,
                'row_count': len(chunk),
                'unique_diseases': [],
                'unique_symptoms': [],
                'data_quality': {}
            }
            
            # Find disease/diagnosis columns
            disease_cols = [col for col in chunk.columns if 
                          any(keyword in col.lower() for keyword in ['disease', 'diagnosis', 'condition', 'label'])]
            
            if disease_cols:
                for col in disease_cols:
                    unique_diseases = chunk[col].dropna().unique()
                    chunk_analysis['unique_diseases'].extend(unique_diseases)
            
            # Find symptom/feature columns
            symptom_cols = [col for col in chunk.columns if col not in disease_cols]
            chunk_analysis['symptom_columns'] = symptom_cols[:10]  # Sample first 10
            
            # Data quality metrics
            chunk_analysis['data_quality'] = {
                'missing_percentage': (chunk.isnull().sum().sum() / (len(chunk) * len(chunk.columns))) * 100,
                'duplicate_rows': chunk.duplicated().sum(),
                'data_types': chunk.dtypes.value_counts().to_dict()
            }
            
            return chunk_analysis
            
        except Exception as e:
            print(f"⚠️ Error analyzing chunk {chunk_num}: {e}")
            return {}
    
    def convert_to_cliniview_format(self) -> str:
        """
        Convert the large dataset to Cliniview-compatible format
        """
        print("\n🔄 Converting to Cliniview Format...")
        
        # This will process the dataset and convert it to our standard format
        # Will be implemented once we see the actual dataset structure
        
        output_file = f"data/large_dataset_cliniview_format_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        # Placeholder for conversion logic
        print(f"💾 Output file will be: {output_file}")
        
        return output_file
    
    def create_metadata_report(self, analysis_results: List[Dict]) -> Dict:
        """
        Create comprehensive metadata report
        """
        if not analysis_results:
            return {}
        
        # Aggregate results from all chunks
        total_diseases = set()
        total_symptoms = set()
        total_rows = 0
        
        for result in analysis_results:
            total_diseases.update(result.get('unique_diseases', []))
            total_rows += result.get('row_count', 0)
        
        metadata = {
            'processing_date': datetime.now().isoformat(),
            'dataset_size_mb': os.path.getsize(self.dataset_path) / (1024*1024),
            'total_rows_processed': total_rows,
            'unique_diseases_found': len(total_diseases),
            'diseases_sample': list(total_diseases)[:20],  # First 20 as sample
            'chunks_processed': len(analysis_results),
            'data_quality_summary': 'High quality dataset' if total_rows > 100000 else 'Medium dataset'
        }
        
        # Save metadata
        metadata_file = f"data/large_dataset_metadata_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"💾 Metadata saved: {metadata_file}")
        
        return metadata

def main():
    """
    Main function to handle large dataset processing
    """
    print("🚀 Large Medical Dataset Handler")
    print("=" * 40)
    print("Ready to process your 190MB medical dataset!")
    print()
    print("📍 Expected location: ml/data/[your_dataset_file]")
    print()
    print("Once you upload the file, I'll:")
    print("✅ Analyze dataset structure and quality")
    print("✅ Process it efficiently in chunks") 
    print("✅ Convert to Cliniview format")
    print("✅ Create enhanced ML models")
    print("✅ Compare with Columbia dataset")
    print()
    print("Upload your dataset and let me know the filename! 🎯")

if __name__ == "__main__":
    main()