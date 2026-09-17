export type CareerStatus = "draft" | "published" | "closed";
export type CareerOpportunity = {
  id: string;
  slug?: string;
  title: string;
  team: string;
  location: string;
  employmentType: string;
  hours: string;
  pay: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  salaryUnit?: "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
  summary: string;
  responsibilities: string;
  skills: string;
  benefits: string;
  applicationEmail: string;
  closingDate: string;
  status: CareerStatus;
  createdAt: string;
  updatedAt: string;
};

export function slugifyCareer(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 96);
}

export function careerSlug(job: Pick<CareerOpportunity, "slug" | "title" | "id">) {
  return job.slug || `${slugifyCareer(job.title)}-${job.id.slice(-8).toLowerCase()}`;
}

export function validateCareer(value: unknown): Omit<CareerOpportunity, "id" | "createdAt" | "updatedAt"> {
  if (!value || typeof value !== "object") throw new Error("Job details are missing.");
  const input = value as Record<string, unknown>;
  const field = (name: string, max: number, required = false) => {
    const result = String(input[name] || "").trim();
    if (required && !result) throw new Error(`${name} is required.`);
    if (result.length > max) throw new Error(`${name} is too long.`);
    return result;
  };
  const status = field("status", 12) as CareerStatus;
  if (!["draft", "published", "closed"].includes(status)) throw new Error("Choose a valid job status.");
  const applicationEmail = field("applicationEmail", 160, true).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(applicationEmail)) throw new Error("Enter a valid application email.");
  const closingDate = field("closingDate", 10);
  if (closingDate && !/^\d{4}-\d{2}-\d{2}$/.test(closingDate)) throw new Error("Choose a valid closing date.");
  const title = field("title", 120, true);
  const slug = field("slug", 96) || slugifyCareer(title);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Use a lowercase URL slug with words separated by hyphens.");
  const optionalMoney = (name: string) => {
    const raw = field(name, 16);
    if (!raw) return null;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) throw new Error(`${name} must be a valid positive amount.`);
    return amount;
  };
  const salaryMin = optionalMoney("salaryMin");
  const salaryMax = optionalMoney("salaryMax");
  if (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin) throw new Error("Maximum salary must not be lower than minimum salary.");
  const salaryCurrency = (field("salaryCurrency", 3) || "GBP").toUpperCase();
  if (!/^[A-Z]{3}$/.test(salaryCurrency)) throw new Error("Use a three-letter salary currency.");
  const salaryUnit = (field("salaryUnit", 8) || "HOUR") as CareerOpportunity["salaryUnit"];
  if (!salaryUnit || !["HOUR", "DAY", "WEEK", "MONTH", "YEAR"].includes(salaryUnit)) throw new Error("Choose a valid salary unit.");
  return {slug, title, team: field("team", 80), location: field("location", 120, true), employmentType: field("employmentType", 80, true), hours: field("hours", 100), pay: field("pay", 120), salaryMin, salaryMax, salaryCurrency, salaryUnit, summary: field("summary", 1000, true), responsibilities: field("responsibilities", 4000), skills: field("skills", 4000, true), benefits: field("benefits", 2000), applicationEmail, closingDate, status};
}
