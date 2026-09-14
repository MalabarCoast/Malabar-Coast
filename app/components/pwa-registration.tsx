"use client";
import {usePathname} from "next/navigation";
import {useEffect} from "react";

export function PwaRegistration() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith("/admin") || !("serviceWorker" in navigator)) return;
    const register = () => {void navigator.serviceWorker.register("/sw.js", {scope: "/"}).catch(() => undefined);};
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, {once: true});
    return () => window.removeEventListener("load", register);
  }, [pathname]);
  return null;
}
