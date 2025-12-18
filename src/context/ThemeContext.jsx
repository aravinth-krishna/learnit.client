import { useEffect, useState } from "react";
import { ThemeContext } from "./themeContext.js";

export const ThemeProvider = ({ children }) => {
  const getSystemPrefersDark = () => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const [themeSource, setThemeSource] = useState(() => {
    // If user explicitly chose a theme before, we persist it.
    // Otherwise we follow system preference.
    const saved = localStorage.getItem("darkMode");
    return saved ? "user" : "system";
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : getSystemPrefersDark();
  });

  useEffect(() => {
    if (themeSource !== "system" || typeof window === "undefined") return;
    if (!window.matchMedia) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setIsDarkMode(!!e.matches);

    // Ensure we're aligned immediately.
    setIsDarkMode(!!media.matches);

    if (media.addEventListener) media.addEventListener("change", handler);
    else media.addListener(handler);

    return () => {
      if (media.removeEventListener)
        media.removeEventListener("change", handler);
      else media.removeListener(handler);
    };
  }, [themeSource]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );

    // Persist only if user explicitly chose a theme.
    if (themeSource === "user") {
      localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
    } else {
      localStorage.removeItem("darkMode");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setThemeSource("user");
    setIsDarkMode((prev) => !prev);
  };

  const setDarkMode = (enabled) => {
    setThemeSource("user");
    setIsDarkMode(enabled);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        setDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
