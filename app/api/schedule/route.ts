import {getRestaurantSchedule} from "../../lib/schedule-store";
import {noStoreJson} from "../../lib/security";

export const dynamic = "force-dynamic";
export async function GET() {
  try { return noStoreJson({schedule: await getRestaurantSchedule()}); }
  catch { return noStoreJson({error: "Opening times are temporarily unavailable."}, {status: 503}); }
}
