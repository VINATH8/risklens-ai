
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field


# ==================================================
# 1. LOAD MODEL AND PREPROCESSOR
# ==================================================

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"

MODEL_PATH = MODEL_DIR / "fraud_model.joblib"
PREPROCESSOR_PATH = MODEL_DIR / "preprocessor.joblib"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

if not PREPROCESSOR_PATH.exists():
    raise FileNotFoundError(
        f"Preprocessor not found: {PREPROCESSOR_PATH}"
    )

model = joblib.load(MODEL_PATH)
preprocessor = joblib.load(PREPROCESSOR_PATH)

explainer = shap.TreeExplainer(model)
feature_names = list(preprocessor.get_feature_names_out())


# ==================================================
# 2. FASTAPI APPLICATION
# ==================================================

app = FastAPI(
    title="RiskLens AI",
    description="Transaction fraud prediction and explainability API",
    version="1.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# 3. REQUEST VALIDATION
# ==================================================

class Transaction(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    step: int = Field(ge=0)
    type: str = Field(
        pattern=r"^(CASH_OUT|PAYMENT|CASH_IN|TRANSFER|DEBIT)$"
    )
    amount: float = Field(ge=0, allow_inf_nan=False)
    oldbalanceOrg: float = Field(ge=0, allow_inf_nan=False)
    newbalanceOrig: float = Field(ge=0, allow_inf_nan=False)
    oldbalanceDest: float = Field(ge=0, allow_inf_nan=False)
    newbalanceDest: float = Field(ge=0, allow_inf_nan=False)


# ==================================================
# 4. FEATURE ENGINEERING
# ==================================================

FEATURE_COLUMNS = [
    "step",
    "type",
    "amount",
    "oldbalanceOrg",
    "newbalanceOrig",
    "oldbalanceDest",
    "newbalanceDest",
    "orig_balance_change",
    "dest_balance_change",
    "orig_amount_error",
    "dest_amount_error",
]


def engineer_features(transaction: Transaction) -> pd.DataFrame:
    row = transaction.model_dump()

    row["orig_balance_change"] = (
        row["oldbalanceOrg"] - row["newbalanceOrig"]
    )

    row["dest_balance_change"] = (
        row["newbalanceDest"] - row["oldbalanceDest"]
    )

    row["orig_amount_error"] = abs(
        row["oldbalanceOrg"]
        - row["amount"]
        - row["newbalanceOrig"]
    )

    row["dest_amount_error"] = abs(
        row["oldbalanceDest"]
        + row["amount"]
        - row["newbalanceDest"]
    )

    return pd.DataFrame([row], columns=FEATURE_COLUMNS)


# ==================================================
# 5. SHAP EXPLANATIONS
# ==================================================

def get_feature_explanations(
    processed,
    max_features: int = 5,
) -> list[dict]:
    shap_output = explainer.shap_values(processed)

    if isinstance(shap_output, list):
        # Older SHAP versions: one array per class.
        contributions = np.asarray(shap_output[1])[0]

    else:
        shap_output = np.asarray(shap_output)

        if shap_output.ndim == 3:
            # Common format: samples x features x classes.
            class_index = 1 if shap_output.shape[-1] > 1 else 0
            contributions = shap_output[0, :, class_index]

        elif shap_output.ndim == 2:
            # Binary tree explainers can return a single output.
            contributions = shap_output[0]

        else:
            raise ValueError(
                f"Unexpected SHAP output shape: {shap_output.shape}"
            )

    if len(contributions) != len(feature_names):
        raise ValueError(
            "SHAP feature count does not match preprocessor output."
        )

    top_indices = np.argsort(np.abs(contributions))[::-1][
        :max_features
    ]

    explanations = []

    for index in top_indices:
        impact = float(contributions[index])

        explanations.append({
            "feature": feature_names[index],
            "impact": round(impact, 6),
            "direction": (
                "increases model fraud output"
                if impact > 0
                else "decreases model fraud output"
                if impact < 0
                else "has negligible impact"
            ),
        })

    return explanations


# ==================================================
# 6. GROUNDED RISK SUMMARY
# ==================================================

def build_risk_summary(
    score: float,
    prediction: int,
    explanations: list[dict],
) -> dict:
    headline = (
        "The model flagged this transaction for review."
        if prediction == 1
        else (
            "The model did not flag this transaction "
            "at the configured threshold."
        )
    )

    return {
        "headline": headline,
        "model_score_percent": round(score * 100, 2),
        "main_model_drivers": explanations[:3],
        "caution": (
            "SHAP values explain model behavior, not proof of fraud. "
            "The score is not calibrated as a real-world fraud "
            "probability. This prototype uses sampled synthetic data."
        ),
    }


# ==================================================
# 7. API ROUTES
# ==================================================

@app.get("/")
def root():
    return {
        "app": "RiskLens AI",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "preprocessor_loaded": preprocessor is not None,
        "explainer_loaded": explainer is not None,
    }


@app.post("/predict")
def predict(transaction: Transaction):
    try:
        features = engineer_features(transaction)
        processed = preprocessor.transform(features)

        probabilities = model.predict_proba(processed)[0]
        classes = list(model.classes_)

        if 1 not in classes:
            raise RuntimeError(
                "Loaded model does not contain the fraud class."
            )

        fraud_index = classes.index(1)
        fraud_score = float(probabilities[fraud_index])

        # Demonstration threshold, not production-calibrated.
        threshold = 0.50
        prediction = int(fraud_score >= threshold)

        explanations = get_feature_explanations(processed)

        summary = build_risk_summary(
            fraud_score,
            prediction,
            explanations,
        )

        return {
            "prediction": prediction,
            "risk_score": round(fraud_score * 100, 2),
            "risk_level": "HIGH" if prediction else "LOW",
            "threshold": threshold,
            "model": "Random Forest prototype",
            "explanations": explanations,
            "risk_summary": summary,
            "disclaimer": (
                "Experimental model trained on sampled synthetic data. "
                "The score is not a calibrated real-world fraud "
                "probability and must not be used alone for financial "
                "decisions."
            ),
        }

    except Exception as exc:
        # Log full traceback in the server terminal while keeping
        # internal implementation details out of the API response.
        import logging
        logging.exception("Transaction prediction failed")

        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Check the backend terminal logs.",
        ) from exc
