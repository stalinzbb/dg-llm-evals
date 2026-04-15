import type { AppProps } from "next/app";

import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/next";

import { TooltipProvider } from "@/components/ui/tooltip";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <TooltipProvider>
      <Component {...pageProps} />
      <Analytics />
    </TooltipProvider>
  );
}
