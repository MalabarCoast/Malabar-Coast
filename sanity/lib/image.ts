import {createImageUrlBuilder, type SanityImageSource} from "@sanity/image-url";
import {sanityConfigured, sanityDataset, sanityProjectId} from "../env";

const builder = sanityConfigured
  ? createImageUrlBuilder({projectId: sanityProjectId, dataset: sanityDataset})
  : null;

type CmsImageSource = {
  asset?: {_ref?: string};
  url?: string;
  crop?: {top: number; bottom: number; left: number; right: number};
  hotspot?: {x: number; y: number; height: number; width: number};
};

export function getCmsImageUrl(source: CmsImageSource | undefined, width: number) {
  if (!source?.url) return "";
  if (!builder || !source.asset?._ref) return source.url;

  return builder
    .image(source as SanityImageSource)
    .width(width)
    .fit("max")
    .auto("format")
    .quality(82)
    .url();
}
