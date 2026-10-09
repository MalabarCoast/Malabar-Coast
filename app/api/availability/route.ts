import {getServiceAvailability} from "../../lib/service-availability-store";
import {publicServiceAvailability, restaurantLocalDateTime} from "../../lib/service-availability";
import {noStoreJson} from "../../lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const availability = await getServiceAvailability();
    return noStoreJson({at: restaurantLocalDateTime(), channels: publicServiceAvailability(availability)});
  } catch {
    return noStoreJson({error: "Live service availability could not be checked."}, {status: 503});
  }
}
