import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { findRegisterableProduct } from "./catalog-tree";

const registrationInput = z.object({
  slug: z.string().min(1),
  serial: z.string(),
  shop: z.string(),
  date: z.string(),
  name: z.string(),
  email: z.string(),
  tel: z.string(),
  house: z.string(),
  street: z.string(),
  town: z.string(),
  county: z.string(),
  postcode: z.string(),
  bottest: z.string(),
});

export interface RegistrationResult {
  success: boolean;
  issues: string[];
}

export const submitProductRegistration = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof registrationInput>) => registrationInput.parse(input))
  .handler(async ({ data }): Promise<RegistrationResult> => {
    const product = findRegisterableProduct(data.slug);
    if (!product) {
      return { success: false, issues: ["That product is not available to register."] };
    }
    if (data.bottest.trim()) {
      return { success: true, issues: [] };
    }

    const body = new URLSearchParams({
      subject: `Register My ${product.title}`,
      serial: data.serial,
      shop: data.shop,
      date: data.date,
      name: data.name,
      email: data.email,
      tel: data.tel,
      house: data.house,
      street: data.street,
      town: data.town,
      county: data.county,
      postcode: data.postcode,
      bottest: data.bottest,
    });

    const response = await fetch("https://maxspect.co.uk/controls/register-product-form.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const payload = (await response.json()) as { success?: boolean; issuesStr?: string };
    if (payload.success) return { success: true, issues: [] };

    const issues = (payload.issuesStr || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .split("\n")
      .map((line) => line.replace(/^•\s*/, "").trim())
      .filter(Boolean);
    return {
      success: false,
      issues: issues.length > 0 ? issues : ["The registration could not be sent. Please try again."],
    };
  });
