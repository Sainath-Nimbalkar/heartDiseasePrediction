document.addEventListener("DOMContentLoaded", () => {
    // Dark mode toggle
    document.getElementById("darkModeToggle").addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });

    // Sidebar toggle for mobile
    document.getElementById("sidebarToggle").addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("show");
    });

    // Handle prediction type selection
    const predictionTypeSelect = document.getElementById("predictionType");
    const heartForm = document.getElementById("heartForm");
    const diabetesForm = document.getElementById("diabetesForm");
    const selectedModelIndicator = document.getElementById("selectedModelIndicator");
    const selectedModelBadge = document.getElementById("selectedModelBadge");

    function updateSelectedModelIndicator(selectedType) {
        selectedModelIndicator.classList.remove("d-none", "heart", "diabetes");
        if (selectedType === "heart") {
            selectedModelIndicator.classList.add("heart");
            selectedModelBadge.textContent = "Selected: Heart Disease Prediction";
        } else if (selectedType === "diabetes") {
            selectedModelIndicator.classList.add("diabetes");
            selectedModelBadge.textContent = "Selected: Diabetes Prediction";
        }
    }

    // Initialize the indicator with the default selection
    updateSelectedModelIndicator(predictionTypeSelect.value);

    predictionTypeSelect.addEventListener("change", () => {
        const selectedType = predictionTypeSelect.value;
        console.log("Selected type:", selectedType);
        document.querySelectorAll(".prediction-form").forEach(form => {
            form.classList.remove("active");
        });
        if (selectedType === "heart") {
            heartForm.classList.add("active");
            console.log("Showing heart form");
        } else if (selectedType === "diabetes") {
            diabetesForm.classList.add("active");
            console.log("Showing diabetes form");
        }
        updateSelectedModelIndicator(selectedType);
    });

    // Validation function for heart form
    function validateHeartForm(data) {
        const errors = [];
        const age = parseFloat(data.Age);
        const restingBP = parseFloat(data.RestingBP);
        const cholesterol = parseFloat(data.Cholesterol);
        const maxHR = parseFloat(data.MaxHR);
        const oldpeak = parseFloat(data.Oldpeak);

        if (age < 0 || age > 120) errors.push("Age must be between 0 and 120.");
        if (restingBP < 0 || restingBP > 200) errors.push("Resting Blood Pressure must be between 0 and 200 mmHg.");
        if (cholesterol < 0 || cholesterol > 600) errors.push("Cholesterol must be between 0 and 600 mg/dl.");
        if (maxHR < 60 || maxHR > 220) errors.push("Maximum Heart Rate must be between 60 and 220.");
        if (oldpeak < -2 || oldpeak > 6) errors.push("Oldpeak must be between -2 and 6.");
        if (!["M", "F"].includes(data.Sex)) errors.push("Sex must be Male (M) or Female (F).");
        if (!["0", "1"].includes(data.FastingBS)) errors.push("Fasting Blood Sugar must be 0 or 1.");
        if (!["N", "Y"].includes(data.ExerciseAngina)) errors.push("Exercise Induced Angina must be No (N) or Yes (Y).");
        if (!["ATA", "NAP", "ASY", "TA"].includes(data.ChestPain)) errors.push("Invalid Chest Pain Type.");
        if (!["Normal", "ST", "LVH"].includes(data.RestingECG)) errors.push("Invalid Resting ECG value.");
        if (!["Up", "Flat", "Down"].includes(data.ST_Slope)) errors.push("Invalid ST Slope value.");

        return errors;
    }

    // Validation function for diabetes form
    function validateDiabetesForm(data) {
        const errors = [];
        const age = parseFloat(data.age);
        const bmi = parseFloat(data.bmi);
        const hba1c = parseFloat(data.HbA1c_level);
        const glucose = parseFloat(data.blood_glucose_level);

        if (age < 0 || age > 120) errors.push("Age must be between 0 and 120.");
        if (!["0", "1"].includes(data.gender)) errors.push("Gender must be Male (0) or Female (1).");
        if (!["0", "1"].includes(data.hypertension)) errors.push("Hypertension must be 0 or 1.");
        if (!["0", "1"].includes(data.heart_disease)) errors.push("Heart Disease must be 0 or 1.");
        if (!["0", "1", "2", "3", "4", "5"].includes(data.smoking_history)) errors.push("Invalid Smoking History value.");
        if (bmi < 10 || bmi > 50) errors.push("BMI must be between 10 and 50.");
        if (hba1c < 3 || hba1c > 10) errors.push("HbA1c Level must be between 3 and 10.");
        if (glucose < 50 || glucose > 300) errors.push("Blood Glucose Level must be between 50 and 300 mg/dl.");

        return errors;
    }

    // Handle form submission
    document.querySelectorAll(".prediction-form").forEach(form => {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            data.prediction_type = predictionTypeSelect.value;

            // Validate the form based on prediction type
            let errors = [];
            if (data.prediction_type === "heart") {
                errors = validateHeartForm(data);
            } else if (data.prediction_type === "diabetes") {
                errors = validateDiabetesForm(data);
            }

            if (errors.length > 0) {
                alert("Please correct the following errors:\n- " + errors.join("\n- "));
                return;
            }

            try {
                const response = await fetch("/predict", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error("Prediction failed");
                }

                const result = await response.json();
                displayResult(result);
            } catch (error) {
                console.error("Error:", error);
                displayResult({ message: "Error making prediction", confidence: 0, risk_level: "Unknown" });
            }
        });
    });

    function displayResult(result) {
        const resultDiv = document.getElementById("predictionResult");
        const resultMessage = document.getElementById("resultMessage");
        const resultConfidence = document.getElementById("resultConfidence");
        const confidenceBar = document.getElementById("confidenceBar");
        const resultRiskLevel = document.getElementById("resultRiskLevel");

        resultDiv.style.display = "block";
        resultMessage.textContent = result.message;
        const confidencePercent = (result.confidence * 100).toFixed(2);
        resultConfidence.textContent = confidencePercent;
        resultRiskLevel.textContent = result.risk_level;

        // Update progress bar
        confidenceBar.style.width = `${confidencePercent}%`;
        confidenceBar.setAttribute("aria-valuenow", confidencePercent);

        // Color-code the progress bar and risk level
        confidenceBar.className = "progress-bar";
        resultRiskLevel.className = "";
        if (result.risk_level === "High") {
            confidenceBar.classList.add("bg-danger");
            resultRiskLevel.classList.add("text-danger");
        } else if (result.risk_level === "Moderate") {
            confidenceBar.classList.add("bg-warning");
            resultRiskLevel.classList.add("text-warning");
        } else {
            confidenceBar.classList.add("bg-success");
            resultRiskLevel.classList.add("text-success");
        }
    }
});