# 🌿 Smart Hydroponics Dashboard

## Project Overview

The Smart Hydroponics Dashboard is a full-stack web application designed to provide real-time monitoring and intelligent analysis for hydroponics systems. Built with Flask, it seamlessly integrates with a Firebase Realtime Database to fetch critical sensor data such as pH, temperature, Electrical Conductivity (EC), Total Dissolved Solids (TDS), water level, motion, and sound. The dashboard features a modern, interactive user interface with dynamic gauges for environmental parameters, and incorporates advanced AI models for instant plant health diagnostics and predictive growth analysis.

This project aims to empower hydroponics enthusiasts and professionals by transforming raw sensor data into actionable, data-driven insights, thereby optimizing plant growth conditions and proactively preventing potential issues.

## 🌟 Features

*   **Real-time Sensor Monitoring**: Displays live data for water temperature, pH level, EC level, TDS level, and water level, all sourced dynamically from a Firebase Realtime Database.
*   **Security Monitoring**: Provides real-time alerts for motion detection, unusual sound levels, and identifies potential intruder events based on combined sensor inputs.
*   **AI-powered Plant Disease Detection**: Utilizes an external, cloud-hosted Convolutional Neural Network (CNN) model (deployed on Hugging Face Spaces) to accurately identify plant diseases from user-uploaded images.
*   **AI-powered Growth Prediction**: Employs a locally loaded Random Forest Regressor model to predict the overall growth status of plants (e.g., "Healthy" or "Unhealthy") based on the current environmental parameters from the hydroponics system.
*   **Interactive Web Dashboard**: A responsive and visually appealing user interface crafted with HTML, modern CSS (featuring a glassmorphism design and subtle background animations), and JavaScript (utilizing Chart.js for dynamic gauges).
*   **Scalable Backend**: A Flask server efficiently handles sensor data processing, image uploads, and serves AI model inference requests.
*   **Easy Deployment**: Includes a `Procfile` for straightforward deployment to cloud platforms like Heroku.

## 🚀 Getting Started

Follow these steps to set up and run the Smart Hydroponics Dashboard locally on your machine.

### Prerequisites

*   Python 3.8 or higher
*   `pip` (Python package installer)
*   Access to a Firebase Realtime Database instance. This is where your hydroponics sensors will publish data.
*   An active Hugging Face inference endpoint for the CNN model. The current `app.py` uses `https://akshat281204-hydroponic-cnn.hf.space/predict`.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/akshat281204/hydroponics-dashboard.git
    cd hydroponics-dashboard
    ```

2.  **Create a virtual environment and activate it:**
    It's recommended to use a virtual environment to manage dependencies.
    ```bash
    python -m venv venv
    # On Windows
    .\venv\Scripts\activate
    # On macOS/Linux
    source venv/bin/activate
    ```

3.  **Install the required Python packages:**
    All necessary Python libraries are listed in `requirements.txt`.
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up Environment Variables:**
    Create a `.env` file in the root directory of your project. This file will store your sensitive Firebase configuration details, which are used by the Flask backend to pass to the frontend for client-side Firebase interaction.

    ```
    # .env
    FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
    FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
    FIREBASE_DB_URL="YOUR_FIREBASE_DATABASE_URL"
    FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
    FIREBASE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
    FIREBASE_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
    FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
    FIREBASE_MEASUREMENT_ID="YOUR_FIREBASE_MEASUREMENT_ID"
    ```
    *Note: The Hugging Face API URL for the CNN model (`HF_API_URL`) is currently hardcoded within `app.py`. If you wish to make this configurable via an environment variable, you would need to add `HF_API_URL="YOUR_HF_MODEL_URL"` to your `.env` file and modify `app.py` to `os.getenv("HF_API_URL")`.*

5.  **AI Models Check**:
    Ensure the machine learning models are located in the `models/` directory:
    *   `models/random_forest_final_model.pkl`: This pre-trained Random Forest model is loaded directly by `app.py` for local growth prediction inference.
    *   `models/spinach_disease_classifier.h5`: This file is present as part of the project structure, likely representing the original CNN model for disease classification. However, the `app.py` currently utilizes an *external* Hugging Face API for disease detection, offloading the inference to a dedicated service rather than loading this `.h5` file directly into the Flask application.

### Running the Application

1.  **Start the Flask development server:**
    Ensure your virtual environment is activated, then run:
    ```bash
    python app.py
    ```
2.  Open your preferred web browser and navigate to `http://127.0.0.1:5000`.

## ⚙️ Usage

Once the dashboard is running and connected to your Firebase project:

1.  **Real-time Data Monitoring**:
    The dashboard will automatically display and update sensor readings as your IoT devices (e.g., ESP32, Raspberry Pi) publish data to your configured Firebase Realtime Database.
    *   **Expected Firebase `/data` structure**: Your IoT devices should send JSON data to the `/data` path in your Firebase project, typically resembling:
        ```json
        {
          "ec": 2.0,           // Electrical Conductivity (μS/cm)
          "distance": 10.5,    // Water level distance (cm), used to calculate percentage
          "ph": 6.2,           // pH Level
          "sound": "No",       // Sound detection status ("Yes" or "No")
          "temperature": 21.0, // Water Temperature (°C)
          "tds": 140.0,        // Total Dissolved Solids (ppm)
          "motion": "No"       // Motion detection status ("Yes" or "No")
        }
        ```

2.  **Plant Disease Detection**:
    *   Navigate to the "AI Analysis" section on the dashboard.
    *   Click the "Upload Image" button under "Disease Detection."
    *   Select an image of your plant from your local machine.
    *   The image will be securely sent to the external Hugging Face API for deep learning analysis, and the predicted disease status (e.g., "Healthy", "Diseased - Early Blight") will be displayed on the dashboard.

3.  **Growth Prediction**:
    *   In the "AI Analysis" section, click the "Analyze Growth" button under "Growth Prediction."
    *   The system will use the latest available sensor data (pH, temperature, EC, TDS) from Firebase to make a prediction about the plant's overall growth status (e.g., "Healthy" or "Unhealthy") using the locally loaded Random Forest model.

## 📁 Project Structure

```
.
├── .gitattributes
├── .gitignore
├── Procfile                     # Configuration file for Heroku deployment
├── app.py                       # The core Flask application backend, handling routes, data, and AI inference requests.
├── models/
│   ├── random_forest_final_model.pkl  # Pre-trained Scikit-learn Random Forest model for growth prediction.
│   └── spinach_disease_classifier.h5  # The original Keras/TensorFlow CNN model for disease detection.
├── requirements.txt             # Lists all Python dependencies required for the project.
├── static/
│   ├── css/
│   │   └── style.css            # Custom CSS for styling the dashboard, implementing glassmorphism and animations.
│   └── js/
│       └── dashboard.js         # Frontend JavaScript: Manages Firebase data fetching, updates gauges, and handles AI interaction.
└── templates/
    └── dashboard.html           # The main HTML template for the hydroponics dashboard user interface.
```

## 🔌 API Documentation

The Flask application provides the following RESTful API endpoints:

### `GET /`

Renders the main web dashboard.

*   **Description**: This is the entry point for the dashboard application. It serves the `dashboard.html` template along with necessary Firebase configuration.
*   **Method**: `GET`
*   **Returns**: An HTML page (`templates/dashboard.html`) dynamically populated with Firebase configuration data.

### `POST /predict_cnn`

Endpoint for plant disease detection. It accepts an image file, forwards it to an external Hugging Face inference API, and returns the prediction.

*   **Description**: Allows users to upload a plant image for disease diagnosis. The image is base64 encoded and sent to a pre-configured Hugging Face Space for inference.
*   **Method**: `POST`
*   **Request Body**: `multipart/form-data`
    *   `file`: The image file of the plant.
*   **Example JavaScript Fetch Request**:
    ```javascript
    const formData = new FormData();
    formData.append('file', imageFileObject); // `imageFileObject` is typically from an <input type="file"> event
    
    fetch('/predict_cnn', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
    ```
*   **Example Success Response (JSON)**:
    ```json
    {
        "prediction": "Healthy",
        "confidence": 0.985
    }
    ```
*   **Example Error Response (JSON)**:
    ```json
    {
        "error": "No file part in the request"
    }
    ```
    or
    ```json
    {
        "error": "Error during CNN prediction via Hugging Face: Failed to connect to API"
    }
    ```

### `POST /predict_ml`

Endpoint for predicting plant growth status based on current environmental parameters.

*   **Description**: Utilizes the locally loaded `random_forest_final_model.pkl` to predict if the plant is "Healthy" or "Unhealthy" based on provided environmental sensor data.
*   **Method**: `POST`
*   **Request Body**: `application/json`
    *   `ph` (float, optional): Current pH level of the water. Defaults to `6.2`.
    *   `temp` (float, optional): Current water temperature in Celsius. Defaults to `21.0`.
    *   `ec` (float, optional): Current EC level. Defaults to `2.0`.
    *   `tds` (float, optional): Current TDS level. Defaults to `140.0`.
*   **Example Request Body (JSON)**:
    ```json
    {
        "ph": 6.3,
        "temp": 22.5,
        "ec": 2.1,
        "tds": 150.0
    }
    ```
*   **Example Success Response (JSON)**:
    ```json
    {
        "prediction": "Healthy"
    }
    ```
*   **Example Error Response (JSON)**:
    ```json
    {
        "error": "No input data provided"
    }
    ```
    or
    ```json
    {
        "error": "ML model is not loaded"
    }
    ```

## 📋 Dependencies

The project relies on the following key libraries and frameworks:

### Python (Backend)

*   `Flask`: The lightweight web framework used to build the application.
*   `python-dotenv`: Enables loading environment variables from a `.env` file.
*   `numpy`: Essential for numerical operations, particularly for preparing input data for the machine learning models.
*   `scikit-learn`: (Implicitly required for unpickling the `random_forest_final_model.pkl` file, which is a Scikit-learn model).
*   `Pillow` (PIL Fork): Used for image processing, specifically for opening and converting images for the CNN prediction.
*   `requests`: For making HTTP requests to external APIs, such as the Hugging Face inference endpoint.
*   `Flask-Cors`: A Flask extension to enable Cross-Origin Resource Sharing (CORS) for API endpoints.

### JavaScript (Frontend)

*   `Chart.js`: A flexible JavaScript charting library used to create the interactive and dynamic gauges on the dashboard.
*   `Firebase JS SDK`: Integrated via CDN, this SDK provides the necessary functions (`initializeApp`, `getDatabase`, `ref`, `onValue`) to connect to and fetch real-time data from the Firebase Realtime Database.

## 🤝 Contributing

Contributions to the Smart Hydroponics Dashboard are highly welcome! If you have ideas for improvements, new features, or bug fixes, please consider the following:

1.  **Fork the repository**.
2.  **Create a new branch**: `git checkout -b feature/your-feature-name` or `bugfix/issue-description`.
3.  **Make your changes**: Implement your features or fixes.
4.  **Commit your changes**: `git commit -m 'feat: Add a new feature'`. Follow conventional commit messages if possible.
5.  **Push to the branch**: `git push origin feature/your-feature-name`.
6.  **Open a Pull Request**: Describe your changes clearly and concisely.

Your efforts to improve this project are greatly appreciated!
