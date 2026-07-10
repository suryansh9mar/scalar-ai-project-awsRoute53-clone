"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { applyMode, Mode } from "@cloudscape-design/global-styles";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("aws-theme") as Theme | null;
    const initial = stored === "dark" || stored === "light" ? stored : "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    applyMode(initial === "dark" ? Mode.Dark : Mode.Light);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("aws-theme", next);
      document.documentElement.setAttribute("data-theme", next);
      applyMode(next === "dark" ? Mode.Dark : Mode.Light);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
