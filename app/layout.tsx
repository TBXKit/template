import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getCategories, getWebstore } from "@/lib/tebex";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const webstore = await getWebstore();

  return {
    title: {
      default: webstore.name,
      template: `%s | ${webstore.name}`,
    },
    description: webstore.description || undefined,
    icons: webstore.logo ? { icon: webstore.logo } : undefined,
    openGraph: {
      siteName: webstore.name,
      title: webstore.name,
      description: webstore.description || undefined,
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [webstore, categories] = await Promise.all([
    getWebstore(),
    getCategories(),
  ]);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Header webstore={webstore} categories={categories} />
        <main className="flex-1">{children}</main>
        <Footer siteName={webstore.name} />
      </body>
    </html>
  );
}
