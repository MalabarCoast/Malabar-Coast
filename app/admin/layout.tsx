import type { Metadata } from "next";
import "./admin.css";
import {AdminPwaRegistration} from "./components/admin-pwa-registration";

export const metadata: Metadata = {
  title: "Restaurant Operations",
  manifest: "/admin/manifest.webmanifest",
  applicationName: "Malabar Coast Restaurant Operations",
  appleWebApp: {capable: true, title: "MC Operations", statusBarStyle: "black-translucent"},
  icons: {icon: "/icon-192.png", apple: "/icon-192.png"},
  robots: { index: false, follow: false, noarchive: true, nosnippet: true, noimageindex: true },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><AdminPwaRegistration/>{children}</>;
}
