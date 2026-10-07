import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const applicationInput = z.object({
  organisation: z.string(),
  website: z.string(),
  name: z.string(),
  email: z.string(),
  tel: z.string(),
  house: z.string(),
  street: z.string(),
  town: z.string(),
  county: z.string(),
  postcode: z.string(),
  message: z.string(),
  bottest: z.string(),
});

export interface StockistApplicationResult {
  success: boolean;
  issues: string[];
}

export const submitStockistApplication = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof applicationInput>) => applicationInput.parse(input))
  .handler(async ({ data }): Promise<StockistApplicationResult> => {
    if (data.bottest.trim()) {
      return { success: true, issues: [] };
    }

    const required: Array<[string, string]> = [
      ["organisation", "Business name"],
      ["name", "Contact name"],
      ["email", "Email address"],
      ["tel", "Phone number"],
      ["house", "Unit / building"],
      ["street", "Street"],
      ["town", "Town / city"],
      ["county", "County"],
      ["postcode", "Postcode"],
      ["message", "About your business"],
    ];
    const issues = required
      .filter(([key]) => !data[key as keyof typeof data].trim())
      .map(([, label]) => `${label} is required.`);
    if (data.email.trim() && !data.email.includes("@")) {
      issues.push("Enter a valid email address.");
    }
    if (issues.length > 0) return { success: false, issues };

    const address = [data.house, data.street, data.town, data.county, data.postcode]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");
    const message = [
      `Business: ${data.organisation.trim()}`,
      data.website.trim() ? `Website: ${data.website.trim()}` : "",
      `Address: ${address}`,
      "",
      data.message.trim(),
    ]
      .filter((line) => line !== "")
      .join("\n");

    const body = new URLSearchParams({
      subject: "I'm interested in becoming a stockist",
      name: data.name.trim(),
      email: data.email.trim(),
      tel: data.tel.trim(),
      message,
      bottest: data.bottest,
    });

    const response = await fetch("https://maxspect.co.uk/controls/contact-form.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const payload = (await response.json()) as { success?: boolean };
    if (payload.success) return { success: true, issues: [] };
    return {
      success: false,
      issues: ["The application could not be sent. Please try again."],
    };
  });
