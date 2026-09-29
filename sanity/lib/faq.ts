import {faqItems as fallbackFaqItems} from "@/app/lib/faq";
import {getSanityClient} from "./client";
import {faqItemsQuery} from "./queries";

export type FaqItem = {id: string; question: string; answer: string; category?: string};

const checkedInFaqByQuestion = new Map<string, (typeof fallbackFaqItems)[number]>(
  fallbackFaqItems.map((item) => [item.question, item]),
);
const checkedInAnswerIds = new Set(["what-is-malabar-coast", "what-cuisine", "gluten-free-options", "food-allergies"]);

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function getFaqItems(): Promise<FaqItem[]> {
  const client = getSanityClient();
  if (!client) return [...fallbackFaqItems];
  try {
    const items = await client.fetch(faqItemsQuery, {}, {next: {revalidate: 60, tags: ["sanity-faq"]}}) as Array<Omit<FaqItem, "id">>;
    return items?.length ? items.map((item) => {
      const checkedIn = checkedInFaqByQuestion.get(item.question);
      const id = checkedIn?.id || slugify(item.question);
      return checkedIn && checkedInAnswerIds.has(checkedIn.id)
        ? {...item, question: checkedIn.question, answer: checkedIn.answer, id}
        : {...item, id};
    }) : [...fallbackFaqItems];
  } catch (error) {
    console.error("Sanity FAQ fetch failed; using checked-in answers.", error instanceof Error ? error.name : "UnknownError");
    return [...fallbackFaqItems];
  }
}
