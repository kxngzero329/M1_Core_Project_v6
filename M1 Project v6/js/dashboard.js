// Redirect to login if not authenticated
if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "login.html";
}

// Logout function
function logout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "login.html";
}

// Sidebar toggles for mobile
const openSidebarBtn = document.getElementById("openSidebar");
const closeSidebarBtn = document.getElementById("closeSidebar");

openSidebarBtn?.addEventListener("click", () => {
  document.getElementById("sidebar").style.display = "block";
});

closeSidebarBtn?.addEventListener("click", () => {
  document.getElementById("sidebar").style.display = "none";
});

// Global employee reference map
const employeeMap = {};

// Load employee, attendance, and payroll data
Promise.all([
  fetch("data/employee_info.json").then(res => res.json()),
  fetch("data/attendance.json").then(res => res.json()),
  fetch("data/payroll_data.json").then(res => res.json())
])
  .then(([employeeData, attendanceData, payrollData]) => {
    const employees = employeeData.employeeInformation;
    const attendanceRecords = attendanceData.attendanceAndLeave;
    const payrollRaw = payrollData.payrollData;

    // Map employees by ID for quick lookup
    employees.forEach(emp => {
      employeeMap[emp.employeeId] = emp;
    });

    // === Quick Stats ===
    document.getElementById("total-employees").textContent = employees.length;

    const today = attendanceRecords[0].attendance.at(-1).date;
    let presentToday = 0;
    attendanceRecords.forEach(emp => {
      const entry = emp.attendance.find(a => a.date === today);
      if (entry?.status === "Present") presentToday++;
    });
    document.getElementById("present-today").textContent = presentToday;

    const pendingLeaves = attendanceRecords.reduce((count, emp) => {
      const pending = emp.leaveRequests?.filter(req => req.status === "Pending").length || 0;
      return count + pending;
    }, 0);
    document.getElementById("pending-leaves").textContent = pendingLeaves;

    // line chart for monthly attendance
    const attendanceDates = attendanceRecords[0].attendance.map(a => a.date);
    const attendanceSums = attendanceDates.map(date =>
      attendanceRecords.filter(emp =>
        emp.attendance.find(a => a.date === date && a.status === "Present")
      ).length
    );

    new Chart(document.getElementById("monthlyAttendanceChart"), {
      type: "line",
      data: {
        labels: attendanceDates,
        datasets: [{
          label: "Employees Present",
          data: attendanceSums,
          borderColor: "#0d6efd",
          backgroundColor: "rgba(13,110,253,0.2)",
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: "#0d6efd"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Employees Present" }
          },
          x: {
            title: { display: true, text: "Date" }
          }
        }
      }
    });

    // department distribution chart doughnut
    const deptMap = {};
    employees.forEach(emp => {
      deptMap[emp.department] = (deptMap[emp.department] || 0) + 1;
    });

    new Chart(document.getElementById("departmentChart"), {
      type: "doughnut",
      data: {
        labels: Object.keys(deptMap),
        datasets: [{
          data: Object.values(deptMap),
          backgroundColor: [
            "#0d6efd", "#198754", "#ffc107", "#dc3545", "#6f42c1", "#20c997"
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              font: { size: 12 },
              boxWidth: 12
            }
          }
        }
      }
    });

    // recent activity list
    const activityList = document.getElementById("activityList");
    activityList.innerHTML = "";

    attendanceRecords.slice(-5).forEach(emp => {
      const last = emp.attendance.at(-1);
      const badgeClass =
        last.status === "Present" ? "bg-success" :
          last.status === "Absent" ? "bg-danger" :
            "bg-warning text-dark";

      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center rounded shadow-sm mb-2 border-start border-end border-2 border-primary bg-light-subtle px-4 py-3";
      li.innerHTML = `
        <div>
          <strong class="text-dark">${emp.name}</strong><br/>
          <small class="text-muted">${last.date}</small>
        </div>
        <span class="badge ${badgeClass} px-3 py-2">${last.status}</span>
      `;
      activityList.appendChild(li);
    });

    // payroll chart
    const calculatedPayroll = calculatePayroll(payrollRaw);
    new Chart(document.getElementById("payrollChart"), {
      type: "bar",
      data: {
        labels: calculatedPayroll.map(p => p.name.split(" ")[0]),
        datasets: [{
          label: "Net Pay",
          data: calculatedPayroll.map(p => p.netPay),
          backgroundColor: "rgb(173, 38, 51)",
          borderColor: "rgb(255, 61, 80)",
          borderWidth: 2,
          hoverBackgroundColor: "rgba(172, 57, 69, 0.94)",
          borderRadius: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `R ${ctx.raw.toLocaleString()}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => `R ${value}`
            },
            title: { display: true, text: "Net Salary (ZAR)" }
          },
          x: {
            title: { display: true, text: "Employee" }
          }
        }
      }
    });

  }).catch(err => console.error("Dashboard load error:", err));

// === Payroll Calculation Function ===
function calculatePayroll(data) {
  return data.map(p => {
    const emp = employeeMap[p.employeeId];
    const hourlyRate = Math.round(emp.salary / 160);
    const grossPay = hourlyRate * p.hoursWorked;
    const leaveHours = p.leaveDeductions * 8;
    const deductions = leaveHours * hourlyRate;
    const netPay = grossPay - deductions;
    const status = deductions < 800 ? "Good" : deductions < 1500 ? "Review" : "Warning";

    return {
      ...p,
      name: emp.name,
      position: emp.position,
      department: emp.department,
      contact: emp.contact,
      baseSalary: emp.salary,
      hourlyRate,
      grossPay,
      deductions,
      netPay,
      status
    };
  });
}
