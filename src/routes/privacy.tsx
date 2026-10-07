import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyLayout } from "@/components/PolicyLayout";
import { contact } from "@/lib/contact";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Maxspect UK" },
      {
        name: "description",
        content:
          "How BCUK Aquatics Limited collects and uses personal information on the Maxspect UK website.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      description="How BCUK Aquatics Limited handles personal information collected through this website."
      updated="7 October 2026"
    >
      <section className="space-y-3">
        <h2>Who we are</h2>
        <p>
          This website is operated by BCUK Aquatics Limited, the official United Kingdom distributor
          of Maxspect aquarium products. We are a company registered in England and Wales (company
          number 06524182). Our address is Unit 2-3, Warwick Road, Fairfield Industrial Estate, Louth,
          Lincolnshire, LN11 0YB.
        </p>
        <p>
          For the personal information described in this policy, BCUK Aquatics Limited is the data
          controller. You can contact us at{" "}
          <a href={`mailto:${contact.email}`}>{contact.email}</a> or on{" "}
          <a href={`tel:${contact.phone.tel}`}>{contact.phone.display}</a>.
        </p>
        <p>
          Maxspect product names, imagery, and manuals remain the property of their owners. We publish
          them here so UK customers and retailers can find support for the products we distribute.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Information we collect</h2>
        <p>We collect personal information that you choose to give us, and a small amount of technical information when you use the site.</p>
        <ul>
          <li>
            Enquiry details: your name, email address, telephone number, company or store name, the
            type of enquiry, and the message you send through the contact form, by email, or by phone.
          </li>
          <li>
            Warranty registration details: the product, serial number, retailer, purchase date, and
            your name, email address, telephone number, and postal address.
          </li>
          <li>
            Technical information: the pages you request, your browser type, and your IP address, as
            recorded in ordinary server logs used to keep the site secure and working.
          </li>
        </ul>
        <p>
          We do not ask you to create an account to browse the site, and we do not sell personal
          information.
        </p>
      </section>

      <section className="space-y-3">
        <h2>How we use it</h2>
        <ul>
          <li>To reply to product, trade, and support enquiries.</li>
          <li>To register a product and administer the manufacturer warranty.</li>
          <li>
            To send occasional product or promotion emails where you have been told we may do so, such
            as on the warranty form. You can opt out of those emails at any time.
          </li>
          <li>To keep the website secure, fix faults, and understand which pages are being used.</li>
          <li>To meet legal and accounting duties.</li>
        </ul>
        <p>We rely on these UK GDPR bases:</p>
        <ul>
          <li>
            Steps towards a contract, and performing a contract, when we handle a warranty registration
            or a trade enquiry you have asked us to progress.
          </li>
          <li>
            Legitimate interests in answering enquiries, running this website, and protecting it from
            misuse, where those interests are not overridden by your rights.
          </li>
          <li>Consent, where we send optional promotional email and you have not opted out.</li>
          <li>Legal obligation, where the law requires us to keep or disclose information.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Who we share it with</h2>
        <ul>
          <li>
            The warranty registration service used to record Maxspect product registrations, so the
            serial number and your contact details can be stored against the warranty.
          </li>
          <li>
            The product manufacturer, where that is needed to honour a warranty or investigate a
            product fault. The manufacturer is based outside the United Kingdom. Where personal
            information leaves the UK for that purpose, we put appropriate safeguards in place.
          </li>
          <li>Companies that host this website and send email on our instructions.</li>
          <li>Professional advisers, insurers, or public authorities when the law requires it.</li>
        </ul>
        <p>
          Stockist pages list retailers who sell Maxspect products. Contacting a stockist directly is
          a separate relationship with that retailer.
        </p>
      </section>

      <section className="space-y-3">
        <h2>How long we keep it</h2>
        <p>
          Enquiry records are kept for as long as we need them to deal with your request, and for a
          short period afterwards in case the same issue comes back. Warranty records are kept for the
          warranty period and for a reasonable time after it ends, so a later claim can be checked.
          Server logs are kept for a limited period for security. We delete or anonymise information
          when we no longer need it.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Your rights</h2>
        <p>You can ask us to:</p>
        <ul>
          <li>provide a copy of the personal information we hold about you;</li>
          <li>correct information that is inaccurate;</li>
          <li>delete information, or restrict how we use it, in the situations the law allows;</li>
          <li>object to processing based on legitimate interests;</li>
          <li>receive information you provided to us in a portable format, where the law applies;</li>
          <li>withdraw consent to promotional email, which does not affect earlier use of that information.</li>
        </ul>
        <p>
          Contact <a href={`mailto:${contact.email}`}>{contact.email}</a> to use these rights. You can
          also complain to the Information Commissioner’s Office at{" "}
          <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">
            ico.org.uk
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2>Cookies</h2>
        <p>
          Details of cookies on this website are in our <Link to="/cookies">Cookie Policy</Link>.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Changes</h2>
        <p>
          We will update this page when the way we handle personal information changes. The date at
          the top of the page shows when it was last revised.
        </p>
      </section>
    </PolicyLayout>
  );
}
