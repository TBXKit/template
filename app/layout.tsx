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

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const webstore = await getWebstore();
  const description =
    webstore.description ||
    `Browse packages and categories at ${webstore.name}.`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: webstore.name,
      template: `%s | ${webstore.name}`,
    },
    description,
    icons: webstore.logo ? { icon: webstore.logo } : undefined,
    openGraph: {
      type: "website",
      url: "/",
      siteName: webstore.name,
      title: webstore.name,
      description,
      locale: webstore.lang || undefined,
    },
    twitter: {
      card: "summary_large_image",
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
      lang={webstore.lang || "en"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <Header webstore={webstore} categories={categories} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer siteName={webstore.name} />
      </body>
    </html>
  );
}
