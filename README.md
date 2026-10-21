# RiskLens AI
### Explainable Machine Learning for Transaction Fraud Risk Analysis

RiskLens AI is a machine learning-powered transaction risk analysis platform built with **Python, FastAPI, React, and SHAP**. It analyzes transaction attributes, generates model-based risk scores, and presents feature-level explanations through an interactive dashboard.

The project explores how explainable machine learning can support financial fraud investigation and transaction review.

## Key Features

- **Transaction Risk Analysis** — Submit transaction details through an interactive dashboard.
- **Machine Learning Predictions** — Generate fraud-risk predictions using a trained classification model.
- **Explainable AI** — Explore feature contributions using SHAP-based explanations.
- **REST API** — Serve predictions through a FastAPI backend.
- **Interactive Dashboard** — Review transaction results, risk indicators, and model explanations.
- **Analysis History** — Search and review transactions analyzed during the current session.
- **ML Experimentation** — Separate notebooks for data exploration, classification, deep learning, anomaly detection, and explainability.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Axios |
| UI and Charts | CSS, Recharts, Lucide React |
| Backend | Python, FastAPI, Pydantic |
| Machine Learning | scikit-learn, pandas, NumPy |
| Explainability | SHAP |
| Model Persistence | Joblib |
| Dataset | PaySim simulated mobile-money transactions |

## Architecture

```text
Transaction Input
       |
       v
React Dashboard
       |
       v
FastAPI Prediction API
       |
       v
Feature Engineering
       |
       v
Saved ML Model + Preprocessor
       |
       v
Risk Score + SHAP Explanations
       |
       v
Results Dashboard
```

## Project Structure

```text
risklens-ai/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── models/
│   ├── fraud_model.joblib
│   └── preprocessor.joblib
├── notebooks/
│   ├── 01_data_intelligence.ipynb
│   ├── 02_ml_prediction.ipynb
│   ├── 03_deep_learning.ipynb
│   ├── 04_anomaly_detection.ipynb
│   └── 05_explainability.ipynb
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.12 recommended
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/VINATH8/risklens-ai.git
cd risklens-ai
```

### 2. Set Up the Backend

Create and activate a virtual environment:

**Windows PowerShell**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r backend/requirements.txt
```

Start the API from the project root:

```powershell
python -m uvicorn backend.main:app --reload
```

The API will be available at:

- API: http://127.0.0.1:8000
- Interactive API documentation: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

### 3. Set Up the Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create a `frontend/.env.local` file containing:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed in your terminal, usually http://localhost:5173.

## Machine Learning and Explainability

The project includes notebooks covering:

1. Data exploration and transaction patterns
2. Fraud classification experiments
3. Neural-network-based prediction
4. Anomaly detection using Isolation Forest
5. Model explainability with SHAP

Feature engineering includes transaction balance changes and balance-consistency checks. The saved model and preprocessing pipeline are used by the backend to generate predictions.

SHAP explanations highlight features that influence the model output. These explanations describe model behavior; they do not independently establish whether a transaction is fraudulent.

## Limitations

- This is a portfolio and research prototype, not a production banking system.
- The PaySim dataset is simulated and may not represent real-world transaction behavior.
- Model scores should not be interpreted as calibrated fraud probabilities.
- Decision thresholds require validation against held-out data and the operational costs of false positives and false negatives.
- Analysis history is session-based and is not persistent across page reloads.
- The application does not connect to live banks or payment gateways.

## Future Improvements

- Persistent transaction history with a database
- Automated API and frontend tests
- Model monitoring and threshold evaluation
- Authentication and role-based access controls
- Deployment with secure configuration
- Dashboard screenshots and additional evaluation visualizations

## Responsible Use

RiskLens AI is intended for educational and demonstration purposes. It should not be used as the sole basis for blocking payments or making consequential financial decisions. Real-world deployment requires rigorous validation, security and privacy controls, ongoing monitoring, and appropriate human oversight.

## Author

**Vinath Shetty**

GitHub: [@VINATH8](https://github.com/VINATH8)

---

*Built to explore explainable machine learning for financial transaction risk analysis.*
