import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyLayout } from "@/components/PolicyLayout";
import { contact } from "@/lib/contact";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy | Maxspect UK" },
      {
        name: "description",
        content: "How the Maxspect UK website, operated by BCUK Aquatics Limited, uses cookies.",
      },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <PolicyLayout
      title="Cookie Policy"
      description="What cookies this website uses, and how you can control them."
      updated="7 October 2026"
    >
      <section className="space-y-3">
        <h2>What cookies are</h2>
        <p>
          Cookies are small text files that a website can store on your device. Some are needed for a
          page to work. Others remember preferences, or measure how a site is used. Similar
          technologies, such as local storage, can do the same job.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Cookies on this website</h2>
        <p>
          This website is operated by BCUK Aquatics Limited. The public pages do not set advertising
          cookies, and we do not use a third-party analytics service that tracks you across other
          websites.
        </p>
        <p>The only cookies we would set ourselves are strictly necessary ones, for example:</p>
        <ul>
          <li>a cookie that remembers a choice you have made on the site, such as a menu state;</li>
          <li>a security cookie used to protect a form from automated abuse.</li>
        </ul>
        <p>
          Browsing product pages, manuals, stockists, and policies does not require a marketing
          cookie. If we later add optional cookies, we will ask for your consent before they are set
          and update this page.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Other websites</h2>
        <p>
          Some links leave this site. Product manuals open files on maxspect.com. The Syna-G app
          buttons open the Apple App Store or Google Play. Patent pages open on maxspect.com. Those
          sites set their own cookies, which we do not control. Their own policies explain what they
          store.
        </p>
      </section>

      <section className="space-y-3">
        <h2>How to control cookies</h2>
        <p>
          You can block or delete cookies in your browser settings. Blocking strictly necessary
          cookies can stop parts of a site from working. Guidance is available from your browser
          provider, and from the Information Commissioner’s Office at{" "}
          <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">
            ico.org.uk
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2>More information</h2>
        <p>
          How we use personal information is explained in our <Link to="/privacy">Privacy Policy</Link>.
          Questions about cookies can be sent to{" "}
          <a href={`mailto:${contact.email}`}>{contact.email}</a>.
        </p>
      </section>
    </PolicyLayout>
  );
}
