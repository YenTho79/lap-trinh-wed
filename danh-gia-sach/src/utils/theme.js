export const getTheme = () => {
  return localStorage.getItem("theme") === "dark";
};

export const setTheme = (isDark) => {
  localStorage.setItem("theme", isDark ? "dark" : "light");

  if (isDark) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
};