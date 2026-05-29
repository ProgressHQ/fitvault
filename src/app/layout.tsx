import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PPV Exercise Library",
  description: "Pay-per-view professional exercise video demonstrations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="mkt-nav">
          <a href="/" className="mkt-logo">
            <span className="mkt-logo-mark">PPV</span>
            <span className="mkt-logo-name">Exercise Library</span>
          </a>
          <nav>
            <ul className="mkt-links">
              <li><a href="/">Browse</a></li>
              <li><a href="/contributor">Contribute</a></li>
              <li><a href="/admin">Admin</a></li>
            </ul>
          </nav>
        </header>
        <div className="ppv-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
