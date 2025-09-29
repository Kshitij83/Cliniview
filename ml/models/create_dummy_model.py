import pickle

class SymptomModel:
    """
    A simple symptom analysis model for demonstration purposes.
    
    In a real application, this would be a trained machine learning model.
    """
    def __init__(self):
        self.symptom_condition_map = {
            "headache": ["migraine", "tension headache", "sinusitis"],
            "fever": ["common cold", "influenza", "COVID-19"],
            "cough": ["common cold", "bronchitis", "COVID-19"],
            "fatigue": ["influenza", "anemia", "depression"],
            "shortness of breath": ["asthma", "COVID-19", "heart failure"],
            "chest pain": ["angina", "myocardial infarction", "acid reflux"]
        }
        
    def predict(self, symptoms):
        """Predict possible conditions based on symptoms."""
        possible_conditions = {}
        
        for symptom in symptoms:
            symptom = symptom.lower()
            if symptom in self.symptom_condition_map:
                for condition in self.symptom_condition_map[symptom]:
                    possible_conditions[condition] = possible_conditions.get(condition, 0) + 1
        
        result = []
        for condition, count in possible_conditions.items():
            # Calculate a simple probability based on symptom matches
            probability = min(count / len(symptoms), 1.0)
            result.append({
                "name": condition,
                "probability": probability
            })
        
        # Sort by probability
        result.sort(key=lambda x: x["probability"], reverse=True)
        
        return result

# Create and save a dummy model for demonstration
model = SymptomModel()

with open("symptom_checker.pkl", "wb") as f:
    pickle.dump(model, f)

print("Sample symptom model saved as symptom_checker.pkl")