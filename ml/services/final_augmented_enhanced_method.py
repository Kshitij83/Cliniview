
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
