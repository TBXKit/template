import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { StoreDisabledBanner } from "@/components/store-disabled-banner";
import { SITE_URL } from "@/lib/site";
import { getCategories, getWebstore } from "@/lib/tebex";
import { getCurrentBasket, getCurrentUsername } from "@/lib/tebex/session";
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
  const description =
    webstore.description ||
    `Browse packages and categories at ${webstore.name}.`;

  return {
    metadataBase: new URL(SITE_URL),
    // Routes without their own generateMetadata (e.g. the homepage) inherit
    // `default` for <title>; routes that set their own `title` get it
    // wrapped by `template` instead.
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
  const [webstore, categories, basket, storedUsername] = await Promise.all([
    getWebstore(),
    getCategories(),
    getCurrentBasket(),
    getCurrentUsername(),
  ]);
  // Feeds the header's basket-count badge — see components/header.tsx.
  const itemCount =
    basket?.packages.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  // `basket.username` (set at creation time, confirmed unchangeable after —
  // see lib/tebex/index.ts's createBasket) is authoritative once a basket
  // exists; `storedUsername` is only the pre-basket signal for a visitor
  // who's logged in but hasn't triggered a basket yet.
  const username = basket?.username ?? storedUsername;

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
        {webstore.disabled ? <StoreDisabledBanner /> : null}
        <Header
          webstore={webstore}
          categories={categories}
          itemCount={itemCount}
          username={username}
        />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer
          siteName={webstore.name}
          platformType={webstore.platform_type}
          discordUrl={process.env.DISCORD_URL}
        />
      </body>
    </html>
  );
}
