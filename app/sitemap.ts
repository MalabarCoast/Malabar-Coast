import type {MetadataRoute} from "next";
import {listCareers} from "./lib/career-store";
import {careerSlug} from "./lib/careers";
import {absoluteUrl, pageLastUpdated} from "./lib/site";

const updated = (path: keyof typeof pageLastUpdated) => new Date(`${pageLastUpdated[path]}T00:00:00.000Z`);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    {url: absoluteUrl("/"), lastModified: updated("/"), changeFrequency: "weekly", priority: 1},
    {url: absoluteUrl("/menu"), lastModified: updated("/menu"), changeFrequency: "weekly", priority: .95},
    {url: absoluteUrl("/offers"), lastModified: updated("/offers"), changeFrequency: "daily", priority: .9},
    {url: absoluteUrl("/book-a-table"), lastModified: updated("/book-a-table"), changeFrequency: "weekly", priority: .95},
    {url: absoluteUrl("/restaurant"), lastModified: updated("/restaurant"), changeFrequency: "monthly", priority: .9},
    {url: absoluteUrl("/hall"), lastModified: updated("/hall"), changeFrequency: "monthly", priority: .9},
    {url: absoluteUrl("/careers"), lastModified: updated("/careers"), changeFrequency: "weekly", priority: .7},
    {url: absoluteUrl("/story"), lastModified: updated("/story"), changeFrequency: "monthly", priority: .75},
    {url: absoluteUrl("/story/calicut"), lastModified: updated("/story/calicut"), changeFrequency: "yearly", priority: .6},
    {url: absoluteUrl("/faq"), lastModified: updated("/faq"), changeFrequency: "monthly", priority: .8},
    {url: absoluteUrl("/payments"), lastModified: updated("/payments"), changeFrequency: "yearly", priority: .35},
    {url: absoluteUrl("/returns"), lastModified: updated("/returns"), changeFrequency: "yearly", priority: .35},
    {url: absoluteUrl("/cookie"), lastModified: updated("/cookie"), changeFrequency: "yearly", priority: .3},
    {url: absoluteUrl("/privacy"), lastModified: updated("/privacy"), changeFrequency: "yearly", priority: .3},
  ];

  try {
    const today = new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/London"}).format(new Date());
    const careers: MetadataRoute.Sitemap = (await listCareers())
      .filter((job) => job.status === "published" && (!job.closingDate || job.closingDate >= today))
      .map((job) => ({url: absoluteUrl(`/careers/${careerSlug(job)}`), lastModified: new Date(job.updatedAt), changeFrequency: "weekly" as const, priority: .65}));
    return [...pages, ...careers];
  } catch (error) {
    console.error("Career sitemap entries could not be loaded; returning the public page sitemap.", error instanceof Error ? error.name : "UnknownError");
    return pages;
  }
}
