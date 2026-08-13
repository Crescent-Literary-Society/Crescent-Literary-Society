// theme.js
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");
  
  // Check local storage or system preference
  const currentTheme = localStorage.getItem("theme");
  
  if (currentTheme) {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", (e) => {
      e.preventDefault();
      let theme = document.documentElement.getAttribute("data-theme");
      let newTheme = theme === "light" ? "dark" : "light";
      
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }
});
