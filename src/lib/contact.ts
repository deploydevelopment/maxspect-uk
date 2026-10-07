/**
 * ============================================================
 *  MAXSPECT UK — CENTRAL CONTACT DETAILS
 * ============================================================
 *  Edit the values below to update contact info across the
 *  entire website. No need to touch individual components.
 * ============================================================
 */
export const contact = {
  /** Trading / brand name shown to customers */
  companyName: "Maxspect United Kingdom",

  /** Short descriptor of our role */
  role: "Official UK Distributor & Technical Centre",

  /** Main UK support phone number */
  phone: {
    /** Human-readable format shown on screen */
    display: "+44(0)1507 600477",
    /** Digits-only format used for clickable tel: links */
    tel: "+441507600477",
  },

  /** General enquiries email */
  email: "support@maxspect.co.uk",

  /** UK support line opening hours */
  hours: "Mon - Fri: 08:30 - 17:00 GMT",

  /** Regions covered by the UK distribution network */
  regions: "England, Scotland, Wales & Northern Ireland",
};

export type Contact = typeof contact;
