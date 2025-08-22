import os
import pickle
import numpy as np
import sys
from PIL import Image
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
from tensorflow.keras.models import load_model
from werkzeug.utils import secure_filename

# Suppress TensorFlow logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2' # 0 = all messages, 1 = filter out INFO, 2 = filter out WARNING, 3 = filter out ERROR

# initialization
load_dotenv()
app = Flask(__name__)

# loading the model locally
try:
    print("Loading CNN model...")
    cnn_model = load_model("models/spinach_disease_classifier.h5")
    print("CNN model loaded successfully.")

    print("Loading Random Forest model...")
    with open("models/random_forest_final_model.pkl", "rb") as f:
        ml_model = pickle.load(f)
    print("Random Forest model loaded successfully.")
except Exception as e:
    print(f"FATAL: Error loading models from the 'models' folder. Error: {e}")
    sys.exit("Stopping server due to model loading failure.")

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
    if not cnn_model: return jsonify({"error": "CNN model is not loaded"}), 503
    if "file" not in request.files: return jsonify({"error": "No file part in the request"}), 400
    file = request.files["file"]
    if file.filename == '': return jsonify({"error": "No image selected for uploading"}), 400
    try:
        img = Image.open(file.stream).convert("RGB").resize((224, 224))
        img_array = np.array(img).astype('float32') / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        prediction = cnn_model.predict(img_array)
        predicted_class_index = int(np.argmax(prediction))
        
        class_names = ['Leaf Spot', 'Healthy', 'Mite Damage']
        predicted_class_name = class_names[predicted_class_index]
        return jsonify({"prediction": predicted_class_name})
    except Exception as e:
        print(f"Error during CNN prediction: {e}")
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

# This block is for local development. For production, Gunicorn will run the app.
if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=os.getenv("PORT", 5000))
