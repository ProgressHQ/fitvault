import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PPV Exercise Library",
  description: "Pay-per-view professional exercise video demonstrations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-indigo-600">PPV</span>
              <span className="text-xl font-semibold text-gray-800">Exercise Library</span>
            </a>
            <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="/" className="hover:text-indigo-600 transition-colors">Browse</a>
              <a href="/contributor" className="hover:text-indigo-600 transition-colors">Contribute</a>
              <a href="/admin" className="hover:text-indigo-600 transition-colors text-gray-400">Admin</a>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
