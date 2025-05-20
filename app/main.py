#Import required libraries
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
import os
import httpx
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file")

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files and templates
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

# Load models and scaler
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
heart_model = joblib.load(os.path.join(BASE_DIR, "static", "ml_models", "random_forest_classifier_heart_disease"))
diabetes_model = joblib.load(os.path.join(BASE_DIR, "static", "ml_models", "random_forest_classifier_diabetes"))
scaler = joblib.load(os.path.join(BASE_DIR, "static", "ml_models", "scaler.pkl"))
heart_data = pd.read_csv(os.path.join(BASE_DIR, "static", "dataset", "heart.csv"))

# Define input schemas
class HeartData(BaseModel):
    Age: float
    Sex: str
    RestingBP: float
    Cholesterol: float
    FastingBS: int
    MaxHR: float
    ExerciseAngina: str
    Oldpeak: float
    ChestPain: str
    RestingECG: str
    ST_Slope: str

class DiabetesData(BaseModel):
    gender: int
    age: float
    hypertension: int
    heart_disease: int
    smoking_history: int
    bmi: float
    HbA1c_level: float
    blood_glucose_level: int

# Serve homepage
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("dashboard/index.html", {"request": request})

# Prediction endpoint
@app.post("/predict")
async def predict(request: Request):
    data = await request.json()
    prediction_type = data.get("prediction_type")

    if prediction_type == "heart":
        input_data = HeartData(**data)
        input_dict = input_data.dict()
        sex = 0 if input_dict["Sex"] == "M" else 1
        exercise_angina = 1 if input_dict["ExerciseAngina"] == "Y" else 0
        chest_pain = {"ATA": [1, 0, 0], "NAP": [0, 1, 0], "ASY": [0, 0, 1], "TA": [0, 0, 0]}[input_dict["ChestPain"]]
        resting_ecg = {"Normal": [1, 0], "ST": [0, 1], "LVH": [0, 0]}[input_dict["RestingECG"]]
        st_slope = {"Up": [0, 1], "Flat": [1, 0], "Down": [0, 0]}[input_dict["ST_Slope"]]

        numerical = np.array([[input_dict["Age"], input_dict["RestingBP"], input_dict["Cholesterol"],
                               input_dict["MaxHR"], input_dict["Oldpeak"]]])
        numerical_scaled = scaler.transform(numerical)

        features = np.hstack([
            numerical_scaled[0], input_dict["FastingBS"], sex, exercise_angina,
            chest_pain, resting_ecg, st_slope
        ]).reshape(1, -1)

        prediction = heart_model.predict(features)[0]
        confidence = heart_model.predict_proba(features)[0].max()

    elif prediction_type == "diabetes":
        input_data = DiabetesData(**data)
        input_dict = input_data.dict()
        features = np.array([[
            input_dict["gender"], input_dict["age"], input_dict["hypertension"],
            input_dict["heart_disease"], input_dict["smoking_history"], input_dict["bmi"],
            input_dict["HbA1c_level"], input_dict["blood_glucose_level"]
        ]])

        prediction = diabetes_model.predict(features)[0]
        confidence = diabetes_model.predict_proba(features)[0].max()

    else:
        raise HTTPException(status_code=400, detail="Invalid prediction type")

    confidence_percent = confidence * 100
    if confidence_percent > 80:
        risk_level = "High"
    elif confidence_percent >= 50:
        risk_level = "Moderate"
    else:
        risk_level = "Low"

    message = "No Disease" if prediction == 0 else "Disease Detected"
    return {
        "prediction": int(prediction),
        "message": message,
        "confidence": float(confidence),
        "risk_level": risk_level
    }

# Serve reports page
@app.get("/reports", response_class=HTMLResponse)
async def reports(request: Request):
    return templates.TemplateResponse("reports/reports.html", {"request": request})

# Serve report data
@app.get("/report-data")
async def get_report_data():
    age_dist = heart_data['Age'].value_counts().sort_index().to_dict()
    sex_dist = heart_data['Sex'].value_counts().to_dict()
    cp_dist = heart_data['ChestPainType'].value_counts().to_dict()
    target_dist = heart_data['HeartDisease'].value_counts().to_dict()
    age_with_disease = heart_data[heart_data['HeartDisease'] == 1]['Age'].value_counts().sort_index().to_dict()
    sex_with_disease = heart_data[heart_data['HeartDisease'] == 1]['Sex'].value_counts().to_dict()

    return {
        "age_distribution": age_dist,
        "sex_distribution": {"Male": sex_dist.get("M", 0), "Female": sex_dist.get("F", 0)},
        "chest_pain_distribution": cp_dist,
        "target_distribution": {"No Disease": target_dist.get(0, 0), "Disease": target_dist.get(1, 0)},
        "age_with_disease": age_with_disease,
        "sex_with_disease": {"Male": sex_with_disease.get("M", 0), "Female": sex_with_disease.get("F", 0)}
    }

# Serve education page
@app.get("/education", response_class=HTMLResponse)
async def education(request: Request):
    return templates.TemplateResponse("heart_health_education/education.html", {"request": request})

# Serve chatbot page
@app.get("/chatbot", response_class=HTMLResponse)
async def chatbot(request: Request):
    return templates.TemplateResponse("chatbot/chatbot.html", {"request": request})

# Chat API using Groq
@app.post("/chat")
async def chat_with_groq(request: Request):
    try:
        data = await request.json()
        user_message = data.get("message")

        if not user_message:
            return JSONResponse(status_code=400, content={"error": "Message is required"})

        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "llama-3.3-70b-versatile",  # Updated to supported model
            "messages": [
                {"role": "system", "content": "You are a helpful health assistant. Answer in a concise and informative way."},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": 512
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload
            )

        if response.status_code != 200:
            logger.error(f"Groq API error: {response.status_code} - {response.text}")
            return JSONResponse(status_code=500, content={"error": "Groq API error", "details": response.text})

        try:
            response_data = response.json()
            reply = response_data['choices'][0]['message']['content']
        except (ValueError, KeyError) as e:
            logger.error(f"JSON parsing error: {str(e)}")
            return JSONResponse(status_code=500, content={"error": "Invalid API response format"})

        return {"reply": reply}

    except Exception as e:
        logger.error(f"Chat endpoint error: {str(e)}")
        return JSONResponse(status_code=500, content={"error": f"Server error: {str(e)}"})
