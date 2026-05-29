import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitVault",
  description: "Professional exercise video library",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="mkt-nav">
          <a href="/" className="mkt-logo">
            <span className="mkt-logo-mark">FV</span>
            <span className="mkt-logo-name">FitVault</span>
          </a>
          <nav>
            <ul className="mkt-links">
              <li><a href="/">Browse</a></li>
              <li><a href="/contributor">Contribute</a></li>
              <li><a href="/admin">Admin</a></li>
            </ul>
          </nav>
        </header>
        <div className="fitvault-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
