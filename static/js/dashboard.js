// ================= FIREBASE SETUP (CDN IMPORTS) =================
// Import specific functions from the Firebase CDN URLs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Initialize Firebase and get a reference to the database
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ================= GLOBAL VARIABLES =================
let temperatureGauge, phGauge, ecGauge, tdsGauge;
let latestData = {}; // store last Firebase snapshot for ML predictions

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', function () {
    initializeGauges();
    startDataListening();
    setupEventListeners();
    updateTimestamp();
    setInterval(updateTimestamp, 3000);
    createFloatingParticles(); // Added from script.js
});

// ================= GAUGES =================
function initializeGauges() {
    temperatureGauge = createGauge('temperatureGauge', 0, 50, '°C', '#e74c3c');
    phGauge = createGauge('phGauge', 0, 14, 'pH', '#f39c12');
    ecGauge = createGauge('ecGauge', 0, 3000, 'μS/cm', '#3498db');
    tdsGauge = createGauge('tdsGauge', 0, 2000, 'ppm', '#9b59b6');
}

function createGauge(canvasId, min, max, unit, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'doughnut',
        data: { datasets: [{ data: [0, max], backgroundColor: [color, '#ecf0f1'], borderWidth: 0, cutout: '70%' }] },
        options: { responsive: true, maintainAspectRatio: true, rotation: -90, circumference: 180, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
    });
}

function updateGauge(gauge, value, max, elementId, unit) {
    if (value === undefined || value === null || isNaN(value)) {
        value = 0; // Default to 0 if data is invalid
    }
    gauge.data.datasets[0].data = [value, max - value];
    gauge.update('none');
    document.getElementById(elementId).textContent = `${parseFloat(value).toFixed(1)}${unit}`;
}

// ================= REAL-TIME DATA HANDLING =================
function startDataListening() {
    const dataRef = ref(database, 'data'); // Create a reference to the 'data' path
    onValue(dataRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            latestData = data;
            updateSensorData(data);
        }
    });
}

function updateSensorData(data) {
    updateSecurityStatus(data.motion === "Yes", data.sound === "Yes");

    if (data.temperature !== undefined) {
        updateGauge(temperatureGauge, data.temperature, 50, 'tempValue', '°C');
        const tempStatus = document.getElementById('tempStatus');
        if (data.temperature < 18) {
            tempStatus.textContent = "Too Low";
            tempStatus.className = 'gauge-status critical';
        } else if (data.temperature > 26) {
            tempStatus.textContent = "Too High";
            tempStatus.className = 'gauge-status warning';
        } else {
            tempStatus.textContent = "Optimal";
            tempStatus.className = 'gauge-status optimal';
        }
    }

    if (data.distance !== undefined) {
        const tankHeight = 20;
        const waterLevel = Math.max(0, Math.min(100, ((tankHeight - data.distance) / tankHeight) * 100));
        updateWaterLevel(waterLevel);
    }
    
    const ph = data.ph || 0;
    updateGauge(phGauge, ph, 14, 'phValue', '');
    const phStatus = document.getElementById('phStatus');
    if (ph < 5.5) {
        phStatus.textContent = "Too Acidic";
        phStatus.className = 'gauge-status warning';
    } else if (ph > 6.5) {
        phStatus.textContent = "Too Alkaline";
        phStatus.className = 'gauge-status warning';
    } else {
        phStatus.textContent = "Optimal";
        phStatus.className = 'gauge-status optimal';
    }

    const ec = data.ec || 0;
    updateGauge(ecGauge, ec, 3000, 'ecValue', ' μS/cm');
    const ecStatus = document.getElementById('ecStatus');
    if (ec < 1500 || ec > 2500) {
        ecStatus.textContent = "Suboptimal";
        ecStatus.className = 'gauge-status warning';
    } else {
        ecStatus.textContent = "Good";
        ecStatus.className = 'gauge-status optimal';
    }

    const tds = data.tds || 0;
    updateGauge(tdsGauge, tds, 2000, 'tdsValue', ' ppm');
    const tdsStatus = document.getElementById('tdsStatus');
    if (tds < 750 || tds > 1250) {
        tdsStatus.textContent = "Suboptimal";
        tdsStatus.className = 'gauge-status warning';
    } else {
        tdsStatus.textContent = "Excellent";
        tdsStatus.className = 'gauge-status optimal';
    }
    
    updateGauge(ecGauge, data.ec, 3000, 'ecValue', ' μS/cm');
    updateGauge(tdsGauge, data.tds, 2000, 'tdsValue', ' ppm');
}

function updateSecurityStatus(motion, sound) {
    updateSecurityCard('motion', motion);
    updateSecurityCard('sound', sound);
    updateSecurityCard('intruder', motion && sound);
}

function updateSecurityCard(type, isDetected) {
    const card = document.getElementById(`${type}Card`);
    const statusEl = document.getElementById(`${type}Status`);
    const bar = document.getElementById(`${type}Bar`);
    if (!card || !statusEl || !bar) return;

    statusEl.textContent = isDetected ? 'YES' : 'NO';
    card.classList.remove('alert', 'active');

    if (isDetected) {
        statusEl.className = 'status-value danger';
        bar.style.width = '100%';
        if (type === 'intruder') {
            card.classList.add('alert');
        } else {
            card.classList.add('active');
        }
    } else {
        statusEl.className = 'status-value safe';
        bar.style.width = '10%';
    }
}

function updateWaterLevel(level) {
    const waterFill = document.getElementById('waterFill');
    const waterPercentage = document.getElementById('waterPercentage');
    waterFill.style.height = `${level.toFixed(0)}%`;
    waterPercentage.textContent = `${level.toFixed(0)}%`;
}

// ================= EVENT LISTENERS & AI =================
function setupEventListeners() {
    document.getElementById('diseaseImageInput').addEventListener('change', handleDiseaseImageUpload);
    document.querySelector("#growthCard .ai-button").addEventListener("click", generateGrowthPrediction);
    document.querySelector("#diseaseCard .ai-button").addEventListener("click", triggerUpload);
}

function handleDiseaseImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const resultElement = document.getElementById('diseaseResult');
    resultElement.style.display = 'block';
    resultElement.className = 'ai-result'; // Reset classes
    resultElement.innerText = 'Analyzing...';

    const formData = new FormData();
    formData.append('file', file);
    
    fetch('/predict_cnn', { method: 'POST', body: formData })
        .then(res => {
            if (!res.ok) {
                throw new Error(`Server returned status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            resultElement.innerHTML = `Prediction: <strong>${data.prediction}</strong>`;
            if (data.prediction.toLowerCase() === 'healthy') {
                resultElement.classList.add('healthy');
            } else {
                resultElement.classList.add('diseased');
            }
        })
        .catch(err => {
            console.error("Error during CNN prediction fetch:", err);
            resultElement.innerText = `Error: ${err.message}`;
            resultElement.classList.add('diseased');
        });
}

function triggerUpload() {
    document.getElementById('diseaseImageInput').click();
}

async function generateGrowthPrediction() {
    if (Object.keys(latestData).length === 0) {
        document.getElementById("growthResult").innerText = "No sensor data available yet.";
        return;
    }

    const resultEl = document.getElementById("growthResult");
    resultEl.style.display = "block";
    resultEl.className = 'ai-result'; 
    resultEl.innerText = "Predicting...";

    const inputData = {
        ph: latestData.ph || 6.5,
        temp: latestData.temperature || 25,
        tds: latestData.tds || 140.0,
        ec: latestData.ec || 2.0
    };

    try {
        let res = await fetch("/predict_ml", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(inputData)
        });

        if (!res.ok) {
            throw new Error(`Server returned status: ${res.status}`);
        }

        let data = await res.json();
        resultEl.innerHTML = `Prediction: <strong>${data.prediction}</strong>`;

        if (data.prediction.toLowerCase() === 'healthy') {
            resultEl.classList.add('healthy');
        } else {
            resultEl.classList.add('diseased');
        }

    } catch (err) {
        console.error("Error during ML prediction fetch:", err);
        resultEl.innerText = `Error: ${err.message}`;
        resultEl.classList.add('diseased');
    }
}

// ================= UTILITIES =================
function createFloatingParticles() {
    const container = document.querySelector('.floating-particles');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `position: absolute; width: ${Math.random()*3+1}px; height: ${Math.random()*3+1}px; background: rgba(34, 197, 94, ${Math.random()*0.5+0.2}); border-radius: 50%; left: ${Math.random()*100}%; animation: float ${Math.random()*20+15}s infinite linear; animation-delay: ${Math.random()*-20}s;`;
        container.appendChild(particle);
    }
}

function updateTimestamp() {
    document.getElementById('lastUpdate').textContent = `Last Updated: ${new Date().toLocaleString()}`;
}