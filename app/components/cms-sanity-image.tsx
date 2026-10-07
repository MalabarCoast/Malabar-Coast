"use client";

import Image from "next/image";
import type {SyntheticEvent} from "react";
import {getCmsImageUrl, type CmsImageSource} from "@/sanity/lib/image";

const DEFAULT_FALLBACK = "/restaurant/dining-room.png";

function applyFallback(event: SyntheticEvent<HTMLImageElement>, originalUrl: string, localFallback: string) {
  const image = event.currentTarget;
  if (!image.dataset.fallbackStage && image.src !== originalUrl) {
    image.dataset.fallbackStage = "original";
    image.src = originalUrl;
    return;
  }
  if (image.dataset.fallbackStage !== "local") {
    image.dataset.fallbackStage = "local";
    image.src = localFallback;
  }
}

export function CmsSanityImage({
  image,
  width,
  alt,
  sizes,
  className,
  eager = false,
  fallbackSrc = DEFAULT_FALLBACK,
}: {
  image: CmsImageSource;
  width: number;
  alt: string;
  sizes: string;
  className?: string;
  eager?: boolean;
  fallbackSrc?: string;
}) {
  const source = getCmsImageUrl(image, width) || fallbackSrc;

  return <Image
    className={className}
    src={source}
    alt={alt}
    fill
    sizes={sizes}
    unoptimized
    loading={eager ? "eager" : "lazy"}
    fetchPriority={eager ? "high" : "auto"}
    onError={(event) => applyFallback(event, image.url || fallbackSrc, fallbackSrc)}
  />;
}
