import {NextResponse} from "next/server";

export function GET() {
  return NextResponse.json({
    id: "/admin/",
    name: "Malabar Coast Restaurant Operations",
    short_name: "MC Operations",
    description: "Secure restaurant operations for orders, kitchen, tables, hall enquiries and reporting.",
    start_url: "/admin/",
    scope: "/admin/",
    display: "standalone",
    background_color: "#f3efe6",
    theme_color: "#071310",
    lang: "en-GB",
    categories: ["business", "food", "productivity"],
    icons: [{src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any"}, {src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any"}, {src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable"}],
    shortcuts: [
      {name: "Orders", short_name: "Orders", url: "/admin/orders", icons: [{src: "/icon-192.png", sizes: "192x192", type: "image/png"}]},
      {name: "Kitchen", short_name: "Kitchen", url: "/admin/kitchen", icons: [{src: "/icon-192.png", sizes: "192x192", type: "image/png"}]},
      {name: "Tables", short_name: "Tables", url: "/admin/reservations", icons: [{src: "/icon-192.png", sizes: "192x192", type: "image/png"}]},
      {name: "Calendar", short_name: "Calendar", url: "/admin/schedule", icons: [{src: "/icon-192.png", sizes: "192x192", type: "image/png"}]},
    ],
  }, {headers: {"Content-Type": "application/manifest+json", "Cache-Control": "no-store"}});
}
