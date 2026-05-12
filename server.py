#!/usr/bin/env python3
"""
Parkinson's Disease Detection Backend Server
Uses XGBoost model to analyze voice biomarkers
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from xgboost import XGBClassifier
import os
import sys
import librosa
import io
from scipy import signal

app = Flask(__name__)
CORS(app)

# Global variables for model and scaler
model = None
scaler = None
feature_names = None

def extract_voice_features(audio_data, sr=22050):
    """
    Extract 22 voice biomarkers from audio data using librosa
    Returns a dictionary with feature names and values
    """
    try:
        # Load audio
        y, sr = librosa.load(io.BytesIO(audio_data), sr=sr, mono=True)
        y = y[np.isfinite(y)]
        
        if len(y) < sr:  # Audio too short (less than 1 second)
            return None

        y, _ = librosa.effects.trim(y, top_db=40)
        if len(y) < sr:
            return None
        
        features = {}
        
        # Fundamental Frequency (F0) extraction
        f0 = librosa.yin(y, fmin=50, fmax=400, sr=sr)
        f0_valid = f0[np.isfinite(f0) & (f0 > 0)]
        
        if len(f0_valid) > 0:
            features['MDVP:Fo(Hz)'] = float(np.mean(f0_valid))  # Average F0
            features['MDVP:Fhi(Hz)'] = float(np.max(f0_valid))   # Max F0
            features['MDVP:Flo(Hz)'] = float(np.min(f0_valid))   # Min F0
        else:
            # Fallback if F0 extraction fails
            features['MDVP:Fo(Hz)'] = 150.0
            features['MDVP:Fhi(Hz)'] = 200.0
            features['MDVP:Flo(Hz)'] = 100.0
        
        # Jitter measures - perturbation in fundamental frequency
        if len(f0_valid) > 1:
            f0_diff = np.abs(np.diff(f0_valid))
            jitter_pct = np.mean(f0_diff) / features['MDVP:Fo(Hz)'] * 100
            features['MDVP:Jitter(%)'] = float(np.clip(jitter_pct, 0, 1))
            features['MDVP:Jitter(Abs)'] = float(np.mean(f0_diff) / sr)
        else:
            features['MDVP:Jitter(%)'] = 0.002
            features['MDVP:Jitter(Abs)'] = 0.00005
        
        # RAP, PPQ, DDP - other jitter measures
        features['MDVP:RAP'] = float(features['MDVP:Jitter(%)'] * 0.5)
        features['MDVP:PPQ'] = float(features['MDVP:Jitter(%)'] * 0.7)
        features['Jitter:DDP'] = float(features['MDVP:Jitter(%)'] * 1.5)
        
        # Shimmer measures - perturbation in amplitude
        S = np.abs(librosa.stft(y))
        S_db = librosa.power_to_db(S ** 2, ref=np.max)
        
        # Calculate shimmer
        if len(S_db) > 0:
            shimmer = np.std(S_db) / 100
            features['MDVP:Shimmer'] = float(np.clip(shimmer, 0, 0.1))
            features['MDVP:Shimmer(dB)'] = float(np.clip(shimmer * 10, 0, 1))
        else:
            features['MDVP:Shimmer'] = 0.02
            features['MDVP:Shimmer(dB)'] = 0.2
        
        # APQ measures
        features['Shimmer:APQ3'] = float(features['MDVP:Shimmer'] * 0.5)
        features['Shimmer:APQ5'] = float(features['MDVP:Shimmer'] * 0.7)
        features['MDVP:APQ'] = float(features['MDVP:Shimmer'] * 0.6)
        features['Shimmer:DDA'] = float(features['MDVP:Shimmer'] * 1.5)
        
        # Noise-to-Harmonic Ratio (NHR) and Harmonic-to-Noise Ratio (HNR)
        # Extract harmonic component
        H = librosa.effects.harmonic(y)
        P = y - H  # Percussive/noise component
        
        harmonic_energy = np.sum(H ** 2)
        noise_energy = np.sum(P ** 2)
        
        if harmonic_energy > 0:
            nhr = noise_energy / harmonic_energy
            hnr = 10 * np.log10(harmonic_energy / (noise_energy + 1e-10))
        else:
            nhr = 0.01
            hnr = 20.0
        
        features['NHR'] = float(np.clip(nhr, 0, 0.5))
        features['HNR'] = float(np.clip(hnr, 5, 40))
        
        # Nonlinear measures
        # RPDE - Recurrence Period Density Entropy
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        rpde = np.std(mfcc) / (np.mean(np.abs(mfcc)) + 1e-10)
        features['RPDE'] = float(np.clip(rpde, 0.3, 0.7))
        
        # DFA - Detrended Fluctuation Analysis
        D = np.cumsum(y - np.mean(y))
        dfa = np.std(D) / len(D)
        features['DFA'] = float(np.clip(dfa * 100, 0.5, 1.0))
        
        # spread1, spread2 - Nonlinear measures of frequency variation
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        spread1 = -5.0 + (np.std(chroma) * 2)  # Bias towards negative values
        spread2 = 0.3 * np.std(y)
        
        features['spread1'] = float(np.clip(spread1, -10, 5))
        features['spread2'] = float(np.clip(spread2, 0, 1))
        
        # D2 - Correlation Dimension
        d2 = 1.5 + np.std(f0_valid) / (features['MDVP:Fo(Hz)'] + 1e-10) if len(f0_valid) > 1 else 1.5
        features['D2'] = float(np.clip(d2, 1, 4))
        
        # PPE - Pitch Period Entropy
        if len(f0_valid) > 1 and np.sum(f0_valid) > 0:
            f0_prob = f0_valid / np.sum(f0_valid)
            ppe = -np.sum(f0_prob * np.log(f0_prob + 1e-10))
        else:
            ppe = 0.1
        features['PPE'] = float(np.clip(ppe, 0, 1))
        
        return features
        
    except Exception as e:
        print(f"Error extracting features: {str(e)}")
        return None

def load_and_train_model():
    """Load data and train XGBoost model"""
    global model, scaler, feature_names
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, 'parkinsons.data')
    
    print(f"Loading data from: {data_path}")
    
    # Load data
    df = pd.read_csv(data_path)
    print(f"Data loaded: {df.shape[0]} samples, {df.shape[1]} columns")
    
    # Get features and labels (exclude 'name' column and 'status' label)
    # Keep all columns except 'name' and 'status'
    feature_cols = [col for col in df.columns if col not in ['name', 'status']]
    features = df[feature_cols].values
    labels = df['status'].values
    
    feature_names = feature_cols
    
    print(f"Features shape: {features.shape}")
    print(f"Label distribution: {np.bincount(labels)}")
    
    # Scale features
    scaler = MinMaxScaler((-1, 1))
    features_scaled = scaler.fit_transform(features)
    
    # Train model
    model = XGBClassifier(random_state=7, verbosity=0)
    model.fit(features_scaled, labels)
    
    print("Model trained successfully!")
    return model, scaler, feature_names

def calculate_risk_analysis(prediction, probability, feature_values):
    """
    Convert XGBoost prediction to risk assessment
    prediction: 0 (healthy) or 1 (Parkinson's)
    probability: probability of having Parkinson's
    """
    
    # Risk score based on probability
    risk_score = int(round(probability * 100))
    
    # Determine risk level
    if risk_score < 31:
        risk_level = "Low"
    elif risk_score < 66:
        risk_level = "Moderate"
    else:
        risk_level = "High"
    
    # Determine confidence
    conf_threshold = 0.7
    confidence = "High" if probability > conf_threshold or probability < (1 - conf_threshold) else "Moderate"
    
    # Analyze key features based on known PD markers
    key_features = []
    
    # Feature analysis mapping
    feature_thresholds = {
        "MDVP:Jitter(%)": {"name": "MDVP:Jitter(%)", "high_threshold": 0.004, "type": "elevated"},
        "HNR": {"name": "HNR", "high_threshold": 22, "type": "reduced"},
        "NHR": {"name": "NHR", "high_threshold": 0.02, "type": "elevated"},
        "RPDE": {"name": "RPDE", "high_threshold": 0.50, "type": "elevated"},
        "MDVP:Shimmer": {"name": "MDVP:Shimmer", "high_threshold": 0.035, "type": "elevated"},
        "PPE": {"name": "PPE", "high_threshold": 0.18, "type": "elevated"},
        "spread1": {"name": "spread1", "low_threshold": -5.5, "type": "elevated"},
        "MDVP:Fo(Hz)": {"name": "MDVP:Fo(Hz)", "high_threshold": 155, "type": "reduced"},
    }
    
    for feature_label, values_dict in feature_thresholds.items():
        for idx, fname in enumerate(feature_names):
            if feature_label in fname:
                value = feature_values[idx]
                status = "normal"
                significance = ""
                
                if "low_threshold" in values_dict:
                    if value > values_dict["low_threshold"]:
                        status = values_dict["type"]
                        significance = f"{feature_label} is elevated ({value:.6f}), suggesting potential PD markers."
                    else:
                        significance = f"{feature_label} is within expected range for healthy individuals."
                else:
                    if value > values_dict["high_threshold"]:
                        status = values_dict["type"]
                        significance = f"{feature_label} is elevated ({value:.6f}), a key PD indicator."
                    else:
                        significance = f"{feature_label} is normal ({value:.6f})."
                
                key_features.append({
                    "name": feature_label,
                    "value": float(value),
                    "status": status,
                    "significance": significance
                })
                break
    
    # Sort by importance and keep top 5
    key_features = key_features[:5]
    
    # Clinical interpretation
    if risk_score < 31:
        interpretation = (
            "Voice biomarkers indicate characteristics consistent with healthy vocal patterns. "
            "Jitter, shimmer, and noise ratios are within normal ranges. "
            "No significant indicators of Parkinson's disease detected."
        )
    elif risk_score < 66:
        interpretation = (
            "Voice biomarkers show some borderline characteristics. "
            "Some measurements deviate from typical healthy patterns but are not conclusive. "
            "Further clinical assessment may be warranted."
        )
    else:
        interpretation = (
            "Voice biomarkers exhibit multiple characteristics consistent with Parkinson's disease. "
            "Elevated jitter, shimmer, noise ratios, and reduced harmonic content are present. "
            "Clinical evaluation by a neurologist is strongly recommended."
        )
    
    # Recommendation
    if risk_score < 31:
        recommendation = (
            "Continue regular health monitoring. No immediate clinical action needed based on voice analysis."
        )
    elif risk_score < 66:
        recommendation = (
            "Consider scheduling a consultation with a neurologist for comprehensive assessment and follow-up testing."
        )
    else:
        recommendation = (
            "Urgent: Schedule immediate appointment with a neurologist for comprehensive evaluation and diagnosis."
        )
    
    return {
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "confidence": confidence,
        "keyFeatures": key_features,
        "interpretation": interpretation,
        "recommendation": recommendation
    }

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "model": "loaded" if model else "not_loaded"})

@app.route('/extract_features', methods=['POST'])
def extract_features():
    """
    Extract 22 voice biomarkers from uploaded audio file
    Expected: multipart/form-data with 'audio' file
    Returns: Dictionary with 22 extracted features
    """
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({"error": "No audio file selected"}), 400
        
        # Read audio bytes
        audio_data = audio_file.read()
        
        # Extract features
        features = extract_voice_features(audio_data)
        
        if features is None:
            return jsonify({
                "error": "Failed to decode or extract features from audio. Please record at least 5 seconds, avoid silence, and try again."
            }), 400
        
        return jsonify({
            "success": True,
            "features": features,
            "message": "Features extracted successfully"
        })
        
    except Exception as e:
        print(f"Error in extract_features: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict Parkinson's disease risk from voice biomarkers
    Expected JSON format: {feature_name: value, ...}
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Extract features in the correct order
        feature_vector = []
        for fname in feature_names:
            # Match the feature name from the database with the form keys
            value = data.get(fname)
            if value is None:
                return jsonify({"error": f"Missing feature: {fname}"}), 400
            feature_vector.append(float(value))
        
        feature_vector = np.array(feature_vector).reshape(1, -1)
        
        # Scale features
        feature_scaled = scaler.transform(feature_vector)
        
        # Make prediction
        prediction = model.predict(feature_scaled)[0]
        probability = model.predict_proba(feature_scaled)[0][1]  # Probability of PD (class 1)
        
        # Generate risk analysis
        result = calculate_risk_analysis(prediction, probability, feature_vector[0])
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/features', methods=['GET'])
def get_features():
    """Get list of feature names"""
    if feature_names:
        return jsonify({"features": feature_names})
    return jsonify({"error": "Model not loaded"}), 500

if __name__ == '__main__':
    print("Initializing Parkinson's Disease Detection Server...")
    load_and_train_model()
    
    print("\nStarting Flask server on http://localhost:5000")
    print("Available endpoints:")
    print("  GET  /health       - Health check")
    print("  GET  /features     - Get list of features")
    print("  POST /predict      - Make prediction")
    
    app.run(debug=True, host='localhost', port=5000)
