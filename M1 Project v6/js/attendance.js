// Block access if not logged in
if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "login.html";
}

// Sidebar mobile toggle
document.getElementById("openSidebar")?.addEventListener("click", () => {
  document.getElementById("sidebar").style.display = "block";
});
document.getElementById("closeSidebar")?.addEventListener("click", () => {
  document.getElementById("sidebar").style.display = "none";
});

// Load attendance + leave notes
Promise.all([
  fetch("data/attendance.json").then(res => res.json()),
  Promise.resolve(JSON.parse(localStorage.getItem("leaveRequests") || "[]")),
  Promise.resolve(JSON.parse(localStorage.getItem("attendanceNotes") || "[]"))
])
  .then(([attendanceData, leaveRequests, attendanceNotes]) => {
    const container = document.getElementById("attendanceContainer");
    const records = attendanceData.attendanceAndLeave;

    records.forEach(emp => {
      // Filter approved leave for employee
      const approvedLeaves = leaveRequests.filter(req =>
        req.name === emp.name && req.status === "Approved"
      );

      // Adjust attendance to reflect 'On Leave'
      emp.attendance = emp.attendance.map(day => {
        const isOnLeave = approvedLeaves.some(req =>
          new Date(day.date) >= new Date(req.start) && new Date(day.date) <= new Date(req.end)
        );
        return {
          ...day,
          status: isOnLeave ? "On Leave" : day.status
        };
      });

      // Calculate counts
      const totalDays = emp.attendance.length;
      const presentDays = emp.attendance.filter(a => a.status === "Present").length;
      const leaveDays = emp.attendance.filter(a => a.status === "On Leave").length;
      const absentDays = totalDays - presentDays - leaveDays;

      // Build card
      const card = document.createElement("div");
      card.className = "col-md-6";
      card.innerHTML = `
        <div class="card shadow-sm border-0">
          <div class="card-body">
            <h5 class="card-title">${emp.name}</h5>
            <p><strong>Total Days:</strong> ${totalDays}</p>
            <p>
              <span class="badge bg-success">Present: ${presentDays}</span>
              <span class="badge bg-danger ms-2">Absent: ${absentDays}</span>
            </p>

            <h6 class="mt-4">Recent Attendance:</h6>
            <ul class="list-group list-group-flush mb-3">
              ${emp.attendance.slice(-5).map(day => `
                <li class="list-group-item d-flex justify-content-between">
                  ${day.date}
                  <span class="badge ${day.status === "Present" ? "bg-success" :
          day.status === "On Leave" ? "bg-warning text-dark" :
            "bg-danger"
        }">${day.status}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        </div>
      `;

      container.appendChild(card);

      // Display recent leave actions
      renderAttendanceNotes(card, emp.name, attendanceNotes);
    });
  })
  .catch(err => {
    document.getElementById("attendanceContainer").innerHTML =
      `<div class="alert alert-danger">Error loading data: ${err}</div>`;
  });

function renderAttendanceNotes(cardElement, employeeName) {
  const attendanceNotes = JSON.parse(localStorage.getItem("attendanceNotes")) || [];
  const empNotes = attendanceNotes
    .filter(note => note.name === employeeName)
    .slice(-3)
    .map(note => `
      <li class="list-group-item small border-start border-3 border-info bg-light-subtle rounded">
        <span class="fw-bold text-info">🗓️ ${note.date}</span><br/>
        <span class="text-dark">${note.message}</span>
      </li><hr/>
    `)
    .join("");

  if (empNotes) {
    const noteSection = document.createElement("div");
    noteSection.innerHTML = `
      <h6 class="mt-3">Recent Leave Actions:</h6>
      <ul class="list-group list-group-flush">${empNotes}</ul>
    `;
    cardElement.querySelector(".card-body").appendChild(noteSection);
  }
}
