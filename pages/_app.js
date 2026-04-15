import "@/styles/globals.css";
import { Analytics } from '@vercel/analytics/next';
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App({ Component, pageProps }) {
  return (
    <TooltipProvider>
      <Component {...pageProps} />
      <Analytics />
    </TooltipProvider>
  );
}
