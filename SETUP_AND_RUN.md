# Parkinson's Disease Detection App - Setup & Running Instructions

## Overview
This application detects Parkinson's Disease risk from voice biomarkers using:
- **Backend**: XGBoost machine learning model (trained on UCI Parkinson's Dataset)
- **Frontend**: React.js web application with modern UI

## Prerequisites

### 1. Python (for Backend Server)
- Python 3.8 or higher
- Download from: https://www.python.org/downloads/

### 2. Node.js & npm (for React Frontend)
- Node.js 14+ and npm
- Download from: https://nodejs.org/

### 3. Required Data Files
Make sure these files are in the project directory:
- `parkinsons_updrs.data` - Training dataset (already in the folder)
- `server.py` - Backend server (newly created)
- `ParkinsonsApp.jsx` - React application (updated)

---

## Installation Steps

### Step 1: Install Python Dependencies for Backend

Open **PowerShell** or **Command Prompt** in the project directory and run:

```powershell
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\Activate.ps1

# Install required packages
pip install flask flask-cors pandas scikit-learn xgboost numpy
```

**Expected packages to install:**
- flask (web server)
- flask-cors (cross-origin requests)
- pandas (data handling)
- scikit-learn (preprocessing)
- xgboost (machine learning model)
- numpy (numerical operations)

### Step 2: Install Node.js Dependencies for Frontend

Open a **new PowerShell/Command Prompt** window and run:

```powershell
# Navigate to project directory
cd "path\to\your\project"

# Install npm packages
npm install
```

This will install React and necessary dependencies based on package.json.

---

## Running the Application

You'll need to run **two servers simultaneously** (in separate terminal windows):

### Terminal 1: Start the Backend Server

```powershell
# Activate virtual environment (if not already active)
venv\Scripts\Activate.ps1

# Run the server
python server.py
```

**Expected output:**
```
Initializing Parkinson's Disease Detection Server...
Loading data from: [path to file]
Data loaded: 195 samples, 23 features
Features shape: (195, 22)
Label distribution: [48 147]
Model trained successfully!

Starting Flask server on http://localhost:5000
Available endpoints:
  GET  /health       - Health check
  GET  /features     - Get list of features
  POST /predict      - Make prediction
 * Running on http://localhost:5000
```

✅ **Backend is ready when you see "Running on http://localhost:5000"**

---

### Terminal 2: Start the React Frontend

```powershell
# In a NEW terminal window, navigate to project directory
cd "path\to\your\project"

# Start React development server
npm start
```

**Expected output:**
```
Compiled successfully!

You can now view your app in the browser.

  Local:            http://localhost:3000
```

✅ **Frontend is ready when you see the message above**

---

## Accessing the Application

Once both servers are running:

1. **Open your browser** and go to: `http://localhost:3000`
2. Click **"Begin Voice Analysis →"** to start
3. Enter voice biomarker measurements (or load sample data)
4. Click **"Analyze with XGBoost"** to get risk assessment
5. View the results with risk score, clinical interpretation, and recommendations

---

## Quick Test

### Load Sample Data
The app includes two pre-loaded samples:
- **Load Healthy Sample**: Biomarkers from a healthy individual
- **Load PD Sample**: Biomarkers from a Parkinson's patient

Click either button to populate the form with test data, then analyze.

---

## Expected Results

### Healthy Sample
- Risk Score: **0-30** (Low)
- Risk Level: **Low**
- Interpretation: Normal voice characteristics

### Parkinson's Sample
- Risk Score: **66-100** (High)
- Risk Level: **High**
- Interpretation: Multiple PD markers detected

---

## Troubleshooting

### ❌ Error: "Cannot connect to server"
**Solution**: Make sure backend server is running on Terminal 1
- Run `python server.py` in the project directory
- Check that it shows "Running on http://localhost:5000"

### ❌ Error: "ModuleNotFoundError: No module named 'flask'"
**Solution**: Install dependencies
```powershell
pip install flask flask-cors pandas scikit-learn xgboost numpy
```

### ❌ Error: "Port 5000 already in use"
**Solution**: Either:
- Kill the process using port 5000
- Or modify `server.py` line: `app.run(debug=True, host='localhost', port=5001)`
- Then update frontend to call `http://localhost:5001/predict`

### ❌ Error: "Cannot find module 'react'"
**Solution**: Install npm dependencies
```powershell
npm install
```

### ❌ Application runs but analysis doesn't work
**Solution**: 
1. Check browser console (F12 > Console tab) for errors
2. Verify backend is running and shows "Running on..."
3. Make sure `parkinsons_updrs.data` file exists in the same directory as `server.py`

---

## Project Structure

```
Parkinsons/
├── server.py                          # Backend server (XGBoost)
├── ParkinsonsApp.jsx                  # React frontend application
├── detecting-parkinson-with-xgboost-explained.ipynb  # Original notebook
├── parkinsons_updrs.data              # Training dataset
├── parkinsons_updrs.names             # Feature descriptions
├── parkinsons.data                    # Alternative dataset
├── parkinsons.names                   # Alternative feature descriptions
├── package.json                       # React dependencies
├── SETUP_AND_RUN.md                   # This file
└── node_modules/                      # npm packages (created after npm install)
```

---

## Technical Details

### Backend (server.py)
- **Framework**: Flask (lightweight Python web framework)
- **ML Model**: XGBoost Classifier
- **Data Preprocessing**: MinMaxScaler (-1 to 1 normalization)
- **Training Data**: UCI Parkinson's Dataset (195 samples)
- **Features**: 22 voice biomarkers
- **API Endpoint**: POST `/predict` - accepts voice measurements, returns risk assessment

### Frontend (ParkinsonsApp.jsx)
- **Framework**: React.js
- **Styling**: CSS-in-JS (inline styles)
- **Features**:
  - Tabbed input form for 22 voice biomarkers
  - Real-time risk visualization (gauge chart)
  - Feature analysis cards
  - Sample data loading
  - Patient identifier support

### Communication
- **Protocol**: HTTP REST API
- **Content-Type**: application/json
- **Local Connection**: `http://localhost:5000/predict`

---

## Model Information

### XGBoost Configuration
- **Algorithm**: Extreme Gradient Boosting (tree-based)
- **Random State**: 7 (for reproducibility)
- **Train-Test Split**: 80-20
- **Accuracy**: ~94.87%
- **Features Used**: 22 voice biomarkers
- **Classes**: 0 (Healthy), 1 (Parkinson's Disease)

### Key Voice Biomarkers
- **Fundamental Frequency**: Fo(Hz), Fhi(Hz), Flo(Hz)
- **Jitter Measures**: Variation in frequency (%)
- **Shimmer Measures**: Variation in amplitude
- **Noise Ratios**: NHR, HNR
- **Nonlinear Measures**: RPDE, DFA, D2, PPE, spread1, spread2

---

## Important Disclaimer

⚠️ **MEDICAL DISCLAIMER**

This application is for **research and educational purposes only**. It is:
- NOT a medical diagnostic device
- NOT a substitute for professional medical evaluation
- Should NOT be used for clinical diagnosis

**Always consult with a licensed neurologist for:**
- Clinical diagnosis
- Treatment recommendations
- Medical decisions

This tool provides AI-assisted analysis based on voice biomarkers but requires professional medical evaluation for any clinical decisions.

---

## Support & Notes

### Stopping the Application
1. **Backend**: Press `Ctrl+C` in the backend terminal
2. **Frontend**: Press `Ctrl+C` in the frontend terminal

### Restarting
Simply run the commands again in the respective terminals.

### Model Retraining
To retrain the model with new data:
1. Replace `parkinsons_updrs.data` with new dataset
2. Restart the backend server
3. The model will automatically retrain on the new data

---

## Contact & Resources

- **Dataset**: UCI Machine Learning Repository - Parkinson's Disease Dataset
- **XGBoost Documentation**: https://xgboost.readthedocs.io/
- **React Documentation**: https://react.dev/
- **Flask Documentation**: https://flask.palletsprojects.com/

---

**Last Updated**: May 2026
**Version**: 1.0
**Status**: Local Backend Implementation Complete
