/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import nextPwa from "next-pwa";

const withPWA = nextPwa({
  dest: "public",
  skipWaiting: true,
  clientsClaim: true,
});

export default withPWA({});
