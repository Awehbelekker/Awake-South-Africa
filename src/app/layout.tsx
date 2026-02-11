import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { QueryProvider } from "@/components/providers/QueryProvider";
import StructuredData from "@/components/StructuredData";
import { generateOrganizationSchema, generateWebsiteSchema } from "@/lib/seo/structured-data";

export const metadata: Metadata = {
  metadataBase: new URL("https://awakesa.co.za"),
  title: {
    default: "Awake SA | Electric Surfboards South Africa",
    template: "%s | Awake SA",
  },
  description: "Official Awake Boards distributor for South Africa. Premium RÄVIK Jetboards and VINGA eFoils.",
  keywords: ["electric surfboard", "eFoil", "jetboard", "Awake", "South Africa", "RÄVIK", "VINGA", "electric watercraft", "water sports"],
  authors: [{ name: "Awake SA" }],
  creator: "Awake SA",
  publisher: "Awake SA",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "https://awakesa.co.za",
    siteName: "Awake SA",
    title: "Awake SA | Electric Surfboards South Africa",
    description: "Premium RÄVIK Jetboards and VINGA eFoils now in South Africa.",
    images: [{ 
      url: "https://awakeboards.com/cdn/shop/files/BRABUSx3.png", 
      width: 1200, 
      height: 630,
      alt: "Awake Boards - Premium Electric Surfboards",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Awake SA | Electric Surfboards South Africa",
    description: "Premium RÄVIK Jetboards and VINGA eFoils now in South Africa.",
    images: ["https://awakeboards.com/cdn/shop/files/BRABUSx3.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  twitter: {
    card: "summary_large_image",
    title: "Awake SA | Electric Surfboards South Africa",
    description: "Premium RÄVIK Jetboards and VINGA eFoils now in South Africa.",
    images: ["https://awakeboards.com/cdn/shop/files/BRABUSx3.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();

  return (
    <html lang="en" className="dark">
      <head>
        <StructuredData data={organizationSchema} />
        <StructuredData data={websiteSchema} />
      </head>
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
