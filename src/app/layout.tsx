import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Awake SA | Electric Surfboards South Africa",
  description: "Official Awake Boards distributor for South Africa. Premium RÄVIK Jetboards and VINGA eFoils.",
  keywords: ["electric surfboard", "eFoil", "jetboard", "Awake", "South Africa", "RÄVIK", "VINGA"],
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "https://awakesa.co.za",
    siteName: "Awake SA",
    title: "Awake SA | Electric Surfboards South Africa",
    description: "Premium RÄVIK Jetboards and VINGA eFoils now in South Africa.",
    images: [{ url: "https://awakeboards.com/cdn/shop/files/BRABUSx3.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-awake-black text-white antialiased font-sans">
        <QueryProvider>
          <Header />
          {children}
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
