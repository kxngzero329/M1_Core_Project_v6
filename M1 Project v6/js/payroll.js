// Check if the user is logged in
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

// Global references
const tbody = document.getElementById("payroll-table-body");
const employeeMap = {};

// Load both employee and payroll data
Promise.all([
  fetch("data/employee_info.json").then(res => res.json()),
  fetch("data/payroll_data.json").then(res => res.json())
])
  .then(([employeeData, payrollData]) => {
    const employees = employeeData.employeeInformation;
    const payroll = payrollData.payrollData;

    employees.forEach(emp => {
      employeeMap[emp.employeeId] = emp;
    });

    const calculated = calculatePayroll(payroll);
    renderPayrollTable(calculated);
  })
  .catch(err => console.error("Data load failed:", err));

// this is how i calculate the payroll
// Hourly rate is calculated as salary / 160 (they working 8 hours a day so its = 160 hours/month)
// Gross pay is hourly rate * hours worked
// Leave deductions are calculated as leave days * 8 hours/day * hourly rate
// Net pay is gross pay - deductions
// Status is determined based on deductions as follows:
// for Good display: deductions must be less than 800
// for Review display: 800 must be less than deductions and less than 1500
// for Warning display: deductions must be greater than 1500

function calculatePayroll(data) {
  return data.map(p => {
    const emp = employeeMap[p.employeeId];
    const hourlyRate = Math.round(emp.salary / 160); // 160 hours/month
    const grossPay = hourlyRate * p.hoursWorked;
    const leaveHours = p.leaveDeductions * 8; // 8 hours/day
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

function renderPayrollTable(data) {
  tbody.innerHTML = "";

  data.forEach((item, index) => {
    const badgeClass = item.status === 'Good' ? 'success' : item.status === 'Review' ? 'warning text-dark' : 'danger';

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td class="d-flex align-items-center gap-2">
        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=0d6efd&color=fff&size=32" class="rounded-avatar" alt="avatar">${item.name}</td> 
      <td>${item.position}</td>
      <td>R ${item.baseSalary.toLocaleString()}</td>
      <td>R ${item.netPay.toLocaleString()}</td>
      <td><span class="badge bg-${badgeClass}">${item.status}</span></td>
      <td><button class="btn btn-sm btn-info" onclick="viewPayslip(${item.employeeId})">View</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function viewPayslip(empId) {
  const emp = employeeMap[empId];

  fetch("data/payroll_data.json")
    .then(res => res.json())
    .then(data => {
      const p = data.payrollData.find(entry => entry.employeeId === empId);
      const hourlyRate = Math.round(emp.salary / 160);
      const grossPay = hourlyRate * p.hoursWorked;
      const leaveHours = p.leaveDeductions * 8;
      const deductions = leaveHours * hourlyRate;
      const netPay = grossPay - deductions;

      const content = `
        <div id="payslipContentWrapper" style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ccc; border-radius: 10px; background-color: #f9f9f9;">
          <div style="text-align: center;">
            <img src="assets/logo-removebg-preview-1.png" alt="Company Logo" width="100" style="margin-bottom: 10px; border-radius: 50%; border: 1px double rgb(25, 40, 91);">
            <h4 style="margin-bottom: 20px; color:rgb(54, 54, 54);">Payslip from ModernTech HR</h4>
          </div>
          <p><strong>Name:</strong> ${emp.name}</p>
          <p><strong>Position:</strong> ${emp.position}</p>
          <p><strong>Department:</strong> ${emp.department}</p>
          <p><strong>Contact/Email:</strong> ${emp.contact}</p>
          <hr/>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #ececec;">
                <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Description</th>
                <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">Hourly Rate</td>
                <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">R ${hourlyRate.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">Hours Worked</td>
                <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${p.hoursWorked} hrs</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">Gross Pay</td>
                <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">R ${grossPay.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">Leave Taken</td>
                <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${p.leaveDeductions} days</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">Deductions</td>
                <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">-R ${deductions.toLocaleString()}</td>
              </tr>
              <tr style="font-weight: bold; background-color: #f1f1f1;">
                <td style="padding: 8px; border: 1px solid #ddd;">Net Pay</td>
                <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">R ${netPay.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>`;

      document.getElementById("payslipDetails").innerHTML = content;

      const modal = new bootstrap.Modal(document.getElementById("payslipModal"));
      modal.show();

      document.getElementById("downloadPdfBtn").onclick = () => {
        const wrapper = document.getElementById("payslipContentWrapper");
        html2pdf()
          .set({
            margin: [10, 10, 10, 10],
            filename: `${emp.name.replace(" ", "_")}_Payslip.pdf`,
            html2canvas: { scale: 2, scrollY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          })
          .from(wrapper)
          .save();
      };
    });
}
