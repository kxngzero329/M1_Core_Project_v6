// sidebar that stays consistent on all pages
const sidebar = document.getElementById("sidebar");
const openBtn = document.getElementById("openSidebar");
const closeBtn = document.getElementById("closeSidebar");

openBtn.addEventListener("click", () => {
    sidebar.classList.add("show-sidebar");
});

closeBtn.addEventListener("click", () => {
    sidebar.classList.remove("show-sidebar");
});

// logout
function logout() {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
}