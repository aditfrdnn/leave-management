import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** Locale comes from a cookie (see src/i18n/request.ts), so there is no i18n routing. */
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Signature uploads (max 2 MB, resized in the browser first) go through a Server Action.
    serverActions: { bodySizeLimit: "3mb" },
  },
  /** The old "LVR System" signed in at /login; keep bookmarks and old e-mail links working. */
  async redirects() {
    return [
      { source: "/login", destination: "/sign-in", permanent: false },
      // Leave pages moved under the module prefix (/leave/*); old links, bookmarks and e-mails keep working.
      { source: "/leave-requests", destination: "/leave/requests", permanent: false },
      // Approvals live in "My Leave" now (docs/setup-module.md §13).
      { source: "/approvals", destination: "/leave/requests?scope=approvals", permanent: false },
      { source: "/leave/approvals", destination: "/leave/requests?scope=approvals", permanent: false },
      // Appraisal templates moved from Setup into the Appraisal module.
      { source: "/setup/appraisal-templates", destination: "/appraisal/templates", permanent: false },
      { source: "/setup/appraisal-templates/:id", destination: "/appraisal/templates/:id", permanent: false },
    ];
  },
};

export default withNextIntl(nextConfig);
