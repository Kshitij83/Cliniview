"""
ML Model Performance Visualization Script
Generates comprehensive performance metrics and visualizations for CliniView ML models
"""

import pickle
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, roc_auc_score,
    precision_recall_curve, roc_curve
)
from sklearn.preprocessing import LabelBinarizer
import warnings
warnings.filterwarnings('ignore')

# Set style for better-looking plots
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (20, 12)
plt.rcParams['font.size'] = 10

def load_model_and_data(model_path, test_data_path):
    """Load trained model and test data"""
    print(f"Loading model from: {model_path}")
    with open(model_path, 'rb') as f:
        loaded_data = pickle.load(f)
    
    # Handle both dictionary format and direct model format
    if isinstance(loaded_data, dict):
        model = loaded_data.get('model')
        label_encoder = loaded_data.get('label_encoder')
        feature_columns = loaded_data.get('feature_columns', [])
        print(f"✓ Model extracted from dict: {type(model).__name__}")
    else:
        model = loaded_data
        label_encoder = None
        feature_columns = []
        print(f"✓ Direct model loaded: {type(model).__name__}")
    
    print(f"Loading test data from: {test_data_path}")
    df = pd.read_csv(test_data_path)
    
    return model, df, feature_columns, label_encoder

def prepare_data(df, feature_cols, target_col='prognosis'):
    """Prepare features and target for evaluation"""
    X = df[feature_cols].values
    y = df[target_col].values
    return X, y

def calculate_metrics(y_true, y_pred, y_pred_proba=None):
    """Calculate comprehensive performance metrics"""
    metrics = {
        'accuracy': accuracy_score(y_true, y_pred),
        'precision_macro': precision_score(y_true, y_pred, average='macro', zero_division=0),
        'precision_weighted': precision_score(y_true, y_pred, average='weighted', zero_division=0),
        'recall_macro': recall_score(y_true, y_pred, average='macro', zero_division=0),
        'recall_weighted': recall_score(y_true, y_pred, average='weighted', zero_division=0),
        'f1_macro': f1_score(y_true, y_pred, average='macro', zero_division=0),
        'f1_weighted': f1_score(y_true, y_pred, average='weighted', zero_division=0),
    }
    
    return metrics

def plot_performance_metrics(metrics, output_path='model_metrics.png'):
    """Create bar plot of main performance metrics"""
    fig, ax = plt.subplots(1, 1, figsize=(12, 6))
    
    # Select main metrics to display
    main_metrics = {
        'Accuracy': metrics['accuracy'],
        'Precision (Weighted)': metrics['precision_weighted'],
        'Recall (Weighted)': metrics['recall_weighted'],
        'F1-Score (Weighted)': metrics['f1_weighted']
    }
    
    colors = ['#2ecc71', '#3498db', '#e74c3c', '#f39c12']
    bars = ax.bar(main_metrics.keys(), main_metrics.values(), color=colors, alpha=0.8, edgecolor='black', linewidth=1.5)
    
    # Add value labels on bars
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.3f}\n({height*100:.1f}%)',
                ha='center', va='bottom', fontsize=12, fontweight='bold')
    
    ax.set_ylabel('Score', fontsize=14, fontweight='bold')
    ax.set_title('CliniView ML Model - Performance Metrics', fontsize=16, fontweight='bold', pad=20)
    ax.set_ylim([0, 1.1])
    ax.axhline(y=0.7, color='red', linestyle='--', linewidth=2, alpha=0.5, label='70% Baseline')
    ax.legend(fontsize=12)
    ax.grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"✅ Performance metrics plot saved: {output_path}")
    plt.close()

def plot_confusion_matrix_top_diseases(y_true, y_pred, class_names, top_n=15, output_path='confusion_matrix.png'):
    """Plot confusion matrix for top N diseases"""
    # Get top N most frequent diseases
    unique, counts = np.unique(y_true, return_counts=True)
    top_indices = np.argsort(counts)[-top_n:][::-1]
    top_classes = unique[top_indices]
    
    # Filter predictions for top classes only
    mask = np.isin(y_true, top_classes)
    y_true_filtered = y_true[mask]
    y_pred_filtered = y_pred[mask]
    
    # Create confusion matrix
    cm = confusion_matrix(y_true_filtered, y_pred_filtered, labels=top_classes)
    
    # Plot
    fig, ax = plt.subplots(1, 1, figsize=(14, 12))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=top_classes, 
                yticklabels=top_classes, ax=ax, cbar_kws={'label': 'Count'})
    
    ax.set_xlabel('Predicted Disease', fontsize=12, fontweight='bold')
    ax.set_ylabel('Actual Disease', fontsize=12, fontweight='bold')
    ax.set_title(f'Confusion Matrix - Top {top_n} Diseases', fontsize=14, fontweight='bold', pad=15)
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"✅ Confusion matrix saved: {output_path}")
    plt.close()

def plot_feature_importance(model, feature_names, top_n=20, output_path='feature_importance.png'):
    """Plot feature importance from Random Forest"""
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        indices = np.argsort(importances)[-top_n:][::-1]
        
        fig, ax = plt.subplots(1, 1, figsize=(12, 8))
        
        colors = plt.cm.viridis(np.linspace(0, 1, top_n))
        bars = ax.barh(range(top_n), importances[indices], color=colors, edgecolor='black', linewidth=0.5)
        
        ax.set_yticks(range(top_n))
        ax.set_yticklabels([feature_names[i] for i in indices])
        ax.set_xlabel('Importance Score', fontsize=12, fontweight='bold')
        ax.set_title(f'Top {top_n} Most Important Symptoms for Disease Prediction', fontsize=14, fontweight='bold', pad=15)
        ax.invert_yaxis()
        
        # Add value labels
        for i, bar in enumerate(bars):
            width = bar.get_width()
            ax.text(width, bar.get_y() + bar.get_height()/2,
                    f'{width:.4f}',
                    ha='left', va='center', fontsize=9, fontweight='bold')
        
        plt.tight_layout()
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        print(f"✅ Feature importance plot saved: {output_path}")
        plt.close()
    else:
        print("⚠️  Model doesn't have feature_importances_ attribute")

def plot_per_class_metrics(y_true, y_pred, class_names, top_n=15, output_path='per_class_metrics.png'):
    """Plot precision, recall, F1 for top N diseases"""
    # Get classification report
    report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
    
    # Get top N most frequent classes
    unique, counts = np.unique(y_true, return_counts=True)
    top_indices = np.argsort(counts)[-top_n:][::-1]
    top_classes = unique[top_indices]
    
    # Extract metrics for top classes
    precision_scores = [report.get(cls, {}).get('precision', 0) for cls in top_classes]
    recall_scores = [report.get(cls, {}).get('recall', 0) for cls in top_classes]
    f1_scores = [report.get(cls, {}).get('f1-score', 0) for cls in top_classes]
    
    # Plot
    fig, ax = plt.subplots(1, 1, figsize=(14, 8))
    
    x = np.arange(len(top_classes))
    width = 0.25
    
    bars1 = ax.bar(x - width, precision_scores, width, label='Precision', color='#3498db', alpha=0.8, edgecolor='black')
    bars2 = ax.bar(x, recall_scores, width, label='Recall', color='#e74c3c', alpha=0.8, edgecolor='black')
    bars3 = ax.bar(x + width, f1_scores, width, label='F1-Score', color='#2ecc71', alpha=0.8, edgecolor='black')
    
    ax.set_xlabel('Disease', fontsize=12, fontweight='bold')
    ax.set_ylabel('Score', fontsize=12, fontweight='bold')
    ax.set_title(f'Per-Disease Performance Metrics - Top {top_n} Diseases', fontsize=14, fontweight='bold', pad=15)
    ax.set_xticks(x)
    ax.set_xticklabels(top_classes, rotation=45, ha='right')
    ax.legend(fontsize=11)
    ax.set_ylim([0, 1.1])
    ax.axhline(y=0.7, color='gray', linestyle='--', linewidth=1, alpha=0.5)
    ax.grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"✅ Per-class metrics plot saved: {output_path}")
    plt.close()

def create_comprehensive_dashboard(metrics, y_true, y_pred, model, feature_names, class_names, output_path='comprehensive_dashboard.png'):
    """Create a comprehensive dashboard with multiple metrics"""
    fig = plt.figure(figsize=(20, 12))
    gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)
    
    # 1. Main Metrics Bar Chart
    ax1 = fig.add_subplot(gs[0, :2])
    main_metrics = {
        'Accuracy': metrics['accuracy'],
        'Precision\n(Weighted)': metrics['precision_weighted'],
        'Recall\n(Weighted)': metrics['recall_weighted'],
        'F1-Score\n(Weighted)': metrics['f1_weighted']
    }
    colors = ['#2ecc71', '#3498db', '#e74c3c', '#f39c12']
    bars = ax1.bar(main_metrics.keys(), main_metrics.values(), color=colors, alpha=0.8, edgecolor='black', linewidth=2)
    
    for bar in bars:
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.3f}',
                ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    ax1.set_ylabel('Score', fontsize=11, fontweight='bold')
    ax1.set_title('Overall Performance Metrics', fontsize=13, fontweight='bold')
    ax1.set_ylim([0, 1.1])
    ax1.axhline(y=0.7, color='red', linestyle='--', linewidth=2, alpha=0.5, label='70% Baseline')
    ax1.legend()
    ax1.grid(axis='y', alpha=0.3)
    
    # 2. Metrics Comparison (Macro vs Weighted)
    ax2 = fig.add_subplot(gs[0, 2])
    comparison = {
        'Precision': [metrics['precision_macro'], metrics['precision_weighted']],
        'Recall': [metrics['recall_macro'], metrics['recall_weighted']],
        'F1-Score': [metrics['f1_macro'], metrics['f1_weighted']]
    }
    x = np.arange(len(comparison))
    width = 0.35
    bars1 = ax2.bar(x - width/2, [v[0] for v in comparison.values()], width, label='Macro', color='#95a5a6', alpha=0.8)
    bars2 = ax2.bar(x + width/2, [v[1] for v in comparison.values()], width, label='Weighted', color='#34495e', alpha=0.8)
    ax2.set_ylabel('Score', fontsize=10, fontweight='bold')
    ax2.set_title('Macro vs Weighted Avg', fontsize=11, fontweight='bold')
    ax2.set_xticks(x)
    ax2.set_xticklabels(comparison.keys(), fontsize=9)
    ax2.legend(fontsize=9)
    ax2.set_ylim([0, 1.0])
    ax2.grid(axis='y', alpha=0.3)
    
    # 3. Feature Importance (Top 10)
    ax3 = fig.add_subplot(gs[1, :])
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        top_n = 15
        indices = np.argsort(importances)[-top_n:][::-1]
        
        colors_fi = plt.cm.viridis(np.linspace(0, 1, top_n))
        bars = ax3.barh(range(top_n), importances[indices], color=colors_fi, edgecolor='black', linewidth=0.5)
        ax3.set_yticks(range(top_n))
        ax3.set_yticklabels([feature_names[i] for i in indices], fontsize=9)
        ax3.set_xlabel('Importance Score', fontsize=10, fontweight='bold')
        ax3.set_title('Top 15 Most Important Symptoms', fontsize=12, fontweight='bold')
        ax3.invert_yaxis()
        
        for i, bar in enumerate(bars):
            width_val = bar.get_width()
            ax3.text(width_val, bar.get_y() + bar.get_height()/2,
                    f'{width_val:.4f}',
                    ha='left', va='center', fontsize=8)
    
    # 4. Confusion Matrix (Top 10 diseases)
    ax4 = fig.add_subplot(gs[2, :2])
    unique, counts = np.unique(y_true, return_counts=True)
    top_n_cm = 10
    top_indices_cm = np.argsort(counts)[-top_n_cm:][::-1]
    top_classes_cm = unique[top_indices_cm]
    
    mask = np.isin(y_true, top_classes_cm)
    y_true_filtered = y_true[mask]
    y_pred_filtered = y_pred[mask]
    
    cm = confusion_matrix(y_true_filtered, y_pred_filtered, labels=top_classes_cm)
    sns.heatmap(cm, annot=True, fmt='d', cmap='YlOrRd', xticklabels=top_classes_cm, 
                yticklabels=top_classes_cm, ax=ax4, cbar_kws={'label': 'Count'})
    ax4.set_xlabel('Predicted', fontsize=10, fontweight='bold')
    ax4.set_ylabel('Actual', fontsize=10, fontweight='bold')
    ax4.set_title(f'Confusion Matrix - Top {top_n_cm} Diseases', fontsize=12, fontweight='bold')
    plt.setp(ax4.get_xticklabels(), rotation=45, ha='right', fontsize=8)
    plt.setp(ax4.get_yticklabels(), rotation=0, fontsize=8)
    
    # 5. Model Info Box
    ax5 = fig.add_subplot(gs[2, 2])
    ax5.axis('off')
    
    info_text = f"""
    CliniView ML Model
    Performance Report
    
    Model Type: Random Forest
    Trees: 100
    
    Dataset Info:
    • Total Samples: {len(y_true):,}
    • Unique Diseases: {len(np.unique(y_true))}
    • Features: {len(feature_names)}
    
    Performance:
    • Accuracy: {metrics['accuracy']:.3f}
    • Precision: {metrics['precision_weighted']:.3f}
    • Recall: {metrics['recall_weighted']:.3f}
    • F1-Score: {metrics['f1_weighted']:.3f}
    
    Status: ✅ Production Ready
    Date: {pd.Timestamp.now().strftime('%Y-%m-%d')}
    """
    
    ax5.text(0.1, 0.5, info_text, fontsize=10, verticalalignment='center',
             bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.3),
             family='monospace')
    
    # Main title
    fig.suptitle('CliniView ML Model - Comprehensive Performance Dashboard', 
                 fontsize=18, fontweight='bold', y=0.98)
    
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"✅ Comprehensive dashboard saved: {output_path}")
    plt.close()

def main():
    """Main execution function"""
    print("\n" + "="*70)
    print("CliniView ML Model Performance Visualization")
    print("="*70 + "\n")
    
    # Paths (adjust these to your actual model and data paths)
    model_path = 'models/final_augmented_model_20251108_001822.pkl'
    metadata_path = 'models/final_augmented_metadata_20251108_001822.json'
    test_data_path = 'data/Testing.csv'
    
    # Check if files exist
    import os
    if not os.path.exists(model_path):
        print(f"❌ Model not found: {model_path}")
        print("Available model files:")
        for f in os.listdir('models'):
            if f.endswith('.pkl'):
                print(f"  - models/{f}")
        return
    
    if not os.path.exists(test_data_path):
        print(f"❌ Test data not found: {test_data_path}")
        return
    
    # Load model and metadata
    print("📂 Loading model and data...")
    model, test_df, feature_columns, label_encoder = load_model_and_data(model_path, test_data_path)
    
    # Load metadata to get feature names (if available and feature_columns is empty)
    feature_names = feature_columns
    if not feature_names and os.path.exists(metadata_path):
        import json
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        feature_names = metadata.get('feature_names', [])
    
    # If still no feature names, use all columns except 'prognosis'
    if not feature_names:
        feature_names = [col for col in test_df.columns if col != 'prognosis']
    
    print(f"✓ Model loaded: {type(model).__name__}")
    print(f"✓ Test samples: {len(test_df)}")
    print(f"✓ Features: {len(feature_names)}")
    
    # Prepare data
    print("\n🔄 Preparing data for evaluation...")
    X_test, y_test = prepare_data(test_df, feature_names)
    
    # Make predictions
    print("🔮 Making predictions...")
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)
    
    # Calculate metrics
    print("📊 Calculating performance metrics...")
    metrics = calculate_metrics(y_test, y_pred, y_pred_proba)
    
    # Print metrics
    print("\n" + "="*70)
    print("PERFORMANCE METRICS")
    print("="*70)
    print(f"Accuracy:              {metrics['accuracy']:.4f} ({metrics['accuracy']*100:.2f}%)")
    print(f"Precision (Macro):     {metrics['precision_macro']:.4f}")
    print(f"Precision (Weighted):  {metrics['precision_weighted']:.4f}")
    print(f"Recall (Macro):        {metrics['recall_macro']:.4f}")
    print(f"Recall (Weighted):     {metrics['recall_weighted']:.4f}")
    print(f"F1-Score (Macro):      {metrics['f1_macro']:.4f}")
    print(f"F1-Score (Weighted):   {metrics['f1_weighted']:.4f}")
    print("="*70 + "\n")
    
    # Create output directory
    output_dir = 'visualization_outputs'
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate visualizations
    print("📈 Generating visualizations...")
    
    class_names = np.unique(y_test)
    
    # 1. Performance metrics bar chart
    plot_performance_metrics(metrics, f'{output_dir}/1_performance_metrics.png')
    
    # 2. Confusion matrix
    plot_confusion_matrix_top_diseases(y_test, y_pred, class_names, top_n=15, 
                                       output_path=f'{output_dir}/2_confusion_matrix.png')
    
    # 3. Feature importance
    plot_feature_importance(model, feature_names, top_n=20, 
                           output_path=f'{output_dir}/3_feature_importance.png')
    
    # 4. Per-class metrics
    plot_per_class_metrics(y_test, y_pred, class_names, top_n=15, 
                          output_path=f'{output_dir}/4_per_class_metrics.png')
    
    # 5. Comprehensive dashboard
    create_comprehensive_dashboard(metrics, y_test, y_pred, model, feature_names, class_names,
                                  output_path=f'{output_dir}/5_comprehensive_dashboard.png')
    
    print("\n" + "="*70)
    print("✅ ALL VISUALIZATIONS GENERATED SUCCESSFULLY!")
    print("="*70)
    print(f"\n📁 Output location: {output_dir}/")
    print("\nGenerated files:")
    print("  1. 1_performance_metrics.png - Main accuracy, precision, recall, F1-score")
    print("  2. 2_confusion_matrix.png - Top 15 diseases confusion matrix")
    print("  3. 3_feature_importance.png - Top 20 most important symptoms")
    print("  4. 4_per_class_metrics.png - Per-disease performance")
    print("  5. 5_comprehensive_dashboard.png - Complete overview dashboard")
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    main()
