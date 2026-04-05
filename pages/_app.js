import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/layout.css";
import "@/styles/globals.css";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const storedTheme =
      typeof window !== "undefined" ? window.localStorage.getItem("dg-evals-theme") : null;
    const theme = storedTheme || "light";
    document.documentElement.dataset.theme = theme;
  }, []);

  return <Component {...pageProps} />;
}
