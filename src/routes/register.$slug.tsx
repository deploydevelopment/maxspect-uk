import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { HeaderNavbar } from "@/components/HeaderNavbar";
import { SiteFooter } from "@/components/SiteFooter";
import { findRegisterableProduct } from "@/lib/catalog-tree";
import { submitProductRegistration } from "@/lib/register.functions";

export const Route = createFileRoute("/register/$slug")({
  loader: ({ params }) => {
    const product = findRegisterableProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Register Your ${loaderData.product.title} | Maxspect UK`
          : "Register a Product | Maxspect UK",
      },
      {
        name: "description",
        content: "Register your Maxspect product for a 12 month extended warranty.",
      },
    ],
  }),
  component: RegisterProductPage,
});

const fields = [
  { name: "serial", label: "Serial Number", section: "Product details", placeholder: "e.g. MS123456" },
  { name: "shop", label: "Place of Purchase", section: "Product details", placeholder: "e.g. Charterhouse Aquatics" },
  { name: "date", label: "Date of Purchase", section: "Product details", type: "date", placeholder: "DD/MM/YYYY" },
  { name: "name", label: "Your Name", section: "About you", placeholder: "e.g. Jane Smith" },
  { name: "email", label: "Your Email Address", section: "About you", type: "email", placeholder: "e.g. jane@example.co.uk" },
  { name: "tel", label: "Your Phone Number", section: "About you", type: "tel", placeholder: "e.g. 01507 600477" },
  { name: "house", label: "House Name/No.", section: "Your address", placeholder: "e.g. 12" },
  { name: "street", label: "Street", section: "Your address", placeholder: "e.g. Warwick Road" },
  { name: "town", label: "Town/City", section: "Your address", placeholder: "e.g. Louth" },
  { name: "county", label: "County", section: "Your address", placeholder: "e.g. Lincolnshire" },
  { name: "postcode", label: "Postcode", section: "Your address", placeholder: "e.g. LN11 0YB" },
] as const;

function RegisterProductPage() {
  const { product } = Route.useLoaderData();
  const submit = useServerFn(submitProductRegistration);
  const [pending, setPending] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) || "");
    setPending(true);
    setIssues([]);
    try {
      const result = await submit({
        data: {
          slug: product.slug,
          serial: value("serial"),
          shop: value("shop"),
          date: value("date"),
          name: value("name"),
          email: value("email"),
          tel: value("tel"),
          house: value("house"),
          street: value("street"),
          town: value("town"),
          county: value("county"),
          postcode: value("postcode"),
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
      setIssues(["The registration could not be sent. Please try again."]);
    } finally {
      setPending(false);
    }
  };

  const sections = [...new Set(fields.map((field) => field.section))];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <HeaderNavbar />
      <main className="flex-1 flex flex-col">
        <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 py-10 lg:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
            <Link
              to="/register"
              className="text-sm font-semibold tracking-wide text-cyan-400 hover:text-cyan-300"
            >
              All products
            </Link>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Register Your {product.title}
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300">
              Fill in the form below to register your product for a 12 month extended warranty. After
              sending this form, you may be contacted by email about upcoming promotions. You can opt
              out of those emails at any time.
            </p>
          </div>
        </section>

        <section className="flex-1 bg-white text-slate-900 border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {sections.map((section) => (
              <fieldset key={section} className="space-y-4">
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
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
                        />
                      </label>
                    ))}
                </div>
              </fieldset>
            ))}

            <input name="bottest" type="text" tabIndex={-1} autoComplete="off" className="hidden" />

            {sent && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Your product registration request was sent successfully. You will be sent an email
                confirmation shortly.
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

            <button
              type="submit"
              disabled={pending}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-white font-bold text-xs transition-colors"
            >
              {pending ? "Sending…" : "Register"}
            </button>
          </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
