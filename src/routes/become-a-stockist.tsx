import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { HeaderNavbar } from "@/components/HeaderNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { submitStockistApplication } from "@/lib/stockist-application.functions";

export const Route = createFileRoute("/become-a-stockist")({
  head: () => ({
    meta: [
      { title: "Become a Stockist | Maxspect UK" },
      {
        name: "description",
        content:
          "Apply to become a Maxspect UK stockist. Tell us about your business and the team will get back to you.",
      },
    ],
  }),
  component: BecomeStockistPage,
});

const fields = [
  {
    name: "organisation",
    label: "Business name",
    section: "Your business",
    placeholder: "e.g. Charterhouse Aquatics",
  },
  {
    name: "website",
    label: "Website",
    section: "Your business",
    placeholder: "e.g. www.example.co.uk",
    optional: true,
  },
  { name: "name", label: "Contact name", section: "Contact", placeholder: "e.g. Jane Smith" },
  {
    name: "email",
    label: "Email address",
    section: "Contact",
    type: "email",
    placeholder: "e.g. jane@example.co.uk",
  },
  {
    name: "tel",
    label: "Phone number",
    section: "Contact",
    type: "tel",
    placeholder: "e.g. 01507 600477",
  },
  {
    name: "house",
    label: "Unit / building",
    section: "Business address",
    placeholder: "e.g. Unit 2-3",
  },
  { name: "street", label: "Street", section: "Business address", placeholder: "e.g. Warwick Road" },
  { name: "town", label: "Town / city", section: "Business address", placeholder: "e.g. Louth" },
  { name: "county", label: "County", section: "Business address", placeholder: "e.g. Lincolnshire" },
  { name: "postcode", label: "Postcode", section: "Business address", placeholder: "e.g. LN11 0YB" },
] as const;

function BecomeStockistPage() {
  const submit = useServerFn(submitStockistApplication);
  const [pending, setPending] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const sections = [...new Set(fields.map((field) => field.section))];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) || "");
    setPending(true);
    setIssues([]);
    try {
      const result = await submit({
        data: {
          organisation: value("organisation"),
          website: value("website"),
          name: value("name"),
          email: value("email"),
          tel: value("tel"),
          house: value("house"),
          street: value("street"),
          town: value("town"),
          county: value("county"),
          postcode: value("postcode"),
          message: value("message"),
          bottest: value("bottest"),
        },
      });
      if (result.success) {
        event.currentTarget.reset();
        setSent(true);
      } else {
        setIssues(result.issues);
      }
    } catch {
      setIssues(["The application could not be sent. Please try again."]);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <HeaderNavbar />
      <main className="flex-1 flex flex-col">
        <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 py-10 lg:py-14">
          <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
            <Link
              to="/stockists"
              className="text-sm font-semibold tracking-wide text-cyan-400 hover:text-cyan-300"
            >
              Find a stockist
            </Link>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Become a Stockist
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300">
              If you have a pet shop or other outlet in the UK or abroad, tell us about the business.
              One of the team will get back to you.
            </p>
          </Reveal>
        </section>

        <section className="flex-1 bg-white text-slate-900 border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {sections.map((section, index) => (
                <Reveal key={section} delay={index * 80}>
                <fieldset className="space-y-4">
                  <legend className="text-sm font-bold text-slate-900">{section}</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fields
                      .filter((field) => field.section === section)
                      .map((field) => (
                        <label key={field.name} className="block space-y-1">
                          <span className="text-xs font-semibold text-slate-700">{field.label}</span>
                          <input
                            name={field.name}
                            type={"type" in field ? field.type : "text"}
                            placeholder={field.placeholder}
                            required={!("optional" in field)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                          />
                        </label>
                      ))}
                  </div>
                </fieldset>
                </Reveal>
              ))}

              <Reveal delay={sections.length * 80}>
              <fieldset className="space-y-4">
                <legend className="text-sm font-bold text-slate-900">About your business</legend>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-slate-700">
                    Tell us about your company
                  </span>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    placeholder="e.g. Marine shop in Hertford, open Monday to Saturday, looking to stock Gyre and Jump."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                </label>
              </fieldset>
              </Reveal>

              <input name="bottest" type="text" tabIndex={-1} autoComplete="off" className="hidden" />

              {sent && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Your stockist application was sent. One of the team will get back to you.
                </p>
              )}
              {issues.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-1">
                  <p className="font-semibold">Please check the following issues:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Reveal>
              <button
                type="submit"
                disabled={pending}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-white font-bold text-xs transition-colors"
              >
                {pending ? "Sending…" : "Apply"}
              </button>
              </Reveal>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
