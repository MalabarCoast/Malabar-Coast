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
    icons: [{src: "/malabar af.svg", sizes: "any", type: "image/svg+xml", purpose: "any"}],
    shortcuts: [
      {name: "Orders", short_name: "Orders", url: "/admin/orders", icons: [{src: "/malabar af.svg", sizes: "any", type: "image/svg+xml"}]},
      {name: "Kitchen", short_name: "Kitchen", url: "/admin/kitchen", icons: [{src: "/malabar af.svg", sizes: "any", type: "image/svg+xml"}]},
      {name: "Tables", short_name: "Tables", url: "/admin/reservations", icons: [{src: "/malabar af.svg", sizes: "any", type: "image/svg+xml"}]},
      {name: "Calendar", short_name: "Calendar", url: "/admin/schedule", icons: [{src: "/malabar af.svg", sizes: "any", type: "image/svg+xml"}]},
    ],
  }, {headers: {"Content-Type": "application/manifest+json", "Cache-Control": "no-store"}});
}
