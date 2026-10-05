import type { Metadata } from "next";
import "./admin.css";
import {AdminPwaRegistration} from "./components/admin-pwa-registration";

export const metadata: Metadata = {
  title: "Restaurant Operations",
  manifest: "/admin/manifest.webmanifest",
  applicationName: "Malabar Coast Restaurant Operations",
  appleWebApp: {capable: true, title: "MC Operations", statusBarStyle: "black-translucent"},
  icons: {
    icon: [{url: "/icon-192.png", type: "image/png", sizes: "192x192"}, {url: "/icon-512.png", type: "image/png", sizes: "512x512"}],
    apple: [{url: "/icon-192.png", type: "image/png", sizes: "192x192"}],
  },
  robots: { index: false, follow: false, noarchive: true, nosnippet: true, noimageindex: true },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><AdminPwaRegistration/>{children}</>;
}
