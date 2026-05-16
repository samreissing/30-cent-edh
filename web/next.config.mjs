/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  // GitHub Pages serves under /<repo-name>/ unless using a custom domain.
  // Override at deploy time: BASE_PATH=/20_word_30cent_EDH npm run build
  basePath: process.env.BASE_PATH || "",
  assetPrefix: process.env.BASE_PATH || "",
  trailingSlash: true,
};
export default nextConfig;
