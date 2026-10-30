import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** Locale comes from a cookie (see src/i18n/request.ts), so there is no i18n routing. */
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
