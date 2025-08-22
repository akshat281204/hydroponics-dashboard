import os
import pickle
import numpy as np
import sys
from PIL import Image
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import requests
import base64
from io import BytesIO
from flask_cors import CORS
import time

# initializing
load_dotenv()
app = Flask(__name__)
CORS(app) # cors for interaction

# loading random forest model
try:
    print("Loading Random Forest model...")
    with open("models/random_forest_final_model.pkl", "rb") as f:
        ml_model = pickle.load(f)
    print("Random Forest model loaded successfully.")
except Exception as e:
    print(f"FATAL: Error loading ML model. Error: {e}")
    ml_model = None

# routes
@app.route("/")
def dashboard():
    firebase_config = {
        "apiKey": os.getenv("FIREBASE_API_KEY"), "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
        "databaseURL": os.getenv("FIREBASE_DB_URL"), "projectId": os.getenv("FIREBASE_PROJECT_ID"),
        "storageBucket": os.getenv("FIREBASE_BUCKET"), "messagingSenderId": os.getenv("FIREBASE_SENDER_ID"),
        "appId": os.getenv("FIREBASE_APP_ID"), "measurementId": os.getenv("FIREBASE_MEASUREMENT_ID")
    }
    return render_template("dashboard.html", firebase_config=firebase_config)

@app.route("/predict_cnn", methods=["POST"])
def predict_cnn():
    # huggingface url
    HF_API_URL = "https://akshat281204-hydroponic-cnn.hf.space/predict"

    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files["file"]
    if file.filename == '':
        return jsonify({"error": "No image selected for uploading"}), 400

    try:
        buffered = BytesIO()
        Image.open(file.stream).save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        payload = {"data": f"data:image/jpeg;base64,{img_str}"}
        response = requests.post(HF_API_URL, json=payload)
        response.raise_for_status()
        prediction_data = response.json()
        return jsonify(prediction_data)
        
    except Exception as e:
        print(f"Error during CNN prediction via Hugging Face: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/predict_ml", methods=["POST"])
def predict_ml():
    if not ml_model: return jsonify({"error": "ML model is not loaded"}), 503
    input_data = request.json
    if not input_data: return jsonify({"error": "No input data provided"}), 400
    try:
        features = np.array([[
            float(input_data.get("ph", 6.2)),
            float(input_data.get("temp", 21.0)),
            float(input_data.get("ec", 2.0)),
            float(input_data.get("tds", 140.0))
        ]])
        prediction = ml_model.predict(features)
        result = "Healthy" if prediction[0] == 1 else "Unhealthy"
        return jsonify({"prediction": result})
    except Exception as e:
        print(f"Error during ML prediction: {e}")
        return jsonify({"error": str(e)}), 500

# local dev
if __name__ == "__main__":
    app.run(debug=True)