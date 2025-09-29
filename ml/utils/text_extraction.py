import os
import re
from typing import Optional

def extract_text_from_document(url: str, doc_type: Optional[str] = None) -> str:
    """
    Extract text from a document URL.
    
    In a real application, this would download and process the document.
    For this demonstration, we return mock text based on document type.
    
    Args:
        url: URL of the document
        doc_type: Type of document (e.g., 'prescription', 'lab_report')
        
    Returns:
        Extracted text from the document
    """
    # Extract filename from URL
    filename = os.path.basename(url).lower()
    
    # Determine document type from filename if not provided
    if not doc_type:
        if any(term in filename for term in ["rx", "prescription", "med"]):
            doc_type = "prescription"
        elif any(term in filename for term in ["lab", "test", "result"]):
            doc_type = "lab_report"
        elif any(term in filename for term in ["history", "record"]):
            doc_type = "medical_history"
        else:
            doc_type = "unknown"
    
    # Return mock text based on document type
    if doc_type == "prescription":
        return _get_mock_prescription_text()
    elif doc_type == "lab_report":
        return _get_mock_lab_report_text()
    elif doc_type == "medical_history":
        return _get_mock_medical_history_text()
    else:
        return f"Document content from {url} (type: {doc_type})"

def _get_mock_prescription_text() -> str:
    """Generate mock prescription text."""
    return """
    PRESCRIPTION
    
    Patient: John Doe
    Date: 2025-09-20
    
    Rx:
    1. Metformin 500mg
       Sig: Take 1 tablet twice daily with meals
       Disp: 60 tablets
       Refills: 3
    
    2. Lisinopril 10mg
       Sig: Take 1 tablet once daily in the morning
       Disp: 30 tablets
       Refills: 3
    
    3. Atorvastatin 20mg
       Sig: Take 1 tablet daily at bedtime
       Disp: 30 tablets
       Refills: 3
    
    Dr. Sarah Johnson, MD
    License: 12345
    """

def _get_mock_lab_report_text() -> str:
    """Generate mock lab report text."""
    return """
    LABORATORY REPORT
    
    Patient: John Doe
    Collection Date: 2025-09-15
    Report Date: 2025-09-17
    
    CHEMISTRY PANEL:
    Glucose (Fasting): 124 mg/dL [70-99]*
    HbA1c: 7.2% [<5.7]*
    
    LIPID PANEL:
    Total Cholesterol: 210 mg/dL [<200]*
    LDL Cholesterol: 142 mg/dL [<100]*
    HDL Cholesterol: 38 mg/dL [>40]*
    Triglycerides: 180 mg/dL [<150]*
    
    LIVER FUNCTION:
    ALT: 32 U/L [10-40]
    AST: 28 U/L [10-40]
    
    KIDNEY FUNCTION:
    Creatinine: 0.9 mg/dL [0.6-1.2]
    eGFR: >90 mL/min [>60]
    
    * Result outside reference range
    
    INTERPRETATION:
    Elevated glucose and HbA1c consistent with Type 2 Diabetes.
    Dyslipidemia present with elevated LDL, low HDL, and elevated triglycerides.
    Liver and kidney function within normal ranges.
    
    Dr. Michael Lee
    Laboratory Director
    """

def _get_mock_medical_history_text() -> str:
    """Generate mock medical history text."""
    return """
    MEDICAL HISTORY
    
    Patient: John Doe
    DOB: 1975-06-15
    
    DIAGNOSES:
    1. Type 2 Diabetes Mellitus - diagnosed 2018
    2. Essential Hypertension - diagnosed 2016
    3. Hyperlipidemia - diagnosed 2016
    4. Obesity - BMI 28.4
    
    SURGICAL HISTORY:
    1. Appendectomy - 1990
    2. Right knee arthroscopy - 2010
    
    ALLERGIES:
    Penicillin - rash
    
    FAMILY HISTORY:
    Father: Myocardial infarction at age 62, Type 2 Diabetes
    Mother: Hypertension, Stroke at age 70
    
    SOCIAL HISTORY:
    Occupation: Office manager
    Smoking: Never
    Alcohol: Occasional (1-2 drinks/week)
    Exercise: Sedentary lifestyle
    
    MEDICATIONS (Prior to current regimen):
    1. Metformin 500mg BID (started 2018)
    2. Lisinopril 5mg daily (increased to 10mg in 2023)
    3. Simvastatin 20mg daily (changed to Atorvastatin in 2024)
    
    PREVENTATIVE CARE:
    Last colonoscopy: 2022 - normal
    Last eye exam: 2024 - mild nonproliferative diabetic retinopathy
    """

def clean_medical_text(text: str) -> str:
    """
    Clean and normalize medical text.
    
    Args:
        text: Raw medical text
        
    Returns:
        Cleaned and normalized text
    """
    if not text:
        return ""
    
    # Remove multiple whitespaces
    text = re.sub(r'\s+', ' ', text)
    
    # Normalize common medical abbreviations
    abbreviations = {
        r'\b[Tt]\.?\s*2\s*[Dd][Mm]\b': 'Type 2 Diabetes Mellitus',
        r'\b[Hh][Tt][Nn]\b': 'Hypertension',
        r'\b[Bb][Ii][Dd]\b': 'twice daily',
        r'\b[Tt][Ii][Dd]\b': 'three times daily',
        r'\b[Qq][Dd]\b': 'once daily',
        r'\b[Pp][Rr][Nn]\b': 'as needed',
    }
    
    for abbr, full in abbreviations.items():
        text = re.sub(abbr, full, text)
    
    return text.strip()