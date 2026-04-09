import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var theme = window.localStorage.getItem("dg-evals-theme") || "light";
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.classList.toggle("dark", theme === "dark");

                  var collapsed = window.localStorage.getItem("dg-sidebar-collapsed");
                  document.documentElement.dataset.sidebarCollapsed = collapsed === "true" ? "true" : "false";
                } catch (error) {
                  document.documentElement.dataset.theme = "light";
                  document.documentElement.classList.remove("dark");
                  document.documentElement.dataset.sidebarCollapsed = "false";
                }
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
