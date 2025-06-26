// login page

// credentials for login hardcoded for easier access
const validUser = "SonGoku";
const validPass = "goku123";

// login function 
function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const error = document.getElementById("error");

  // this here checks if the username and password match the hardcoded credentials
  if (error) {
    error.style.display = "none"; // hide error message initially
  }
  if (username === validUser && password === validPass) {
    localStorage.setItem("isLoggedIn", "true");
    window.location.href = "index.html";
  } else {
    error.textContent = "***Invalid username or password***";
    error.style.display = "block";
  }
}