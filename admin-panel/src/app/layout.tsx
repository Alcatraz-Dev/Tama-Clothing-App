import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import AdminShell from "@/components/AdminShell";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Tama Clothing | Admin Dashboard",
  description: "Premium fashion e-commerce administration panel for Tama Clothing Tunisia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={outfit.className}>
        <AuthProvider>
          <LanguageProvider>
            <AdminShell>
              {children}
            </AdminShell>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}



