import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "../lib/AuthContext";
import Navbar from "../components/shared/Navbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Exness Trading Simulator",
  description: "Professional trading simulator with real-time market data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} bg-[#0a0e13] h-screen`}>
        <AuthProvider>
          <Navbar/>
          <main className="h-[93%]">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
