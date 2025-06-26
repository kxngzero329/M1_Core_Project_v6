// Block access if not logged in then redirect to login page
if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "login.html";
}

let allEmployees = [];

// 1. Load data from localStorage first
const savedEmployees = JSON.parse(localStorage.getItem("employeeData"));
if (savedEmployees && savedEmployees.length > 0) {
  allEmployees = savedEmployees;
  renderCards(allEmployees);
} else {
  // 2. Fallback to loading from JSON file (first time)
  fetch("data/employee_info.json")
    .then(response => response.json())
    .then(data => {
      allEmployees = data.employeeInformation;
      localStorage.setItem("employeeData", JSON.stringify(allEmployees));
      renderCards(allEmployees);
    })
    .catch(error => {
      console.error("Error loading employee data:", error);
    });
}

// 🔎 Search filter
document.getElementById("searchInput").addEventListener("input", function () {
  const term = this.value.toLowerCase();
  const filtered = allEmployees.filter(emp =>
    emp.name.toLowerCase().includes(term) ||
    emp.position.toLowerCase().includes(term) ||
    emp.department.toLowerCase().includes(term)
  );
  renderCards(filtered);
});

// ✨ Renders all employee cards
function renderCards(data) {
  const container = document.getElementById("employee-card-container");
  container.innerHTML = ""; // Clear previous

  data.forEach((emp, index) => {
    const card = document.createElement("div");
    card.className = "col-md-4 mb-4";
    card.innerHTML = `
      <div class="card h-100 shadow-sm border-0">
        <div class="card-body">
          <h5 class="card-title text-primary">${emp.name}</h5>
          <p class="card-text mb-1"><strong>Position:</strong> ${emp.position}</p>
          <p class="card-text mb-1"><strong>Department:</strong> ${emp.department}</p>
          <p class="card-text mb-1"><strong>Salary:</strong> R ${emp.salary.toLocaleString()}</p>
          <p class="card-text mb-1"><strong>Contact:</strong> <a href="mailto:${emp.contact}">${emp.contact}</a></p>
          <p class="card-text"><strong>History:</strong> ${emp.employmentHistory}</p>
          <button class="btn btn-sm btn-outline-primary me-2" onclick="editEmployee(${index})">Edit</button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${index})">Delete</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ✏️ Edit employee
function editEmployee(index) {
  const emp = allEmployees[index];
  document.getElementById("empName").value = emp.name;
  document.getElementById("empPosition").value = emp.position;
  document.getElementById("empDepartment").value = emp.department;
  document.getElementById("empSalary").value = emp.salary;
  document.getElementById("empContact").value = emp.contact;
  document.getElementById("empHistory").value = emp.employmentHistory;
  document.getElementById("editIndex").value = index;

  document.getElementById("modalTitle").textContent = "Edit Employee";
  const modal = new bootstrap.Modal(document.getElementById("addEmployeeModal"));
  modal.show();
}

// ❌ Delete employee
function deleteEmployee(index) {
  if (confirm("Are you sure you want to delete this employee?")) {
    allEmployees.splice(index, 1);
    localStorage.setItem("employeeData", JSON.stringify(allEmployees));
    renderCards(allEmployees);
  }
}

// ✅ Add or update employee
const addEmployeeForm = document.getElementById("addEmployeeForm");
addEmployeeForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const salaryValue = parseFloat(document.getElementById("empSalary").value);
  if (salaryValue < 3000) {
    alert("Salary must be at least R3000.");
    return;
  }

  const newEmp = {
    name: document.getElementById("empName").value.trim(),
    position: document.getElementById("empPosition").value.trim(),
    department: document.getElementById("empDepartment").value.trim(),
    salary: salaryValue,
    contact: document.getElementById("empContact").value.trim(),
    employmentHistory: document.getElementById("empHistory").value.trim()
  };

  const editIndex = document.getElementById("editIndex").value;
  if (editIndex !== "") {
    allEmployees[editIndex] = newEmp;
  } else {
    allEmployees.push(newEmp);
  }

  localStorage.setItem("employeeData", JSON.stringify(allEmployees));
  renderCards(allEmployees);
  addEmployeeForm.reset();
  document.getElementById("editIndex").value = "";
  document.getElementById("modalTitle").textContent = "Add New Employee";

  bootstrap.Modal.getInstance(document.getElementById("addEmployeeModal")).hide();
});
