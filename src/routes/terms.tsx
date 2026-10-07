import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyLayout } from "@/components/PolicyLayout";
import { contact } from "@/lib/contact";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use | Maxspect UK" },
      {
        name: "description",
        content:
          "Terms of use for the Maxspect UK website, operated by BCUK Aquatics Limited.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PolicyLayout
      title="Terms of Use"
      description="The rules for using this website, which is operated by BCUK Aquatics Limited."
      updated="7 October 2026"
    >
      <section className="space-y-3">
        <h2>About this website</h2>
        <p>
          These terms apply to the Maxspect UK website. It is operated by BCUK Aquatics Limited,
          company number 06524182, of Unit 2-3, Warwick Road, Fairfield Industrial Estate, Louth,
          Lincolnshire, LN11 0YB. We are the official United Kingdom distributor of Maxspect products.
        </p>
        <p>
          By using the site you agree to these terms. If you do not agree, please do not use the site.
          Nothing in these terms affects rights you have as a consumer under UK law.
        </p>
      </section>

      <section className="space-y-3">
        <h2>What the site is for</h2>
        <p>
          The site gives product information, manuals, stockist details, and a way to register a
          product warranty or contact our UK team. Products are supplied through authorised stockists.
          A product page is not an offer to sell that product directly from this website, and listing a
          product does not guarantee that every stockist has it in stock.
        </p>
        <p>
          Descriptions, images, and specifications are provided as a guide. Products can be updated by
          the manufacturer. Check the current specification with your stockist before you buy.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Warranty registration</h2>
        <p>
          The registration form asks for the product serial number and your contact details so the
          warranty can be recorded. Sending the form does not by itself confirm that a warranty has
          been accepted. A serial number that is missing, too short, or does not match a genuine
          product can be rejected. You must give accurate information. Details of how that information
          is used are in our <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Acceptable use</h2>
        <p>You must not:</p>
        <ul>
          <li>use the site in a way that breaks the law or infringes someone else’s rights;</li>
          <li>attempt to access areas or data you are not authorised to use;</li>
          <li>interfere with the site, or probe it for weaknesses;</li>
          <li>submit false warranty or enquiry details;</li>
          <li>copy the site in bulk, or use it to build a competing product database.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2>Intellectual property</h2>
        <p>
          Maxspect names, logos, product designs, and manuals belong to their respective owners. The
          arrangement of this website, and the text we have written for it, belong to BCUK Aquatics
          Limited or our licensors. You may view pages and download a manual for your own product.
          You may not republish the site, or use the Maxspect marks, without permission from the
          rights holder.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Other websites</h2>
        <p>
          Links to stockists, app stores, manuals, and patent pages take you to other websites. We are
          not responsible for their content, availability, or privacy practices. Your purchase from a
          stockist is a contract with that retailer.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Availability and liability</h2>
        <p>
          We aim to keep the site available and the information on it accurate, but we do not promise
          that it will be uninterrupted or free of errors. We may change or remove pages, including
          when a product range changes.
        </p>
        <p>
          We do not exclude liability for death or personal injury caused by negligence, for fraud, or
          for any other liability that UK law does not allow us to exclude. Subject to that, we are
          not liable for loss that was not a foreseeable result of our breaking these terms, or for
          business losses such as lost profit, lost sales, or business interruption.
        </p>
      </section>

      <section className="space-y-3">
        <h2>Law</h2>
        <p>
          These terms are governed by the laws of England and Wales. The courts of England and Wales
          have jurisdiction, except that if you live in Scotland or Northern Ireland you may also
          bring a claim in your local courts.
        </p>
        <p>
          Questions about these terms can be sent to{" "}
          <a href={`mailto:${contact.email}`}>{contact.email}</a> or made by phone on{" "}
          <a href={`tel:${contact.phone.tel}`}>{contact.phone.display}</a>.
        </p>
      </section>
    </PolicyLayout>
  );
}
