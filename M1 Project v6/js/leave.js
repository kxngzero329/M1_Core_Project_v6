// BLOCK ACCESS IF NOT LOGGED IN
if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "login.html";
}

// LOGOUT FUNCTION
function logout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "login.html";
}

// SIDEBAR TOGGLE FUNCTIONALITY FOR MOBILE
document.getElementById("openSidebar")?.addEventListener("click", () => {
  document.getElementById("sidebar").style.display = "block";
});
document.getElementById("closeSidebar")?.addEventListener("click", () => {
  document.getElementById("sidebar").style.display = "none";
});

// INITIALIZE LEAVE REQUESTS FROM LOCALSTORAGE OR EMPTY
let leaveRequests = JSON.parse(localStorage.getItem("leaveRequests")) || [];

// REFERENCE DOM ELEMENTS
const leaveForm = document.getElementById("leaveForm");
const leaveTableBody = document.getElementById("leaveTableBody");

// RENDER LEAVE REQUESTS INTO TABLE
function renderLeaveTable() {
  leaveTableBody.innerHTML = "";

  leaveRequests.forEach((req, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${req.name}</td>
      <td>${req.start}</td>
      <td>${req.end}</td>
      <td>${req.reason}</td>
      <td><span class="badge bg-${req.status === 'Approved' ? 'success' : req.status === 'Denied' ? 'danger' : 'secondary'}">${req.status}</span></td>
      <td>
        ${req.status === 'Pending' ? `
          <button class="btn btn-sm btn-success me-1" onclick="updateStatus(${index}, 'Approved')">Approve</button>
          <button class="btn btn-sm btn-danger" onclick="updateStatus(${index}, 'Denied')">Deny</button>
        ` : '--'}
      </td>
    `;
    leaveTableBody.appendChild(row);
  });
}

// UPDATE STATUS AND SYNC TO ATTENDANCE NOTES
function updateStatus(index, newStatus) {
  leaveRequests[index].status = newStatus;
  localStorage.setItem("leaveRequests", JSON.stringify(leaveRequests));
  renderLeaveTable();

  // Add to attendance notes
  const notesKey = "attendanceNotes";
  let notes = JSON.parse(localStorage.getItem(notesKey)) || [];
  const now = new Date().toISOString().split("T")[0];

  notes.push({
    name: leaveRequests[index].name,
    date: now,
    message: `Leave request from ${leaveRequests[index].start} to ${leaveRequests[index].end} has been ${newStatus}.`
  });

  localStorage.setItem(notesKey, JSON.stringify(notes));
}

// FORM SUBMISSION: CREATE NEW LEAVE REQUEST
leaveForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("empName").value.trim();
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  const reason = document.getElementById("reason").value.trim();

  if (new Date(start) > new Date(end)) {
    alert("End date cannot be before start date.");
    return;
  }

  leaveRequests.push({
    name,
    start,
    end,
    reason,
    status: "Pending"
  });

  localStorage.setItem("leaveRequests", JSON.stringify(leaveRequests));
  renderLeaveTable();
  leaveForm.reset();
  bootstrap.Modal.getInstance(document.getElementById("leaveModal")).hide();
});

// FETCH EMPLOYEES TO POPULATE SELECT
fetch("data/employee_info.json")
  .then(res => res.json())
  .then(data => {
    const employeeSelect = document.getElementById("empName");
    data.employeeInformation.forEach(emp => {
      const option = document.createElement("option");
      option.value = emp.name;
      option.textContent = emp.name;
      employeeSelect.appendChild(option);
    });
  })
  .catch(error => {
    console.error("Failed to load employee names:", error);
  });


function clearLeaveRequests() {
  if (leaveRequests.length === 0) {
    alert("No data in table to clear.");
    return;
  }

  if (confirm("Are you sure you want to delete all leave requests?")) {
    leaveRequests = [];
    localStorage.setItem("leaveRequests", JSON.stringify([]));
    localStorage.setItem("attendanceNotes", JSON.stringify([])); // optional
    renderLeaveTable();
  }
}


// INITIAL RENDER ON LOAD
renderLeaveTable();

