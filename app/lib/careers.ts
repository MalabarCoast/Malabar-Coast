export type CareerStatus = "draft" | "published" | "closed";
export type CareerOpportunity = {
  id: string;
  title: string;
  team: string;
  location: string;
  employmentType: string;
  hours: string;
  pay: string;
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
  return {title: field("title", 120, true), team: field("team", 80), location: field("location", 120, true), employmentType: field("employmentType", 80, true), hours: field("hours", 100), pay: field("pay", 120), summary: field("summary", 1000, true), responsibilities: field("responsibilities", 4000), skills: field("skills", 4000, true), benefits: field("benefits", 2000), applicationEmail, closingDate, status};
}
