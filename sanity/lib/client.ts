import {createClient} from "next-sanity";
import {sanityApiVersion, sanityConfigured, sanityDataset, sanityProjectId} from "../env";

let client: ReturnType<typeof createClient> | null | undefined;

export function getSanityClient() {
  if (!sanityConfigured) return null;
  if (client !== undefined) return client;

  // All application queries use the published perspective on the public
  // dataset. Keep the write token out of runtime reads so an expired or
  // mistyped migration credential cannot take the public CMS offline.
  client = createClient({
    projectId: sanityProjectId,
    dataset: sanityDataset,
    apiVersion: sanityApiVersion,
    perspective: "published",
    useCdn: true,
  });

  return client;
}
