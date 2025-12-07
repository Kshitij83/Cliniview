#!/usr/bin/env python3
"""
CliniView ML Model Performance Visualization
Specifically for Final Augmented Model trained on Training.csv
"""

import pickle
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)
import warnings
warnings.filterwarnings('ignore')

# Set style
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

def load_model_and_data():
    """Load the trained model and test data"""
    print("📂 Loading model and test data...")
    
    # Load model
    model_path = 'models/final_augmented_model_20251108_001822.pkl'
    with open(model_path, 'rb') as f:
        model_data = pickle.load(f)
    
    model = model_data['model']
    label_encoder = model_data.get('label_encoder')
    
    # Load the final augmented dataset
    full_df = pd.read_csv('data/final_augmented_cliniview_20251107_224903.csv')
    
    # Use last 10% as test data (to simulate test set)
    test_size = int(len(full_df) * 0.1)
    test_df = full_df.tail(test_size).copy()
    
    print(f"✓ Model: {type(model).__name__}")
    print(f"✓ Full dataset: {len(full_df)} samples")
    print(f"✓ Test samples: {len(test_df)} (10% of dataset)")
    
    return model, test_df, label_encoder

def prepare_test_data(test_df):
    """Prepare features and labels from test data"""
    # Get feature columns (all except 'prognosis')
    feature_cols = [col for col in test_df.columns if col.lower() != 'prognosis']
    
    X_test = test_df[feature_cols].values
    y_test = test_df['prognosis'].astype(str).values  # Ensure labels are strings
    
    print(f"✓ Features: {len(feature_cols)}")
    print(f"✓ Classes: {len(np.unique(y_test))}")
    
    return X_test, y_test, feature_cols

def create_comprehensive_visualization(y_true, y_pred, y_pred_proba, model, feature_names):
    """Create a comprehensive performance dashboard"""
    
    print("\n📊 Generating visualizations...")
    
    # Calculate metrics
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
    recall = recall_score(y_true, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)
    
    # Get class names
    class_names = np.unique(y_true)
    n_classes = len(class_names)
    
    # Create figure with subplots
    fig = plt.figure(figsize=(20, 12))
    gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)
    
    # 1. Overall Performance Metrics (Top Left)
    ax1 = fig.add_subplot(gs[0, 0])
    metrics = {
        'Accuracy': accuracy,
        'Precision': precision,
        'Recall': recall,
        'F1-Score': f1
    }
    colors = ['#2ecc71', '#3498db', '#e74c3c', '#f39c12']
    bars = ax1.bar(metrics.keys(), metrics.values(), color=colors, alpha=0.8, edgecolor='black', linewidth=2)
    
    for bar in bars:
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.3f}\n({height*100:.1f}%)',
                ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    ax1.set_ylabel('Score', fontsize=12, fontweight='bold')
    ax1.set_title('Overall Performance Metrics', fontsize=14, fontweight='bold', pad=15)
    ax1.set_ylim([0, 1.1])
    ax1.axhline(y=0.7, color='red', linestyle='--', linewidth=2, alpha=0.5, label='70% Target')
    ax1.legend(fontsize=10)
    ax1.grid(axis='y', alpha=0.3)
    
    # 2. Per-Class Performance (Top Middle & Right)
    ax2 = fig.add_subplot(gs[0, 1:])
    
    # Calculate per-class metrics
    class_precision = precision_score(y_true, y_pred, average=None, zero_division=0, labels=class_names)
    class_recall = recall_score(y_true, y_pred, average=None, zero_division=0, labels=class_names)
    class_f1 = f1_score(y_true, y_pred, average=None, zero_division=0, labels=class_names)
    
    # Show top 10 and bottom 10 classes by F1-score
    sorted_indices = np.argsort(class_f1)
    top_10_idx = sorted_indices[-10:][::-1]
    bottom_10_idx = sorted_indices[:10]
    
    selected_idx = np.concatenate([top_10_idx, bottom_10_idx])
    selected_classes = class_names[selected_idx]
    selected_f1 = class_f1[selected_idx]
    
    colors_bar = ['green' if i < 10 else 'red' for i in range(len(selected_idx))]
    bars = ax2.barh(range(len(selected_classes)), selected_f1, color=colors_bar, alpha=0.6)
    ax2.set_yticks(range(len(selected_classes)))
    ax2.set_yticklabels(selected_classes, fontsize=8)
    ax2.set_xlabel('F1-Score', fontsize=11, fontweight='bold')
    ax2.set_title('Class-wise Performance (Top 10 & Bottom 10 by F1-Score)', fontsize=14, fontweight='bold', pad=15)
    ax2.axvline(x=0.7, color='orange', linestyle='--', linewidth=2, alpha=0.5)
    ax2.grid(axis='x', alpha=0.3)
    
    # 3. Confusion Matrix (Middle Left & Center)
    ax3 = fig.add_subplot(gs[1, :2])
    
    # Show confusion matrix for top 15 most common classes
    unique, counts = np.unique(y_true, return_counts=True)
    top_15_idx = np.argsort(counts)[-15:][::-1]
    top_15_classes = unique[top_15_idx]
    
    mask = np.isin(y_true, top_15_classes)
    y_true_filtered = y_true[mask]
    y_pred_filtered = y_pred[mask]
    
    cm = confusion_matrix(y_true_filtered, y_pred_filtered, labels=top_15_classes)
    sns.heatmap(cm, annot=True, fmt='d', cmap='YlOrRd', 
                xticklabels=top_15_classes, yticklabels=top_15_classes,
                ax=ax3, cbar_kws={'label': 'Count'}, square=False)
    ax3.set_xlabel('Predicted', fontsize=11, fontweight='bold')
    ax3.set_ylabel('Actual', fontsize=11, fontweight='bold')
    ax3.set_title('Confusion Matrix (Top 15 Most Common Classes)', fontsize=14, fontweight='bold', pad=15)
    plt.setp(ax3.get_xticklabels(), rotation=45, ha='right', fontsize=7)
    plt.setp(ax3.get_yticklabels(), rotation=0, fontsize=7)
    
    # 4. Feature Importance (Middle Right)
    ax4 = fig.add_subplot(gs[1, 2])
    
    # Get feature importances
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        top_20_idx = np.argsort(importances)[-20:][::-1]
        top_features = [feature_names[i] for i in top_20_idx]
        top_importances = importances[top_20_idx]
        
        bars = ax4.barh(range(len(top_features)), top_importances, color='skyblue', alpha=0.8)
        ax4.set_yticks(range(len(top_features)))
        ax4.set_yticklabels(top_features, fontsize=7)
        ax4.set_xlabel('Importance', fontsize=10, fontweight='bold')
        ax4.set_title('Top 20 Feature Importance', fontsize=12, fontweight='bold', pad=10)
        ax4.grid(axis='x', alpha=0.3)
    
    # 5. Prediction Confidence Distribution (Bottom Left)
    ax5 = fig.add_subplot(gs[2, 0])
    
    max_proba = np.max(y_pred_proba, axis=1)
    ax5.hist(max_proba, bins=30, color='purple', alpha=0.7, edgecolor='black')
    ax5.axvline(x=np.mean(max_proba), color='red', linestyle='--', linewidth=2, 
                label=f'Mean: {np.mean(max_proba):.3f}')
    ax5.set_xlabel('Confidence Score', fontsize=11, fontweight='bold')
    ax5.set_ylabel('Frequency', fontsize=11, fontweight='bold')
    ax5.set_title('Prediction Confidence Distribution', fontsize=14, fontweight='bold', pad=15)
    ax5.legend(fontsize=10)
    ax5.grid(alpha=0.3)
    
    # 6. Model Summary Stats (Bottom Middle)
    ax6 = fig.add_subplot(gs[2, 1])
    ax6.axis('off')
    
    summary_text = f"""
    MODEL SUMMARY
    {'='*40}
    
    Model Type: Random Forest Classifier
    Total Classes: {n_classes}
    Test Samples: {len(y_true)}
    Features: {len(feature_names)}
    
    PERFORMANCE METRICS
    {'='*40}
    Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)
    Precision: {precision:.4f} ({precision*100:.2f}%)
    Recall:    {recall:.4f} ({recall*100:.2f}%)
    F1-Score:  {f1:.4f} ({f1*100:.2f}%)
    
    CONFIDENCE STATISTICS
    {'='*40}
    Mean Confidence: {np.mean(max_proba):.4f}
    Median Confidence: {np.median(max_proba):.4f}
    Min Confidence: {np.min(max_proba):.4f}
    Max Confidence: {np.max(max_proba):.4f}
    """
    
    ax6.text(0.1, 0.5, summary_text, fontsize=10, family='monospace',
             verticalalignment='center', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.3))
    
    # 7. Correct vs Incorrect Predictions (Bottom Right)
    ax7 = fig.add_subplot(gs[2, 2])
    
    correct = np.sum(y_true == y_pred)
    incorrect = len(y_true) - correct
    
    wedges, texts, autotexts = ax7.pie([correct, incorrect], 
                                        labels=['Correct', 'Incorrect'],
                                        autopct='%1.1f%%',
                                        colors=['#2ecc71', '#e74c3c'],
                                        startangle=90,
                                        textprops={'fontsize': 12, 'fontweight': 'bold'})
    ax7.set_title('Prediction Accuracy Breakdown', fontsize=14, fontweight='bold', pad=15)
    
    # Main title
    fig.suptitle('CliniView Final Augmented Model - Performance Dashboard\n246,823 Training Records | 721 Diseases | 377 Symptoms', 
                 fontsize=18, fontweight='bold', y=0.98)
    
    # Save
    output_path = 'model_performance_visualization.png'
    plt.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
    print(f"✅ Visualization saved: {output_path}")
    plt.close()
    
    return accuracy, precision, recall, f1

def main():
    """Main execution function"""
    print("\n" + "="*70)
    print("CliniView Final Augmented Model - Performance Visualization")
    print("="*70 + "\n")
    
    # Load model and data
    model, test_df, label_encoder = load_model_and_data()
    
    # Prepare test data
    X_test, y_test, feature_names = prepare_test_data(test_df)
    
    # Make predictions
    print("\n🔮 Making predictions...")
    y_pred_encoded = model.predict(X_test)
    
    # Decode predictions if label encoder exists
    if label_encoder is not None:
        y_pred = label_encoder.inverse_transform(y_pred_encoded)
        print("✓ Predictions decoded using label encoder")
    else:
        y_pred = y_pred_encoded.astype(str)
    
    y_pred_proba = model.predict_proba(X_test)
    print("✓ Predictions complete")
    
    # Create visualization
    accuracy, precision, recall, f1 = create_comprehensive_visualization(
        y_test, y_pred, y_pred_proba, model, feature_names
    )
    
    # Print summary
    print("\n" + "="*70)
    print("FINAL RESULTS")
    print("="*70)
    print(f"Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"Precision: {precision:.4f} ({precision*100:.2f}%)")
    print(f"Recall:    {recall:.4f} ({recall*100:.2f}%)")
    print(f"F1-Score:  {f1:.4f} ({f1*100:.2f}%)")
    print("="*70 + "\n")
    
    print("✅ Visualization complete! Check 'model_performance_visualization.png'")

if __name__ == "__main__":
    main()
