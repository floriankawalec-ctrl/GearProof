import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gearproof-test.sites.chatgpt.com"),
  title: "GearProof — test your gear and prove the result",
  description: "Test your mouse, keyboard, controller, headphones and microphone directly in the browser.",
  openGraph: { title: "GearProof", description: "Test your gear. Prove the result.", images: ["/og.png"], locale: "en_US", type: "website" },
  twitter: { card: "summary_large_image", title: "GearProof", description: "Test your gear. Prove the result.", images: ["/og.png"] },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
