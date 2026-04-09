import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/globals.css";
import "@/styles/layout.css";
import { Analytics } from '@vercel/analytics/next';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
