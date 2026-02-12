import "@/styles/global.css";
import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";

export const metadata = {
  title: "LLM Arena",
  description: "An elegant hub to launch LLM vs LLM matches",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <div className="container-padded py-10">{children}</div>
            </main>
            <Footer />
          </div>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
