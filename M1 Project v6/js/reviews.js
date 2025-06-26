// Redirect if not logged in
if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "login.html";
}

// Logout function
function logout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "login.html";
}

// Sidebar toggle for mobile
document.getElementById("openSidebar")?.addEventListener("click", () => {
  document.getElementById("sidebar").style.display = "block";
});
document.getElementById("closeSidebar")?.addEventListener("click", () => {
  document.getElementById("sidebar").style.display = "none";
});

// Load employee names from JSON into select
fetch("data/employee_info.json")
  .then(res => res.json())
  .then(data => {
    const employeeSelect = document.getElementById("employeeName");
    data.employeeInformation.forEach(emp => {
      const option = document.createElement("option");
      option.value = emp.name;
      option.textContent = emp.name;
      employeeSelect.appendChild(option);
    });
  })
  .catch(err => console.error("Failed to load employee names:", err));

// Star Rating Logic
let selectedRating = 0;
const stars = document.querySelectorAll("#starRating i");

stars.forEach(star => {
  star.addEventListener("click", () => {
    selectedRating = parseInt(star.getAttribute("data-value"));
    updateStarDisplay();
  });
  star.addEventListener("mouseover", () => {
    highlightStars(parseInt(star.getAttribute("data-value")));
  });
  star.addEventListener("mouseleave", updateStarDisplay);
});

function updateStarDisplay() {
  stars.forEach(star => {
    const value = parseInt(star.getAttribute("data-value"));
    star.classList.toggle("active", value <= selectedRating);
  });
}
function highlightStars(tempValue) {
  stars.forEach(star => {
    const value = parseInt(star.getAttribute("data-value"));
    star.classList.toggle("active", value <= tempValue);
  });
}

// Form Submission - Adds to LocalStorage only
document.getElementById("reviewForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("employeeName").value;
  const review = document.getElementById("performanceReview").value;
  const ratingValue = selectedRating || 0;

  if (!name || !review || ratingValue === 0) {
    alert("Please complete all fields including the rating.");
    return;
  }

  const saved = JSON.parse(localStorage.getItem("performanceReviews") || "[]");
  saved.push({ name, rating: ratingValue, review });
  localStorage.setItem("performanceReviews", JSON.stringify(saved));
  renderReviewTable();
  document.getElementById("reviewForm").reset();
  selectedRating = 0;
  updateStarDisplay();
});

// Render performance reviews in table
function renderReviewTable() {
  const tbody = document.getElementById("reviewTableBody");
  const data = JSON.parse(localStorage.getItem("performanceReviews") || "[]");
  tbody.innerHTML = data.map((r, i) => `
    <tr>
      <td>${r.name}</td>
      <td>${"★".repeat(+r.rating)} ${r.rating}/5</td>
      <td>${r.review}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteReview(${i})">Delete</button>
        <button class="btn btn-sm btn-secondary ms-2" onclick="downloadReview(${i})">Download</button>
      </td>
    </tr>
  `).join("");
}

// Delete review
function deleteReview(index) {
  const data = JSON.parse(localStorage.getItem("performanceReviews") || "[]");
  data.splice(index, 1);
  localStorage.setItem("performanceReviews", JSON.stringify(data));
  renderReviewTable();
}

// Download review as Word file
function downloadReview(index) {
  const data = JSON.parse(localStorage.getItem("performanceReviews") || "[]");
  const reviewData = data[index];

  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Performance Review</title></head>
      <body style='font-family: Arial; padding: 40px;'>
        <div style='border: 1px solid #ccc; border-radius: 12px; padding: 30px; max-width: 700px; margin: auto;'>
          <div style='text-align: center;'>
            <h2 style='color:rgb(0, 42, 108);'>ModernTech HR - Performance Review</h2>
          <hr/>
          <p style="text-align: center;"><strong>Employee Name:</strong> ${reviewData.name}</p>
          <p style="text-align: center;"><strong>Rating:</strong> ${"★".repeat(reviewData.rating)}</p>
          <p><strong>Review:</strong></p>
          <div style='background:rgb(211, 211, 211); padding: 15px; border: 7px double rgb(41, 127, 255);'>
            ${reviewData.review}
          </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob([content], { type: "application/msword;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${reviewData.name.replace(/\s+/g, '_')}_Performance_Review.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// On page load
renderReviewTable();
