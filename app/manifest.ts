import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Malabar Coast",
    short_name: "Malabar Coast",
    description: "Indian Cuisine & Bar in Holytown, serving tandoor dishes, curries, biriyani and Malabar coastal specialities.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#071310",
    theme_color: "#071310",
    lang: "en-GB",
    categories: ["food", "restaurant", "shopping"],
    icons: [{src: "/malabar af.svg", sizes: "any", type: "image/svg+xml", purpose: "any"}],
  };
}
