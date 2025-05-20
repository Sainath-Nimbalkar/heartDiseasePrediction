// Dark mode toggle
document.getElementById("darkModeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    document.querySelector(".report-container").classList.toggle("dark-mode");
});

// Sidebar toggle for mobile
document.getElementById("sidebarToggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("show");
});

// Fetch report data and render charts
document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("/report-data");
    const data = await response.json();

    // Age Distribution (Bar Chart)
    const ageCtx = document.getElementById("ageChart").getContext("2d");
    new Chart(ageCtx, {
        type: "bar",
        data: {
            labels: Object.keys(data.age_distribution),
            datasets: [{
                label: "Count",
                data: Object.values(data.age_distribution),
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    // Sex Distribution (Pie Chart)
    const sexCtx = document.getElementById("sexChart").getContext("2d");
    new Chart(sexCtx, {
        type: "pie",
        data: {
            labels: Object.keys(data.sex_distribution),
            datasets: [{
                data: Object.values(data.sex_distribution),
                backgroundColor: ["#36A2EB", "#FF6384"]
            }]
        }
    });

    // Chest Pain Type Distribution (Bar Chart)
    const cpCtx = document.getElementById("cpChart").getContext("2d");
    new Chart(cpCtx, {
        type: "bar",
        data: {
            labels: Object.keys(data.chest_pain_distribution),
            datasets: [{
                label: "Count",
                data: Object.values(data.chest_pain_distribution),
                backgroundColor: "rgba(255, 159, 64, 0.6)",
                borderColor: "rgba(255, 159, 64, 1)",
                borderWidth: 1
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    // Heart Disease Prevalence (Pie Chart)
    const targetCtx = document.getElementById("targetChart").getContext("2d");
    new Chart(targetCtx, {
        type: "pie",
        data: {
            labels: Object.keys(data.target_distribution),
            datasets: [{
                data: Object.values(data.target_distribution),
                backgroundColor: ["#4BC0C0", "#FF6384"]
            }]
        }
    });


    // ➕ NEW: Age Distribution where Heart Disease is detected
    const ageDiseaseCtx = document.getElementById("ageDiseaseChart").getContext("2d");
    new Chart(ageDiseaseCtx, {
        type: "bar",
        data: {
            labels: Object.keys(data.age_with_disease),
            datasets: [{
                label: "Count",
                data: Object.values(data.age_with_disease),
                backgroundColor: "rgba(255, 99, 132, 0.6)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: "" }
            },
            scales: { y: { beginAtZero: true } }
        }
    });

    // ➕ NEW: Sex-wise count of Heart Disease
    const sexDiseaseCtx = document.getElementById("sexDiseaseChart").getContext("2d");
    new Chart(sexDiseaseCtx, {
        type: "doughnut",
        data: {
            labels: Object.keys(data.sex_with_disease),
            datasets: [{
                data: Object.values(data.sex_with_disease),
                backgroundColor: ["rgba(54, 162, 235, 0.6)", "rgba(255, 159, 64, 0.6)"]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: "" }
            }
        }
    });
});
