import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { HeaderNavbar } from "@/components/HeaderNavbar";
import { SiteFooter } from "@/components/SiteFooter";

const policies = [
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/cookies", label: "Cookie Policy" },
  { to: "/terms", label: "Terms of Use" },
] as const;

export function PolicyLayout({
  title,
  description,
  updated,
  children,
}: {
  title: string;
  description: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <HeaderNavbar />
      <main className="flex-1">
        <section className="border-b border-slate-800 bg-slate-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-3">
            <p className="text-xs font-bold tracking-wide text-cyan-300">BCUK Aquatics Limited</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{title}</h1>
            <p className="text-sm text-slate-400 max-w-2xl">{description}</p>
            <p className="text-xs text-slate-500">Last updated {updated}</p>
          </div>
        </section>

        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8 text-sm leading-relaxed text-slate-300 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_h2]:pt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-cyan-300 [&_a]:hover:text-cyan-200">
          {children}
        </article>

        <nav className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {policies.map((policy) => (
              <li key={policy.to}>
                <Link to={policy.to} className="text-slate-400 hover:text-cyan-300">
                  {policy.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}
