// Dark mode toggle
document.getElementById("darkModeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    document.querySelector(".education-container").classList.toggle("dark-mode");
});

// Sidebar toggle for mobile
document.getElementById("sidebarToggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("show");
});

// Interactive Tutorial Navigation
const steps = document.querySelectorAll(".tutorial-step");
const prevBtn = document.getElementById("prev-step");
const nextBtn = document.getElementById("next-step");
let currentStep = 1;

function updateSteps() {
    steps.forEach(step => {
        step.classList.remove("active");
        if (parseInt(step.getAttribute("data-step")) === currentStep) {
            step.classList.add("active");
        }
    });

    // Update button states
    prevBtn.disabled = currentStep === 1;
    nextBtn.disabled = currentStep === steps.length;
}

prevBtn.addEventListener("click", () => {
    if (currentStep > 1) {
        currentStep--;
        updateSteps();
    }
});

nextBtn.addEventListener("click", () => {
    if (currentStep < steps.length) {
        currentStep++;
        updateSteps();
    }
});

// Blood Pressure Input Validation
document.getElementById("bp-input").addEventListener("input", (e) => {
    const bp = parseInt(e.target.value);
    const resultDiv = document.getElementById("bp-result");
    resultDiv.style.display = "block";

    if (isNaN(bp) || bp < 0 || bp > 200) {
        resultDiv.className = "alert alert-warning";
        resultDiv.innerText = "Please enter a valid systolic blood pressure (0-200 mmHg).";
    } else if (bp < 90) {
        resultDiv.className = "alert alert-warning";
        resultDiv.innerText = "Your blood pressure is low. Consult a doctor if you feel dizzy or faint.";
    } else if (bp >= 90 && bp <= 120) {
        resultDiv.className = "alert alert-success";
        resultDiv.innerText = "Your blood pressure is normal. Great job!";
    } else if (bp > 120 && bp <= 129) {
        resultDiv.className = "alert alert-info";
        resultDiv.innerText = "Your blood pressure is elevated. Monitor it regularly.";
    } else if (bp > 129 && bp <= 139) {
        resultDiv.className = "alert alert-warning";
        resultDiv.innerText = "You may have Stage 1 hypertension. Consider lifestyle changes and consult a doctor.";
    } else {
        resultDiv.className = "alert alert-danger";
        resultDiv.innerText = "You may have Stage 2 hypertension. Please consult a doctor immediately.";
    }
});

// Initialize the tutorial
updateSteps();