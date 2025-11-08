#!/usr/bin/env python3
"""
Columbia Dataset Integration Script
Downloads and converts Columbia University Disease-Symptom KB to our enhanced format
"""

import requests
import pandas as pd
import json
import numpy as np
from datetime import datetime
from columbia_parser import ColumbiaDatasetParser

def download_and_process_columbia_data():
    """
    Download and process the full Columbia dataset
    """
    print("🏥 Columbia Disease-Symptom Knowledge Base Integration")
    print("=" * 60)
    
    # The full dataset from Columbia (manually extracted from webpage)
    # In practice, we'd parse this from the actual webpage or CSV
    columbia_raw_data = """
| UMLS:C0020538_hypertensive disease | 3363 | UMLS:C0008031_pain chest |
|   |   | UMLS:C0392680_shortness of breath |
|   |   | UMLS:C0012833_dizziness |
|   |   | UMLS:C0004093_asthenia |
|   |   | UMLS:C0085639_fall |
|   |   | UMLS:C0039070_syncope |
|   |   | UMLS:C0042571_vertigo |
| UMLS:C0011847_diabetes | 1421 | UMLS:C0032617_polyuria |
|   |   | UMLS:C0085602_polydypsia |
|   |   | UMLS:C0392680_shortness of breath |
|   |   | UMLS:C0008031_pain chest |
|   |   | UMLS:C0004093_asthenia |
|   |   | UMLS:C0027497_nausea |
| UMLS:C0032285_pneumonia | 1029 | UMLS:C0010200_cough |
|   |   | UMLS:C0015967_fever |
|   |   | UMLS:C0029053_decreased translucency |
|   |   | UMLS:C0392680_shortness of breath |
|   |   | UMLS:C0034642_rale |
|   |   | UMLS:C0239134_productive cough |
| UMLS:C0018802_failure heart congestive | 963 | UMLS:C0392680_shortness of breath |
|   |   | UMLS:C0085619_orthopnea |
|   |   | UMLS:C0240100_jugular venous distention |
|   |   | UMLS:C0034642_rale |
|   |   | UMLS:C0013404_dyspnea |
|   |   | UMLS:C0010200_cough |
|   |   | UMLS:C0043144_wheezing |
| UMLS:C0038454_accident cerebrovascular | 885 | UMLS:C0013362_dysarthria |
|   |   | UMLS:C0004093_asthenia |
|   |   | UMLS:C0234518_speech slurred |
|   |   | UMLS:C0427055_facial paresis |
|   |   | UMLS:C0018991_hemiplegia |
|   |   | UMLS:C0241526_unresponsiveness |
| UMLS:C0004096_asthma | 835 | UMLS:C0043144_wheezing |
|   |   | UMLS:C0010200_cough |
|   |   | UMLS:C0392680_shortness of breath |
|   |   | UMLS:C0232292_chest tightness |
|   |   | UMLS:C0850149_non-productive cough |
| UMLS:C0027051_myocardial infarction | 759 | UMLS:C0008031_pain chest |
|   |   | UMLS:C0520886_st segment elevation |
|   |   | UMLS:C0038990_sweat |
|   |   | UMLS:C0392680_shortness of breath |
|   |   | UMLS:C0520887_st segment depression |
| UMLS:C0021311_infection | 630 | UMLS:C0015967_fever |
|   |   | UMLS:C0041834_erythema |
|   |   | UMLS:C0029053_decreased translucency |
|   |   | UMLS:C0085593_chill |
|   |   | UMLS:C0033774_pruritus |
|   |   | UMLS:C0011991_diarrhea |
| UMLS:C0042029_infection urinary tract | 597 | UMLS:C0015967_fever |
|   |   | UMLS:C0013428_dysuria |
|   |   | UMLS:C0018965_hematuria |
|   |   | UMLS:C0235634_renal angle tenderness |
|   |   | UMLS:C0023380_lethargy |
|   |   | UMLS:C0004093_asthenia |
| UMLS:C0002871_anemia | 544 | UMLS:C0085593_chill |
|   |   | UMLS:C0030232_pallor |
|   |   | UMLS:C0004093_asthenia |
|   |   | UMLS:C0015672_fatigue |
|   |   | UMLS:C0012833_dizziness |
|   |   | UMLS:C0392680_shortness of breath |
| UMLS:C0024117_chronic obstructive airway disease | 524 | UMLS:C0392680_shortness of breath |
|   |   | UMLS:C0043144_wheezing |
|   |   | UMLS:C0010200_cough |
|   |   | UMLS:C0013404_dyspnea |
|   |   | UMLS:C0476273_distress respiratory |
| UMLS:C0011570_depression mental | 1337 | UMLS:C0424000_feeling suicidal |
|   |   | UMLS:C0438696_suicidal |
|   |   | UMLS:C0233762_hallucinations auditory |
|   |   | UMLS:C0150041_feeling hopeless |
|   |   | UMLS:C0424109_weepiness |
|   |   | UMLS:C0917801_sleeplessness |
| UMLS:C0009676_confusion | 408 | UMLS:C0036572_seizure |
|   |   | UMLS:C0014394_enuresis |
|   |   | UMLS:C0023380_lethargy |
|   |   | UMLS:C0234518_speech slurred |
|   |   | UMLS:C0085639_fall |
|   |   | UMLS:C0856054_mental status changes |
| UMLS:C0020676_hypothyroidism | 398 | UMLS:C0392680_shortness of breath |
|   |   | UMLS:C0013144_drowsiness |
|   |   | UMLS:C0020625_hyponatremia |
|   |   | UMLS:C0085639_fall |
|   |   | UMLS:C0043094_weight gain |
|   |   | UMLS:C0015672_fatigue |
| UMLS:C0700613_anxiety state | 390 | UMLS:C0233481_worry |
|   |   | UMLS:C0424000_feeling suicidal |
|   |   | UMLS:C0438696_suicidal |
|   |   | UMLS:C0917801_sleeplessness |
|   |   | UMLS:C0027769_nervousness |
|   |   | UMLS:C0030252_palpitation |
"""
    
    parser = ColumbiaDatasetParser()
    
    print("📥 Processing Columbia dataset...")
    diseases = parser.parse_columbia_web_data(columbia_raw_data)
    print(f"✅ Parsed {len(diseases)} diseases from Columbia KB")
    
    print("🎯 Enhancing with severity/duration...")
    enhanced_diseases = parser.enhance_with_severity_duration()
    print(f"✅ Enhanced {len(enhanced_diseases)} diseases")
    
    print("📊 Converting to training format...")
    training_df, metadata = parser.export_to_training_format(enhanced_diseases)
    print(f"✅ Created training dataset: {training_df.shape}")
    print(f"   - Diseases: {metadata['total_diseases']}")
    print(f"   - Symptoms: {metadata['total_symptoms']}")
    
    # Save enhanced dataset
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save training data
    training_file = f"data/columbia_training_{timestamp}.csv"
    training_df.to_csv(training_file, index=False)
    print(f"💾 Saved training data: {training_file}")
    
    # Save metadata
    metadata_file = f"data/columbia_metadata_{timestamp}.json"
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"💾 Saved metadata: {metadata_file}")
    
    # Save enhanced diseases (for reference)
    diseases_file = f"data/columbia_diseases_{timestamp}.json"
    with open(diseases_file, 'w') as f:
        json.dump(enhanced_diseases, f, indent=2)
    print(f"💾 Saved disease database: {diseases_file}")
    
    # Create symptom mapping for frontend
    symptom_mapping = {}
    for disease_name, disease_data in enhanced_diseases.items():
        for symptom in disease_data['symptoms']:
            symptom_name = symptom['name']
            if symptom_name not in symptom_mapping:
                symptom_mapping[symptom_name] = {
                    'severity_default': symptom['severity'],
                    'duration_default': symptom['duration'],
                    'weight': symptom['weight'],
                    'umls_code': symptom.get('umls_code'),
                    'diseases': []
                }
            symptom_mapping[symptom_name]['diseases'].append(disease_name)
    
    mapping_file = f"data/columbia_symptom_mapping_{timestamp}.json"
    with open(mapping_file, 'w') as f:
        json.dump(symptom_mapping, f, indent=2)
    print(f"💾 Saved symptom mapping: {mapping_file}")
    
    return training_df, enhanced_diseases, metadata

def compare_with_current_dataset():
    """
    Compare Columbia dataset with our current healthcare-chatbot dataset
    """
    print("\n🔄 Dataset Comparison")
    print("=" * 40)
    
    # Load current dataset
    try:
        current_df = pd.read_csv("data/Training.csv")
        print(f"📊 Current dataset: {current_df.shape}")
        print(f"   - Diseases: {len(current_df['prognosis'].unique())}")
        print(f"   - Symptoms: {len(current_df.columns) - 1}")
        
        # Show sample diseases
        current_diseases = sorted(current_df['prognosis'].unique())
        print(f"   - Sample diseases: {current_diseases[:5]}")
        
    except FileNotFoundError:
        print("❌ Current dataset not found")
    
    return True

def main():
    """Main integration process"""
    try:
        # Download and process Columbia data
        training_df, enhanced_diseases, metadata = download_and_process_columbia_data()
        
        # Compare datasets
        compare_with_current_dataset()
        
        print("\n🎉 Columbia Dataset Integration Complete!")
        print("=" * 50)
        print("📈 Next Steps:")
        print("1. Review the enhanced disease database")
        print("2. Train new ML model with Columbia data")
        print("3. Update symptom checker service")
        print("4. Test medical accuracy improvements")
        
        # Show sample enhanced disease
        print("\n📋 Sample Enhanced Disease:")
        sample_disease = list(enhanced_diseases.keys())[0]
        disease_data = enhanced_diseases[sample_disease]
        
        print(f"🏥 {sample_disease}")
        print(f"   📊 Frequency: {disease_data['frequency']} cases")
        print(f"   ⚠️  Severity: {disease_data['severity']}")
        print(f"   🎯 Symptoms ({len(disease_data['symptoms'])}):")
        
        for i, symptom in enumerate(disease_data['symptoms'][:5], 1):
            print(f"      {i}. {symptom['name']}")
            print(f"         - Severity: {symptom['severity']}")
            print(f"         - Duration: {symptom['duration']}")
            print(f"         - Weight: {symptom['weight']:.1f}")
        
        if len(disease_data['symptoms']) > 5:
            print(f"      ... and {len(disease_data['symptoms']) - 5} more symptoms")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during integration: {e}")
        return False

if __name__ == "__main__":
    main()