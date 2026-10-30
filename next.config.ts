import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** Locale comes from a cookie (see src/i18n/request.ts), so there is no i18n routing. */
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /** The old "LVR System" signed in at /login; keep bookmarks and old e-mail links working. */
  async redirects() {
    return [
      { source: "/login", destination: "/sign-in", permanent: false },
      // Leave pages moved under the module prefix (/leave/*); old links, bookmarks and e-mails keep working.
      { source: "/leave-requests", destination: "/leave/requests", permanent: false },
      { source: "/approvals", destination: "/leave/approvals", permanent: false },
    ];
  },
};

export default withNextIntl(nextConfig);
