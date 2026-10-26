import {NextResponse} from "next/server";
import publicManifest from "../lib/public-manifest";

export function GET() {
  return NextResponse.json(publicManifest(), {headers: {"Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=0, must-revalidate"}});
}
