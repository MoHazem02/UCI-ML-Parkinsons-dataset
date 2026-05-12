# Quick Start Guide - 5 Minute Setup

## Prerequisites
- Python 3.8+
- Node.js 14+
- npm

---

## Installation (Run Once)

### Windows PowerShell / Command Prompt

```powershell
# 1. Setup Python backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install flask flask-cors pandas scikit-learn xgboost numpy

# 2. Setup Node frontend
npm install
```

---

## Running the App (Every Time)

### Terminal 1 - Backend Server
```powershell
venv\Scripts\Activate.ps1
python server.py
```
✅ Wait for: "Running on http://localhost:5000"

### Terminal 2 - Frontend Server
```powershell
npm start
```
✅ Wait for: "You can now view your app in the browser"

---

## Access
Open browser → `http://localhost:3000`

---

## Test the App

1. Click "Begin Voice Analysis"
2. Click "Load Healthy Sample" or "Load PD Sample"
3. Click "Analyze with XGBoost"
4. View results

---

## What Changed?

### ❌ Removed
- Anthropic API dependency
- API key requirement
- Cloud API calls
- SYSTEM_PROMPT

### ✅ Added
- Local XGBoost model
- Flask backend server (`server.py`)
- Local prediction engine
- No internet required for predictions

---

## Architecture

```
Browser (React)
    ↓ HTTP POST
    ↓ Voice biomarkers
    ↓
Backend (Flask)
    ↓
XGBoost Model
    ↓
Predictions + Risk Analysis
    ↓ HTTP Response (JSON)
    ↓
Browser displays results
```

---

## Files Created/Modified

- ✨ **server.py** (NEW) - Backend with XGBoost
- 🔄 **ParkinsonsApp.jsx** (MODIFIED) - Calls local backend
- 📖 **SETUP_AND_RUN.md** (NEW) - Detailed instructions
- 📄 **QUICK_START.md** (THIS FILE)

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Cannot connect to server" | Start backend: `python server.py` |
| "Port already in use" | Edit `server.py`: change port 5000 to 5001 |
| "Module not found" | Run: `pip install flask flask-cors pandas scikit-learn xgboost numpy` |
| "npm: command not found" | Install Node.js from nodejs.org |

---

## Next Steps

Once running:
1. Test with sample data
2. Adjust voice biomarkers to see how results change
3. Review the backend code in `server.py` to understand the model
4. Check original notebook: `detecting-parkinson-with-xgboost-explained.ipynb`

---

**Ready to start? Follow "Running the App" section above!**
