import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hemanth Kumar | AI/ML Engineer",
  description:
    "Portfolio of Hemanth Kumar Chittiprolu — AI/ML Engineer specializing in production systems, LLMs, RAG, and end-to-end machine learning pipelines. Available for hire.",
  keywords: [
    "AI Engineer",
    "ML Engineer",
    "Hemanth Kumar",
    "Portfolio",
    "LLM",
    "RAG",
    "Machine Learning",
    "Deep Learning",
    "NLP",
    "Computer Vision",
  ],
  authors: [{ name: "Hemanth Kumar Chittiprolu" }],
  openGraph: {
    title: "Hemanth Kumar | AI/ML Engineer",
    description:
      "Building production AI systems that ship. Talk to my AI avatar to learn more.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hemanth Kumar | AI/ML Engineer",
    description:
      "Building production AI systems that ship. Talk to my AI avatar to learn more.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
