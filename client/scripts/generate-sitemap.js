import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { toolCatalog, categoryMeta } from "../src/utils/tools.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read CLIENT_URL from root .env
let clientUrl = "http://localhost:5173";
try {
  const envPath = path.resolve(__dirname, "../../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/^CLIENT_URL=(.+)$/m);
    if (match && match[1]) {
      clientUrl = match[1].trim();
    }
  }
} catch (err) {
  console.warn("Could not load root .env file, using default client URL:", err.message);
}

// Clean clientUrl (remove trailing slash)
clientUrl = clientUrl.replace(/\/$/, "");

const paths = new Set();
paths.add("/");
paths.add("/transfer");

// Add category pages
Object.keys(categoryMeta).forEach((category) => {
  paths.add(`/${category}`);
});

// Add tool pages
toolCatalog.forEach((tool) => {
  if (tool.route) {
    paths.add(tool.route);
  }
});

const urlset = [...paths]
  .map((p) => {
    const priority = p === "/" ? "1.0" : p.startsWith("/ai") || p.includes("transfer") ? "0.8" : "0.7";
    const changefreq = p === "/" ? "daily" : "weekly";
    return `  <url>
    <loc>${clientUrl}${p}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  })
  .join("\n");

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;

// Write to public folder
const publicPath = path.resolve(__dirname, "../public/sitemap.xml");
fs.writeFileSync(publicPath, sitemapXml, "utf8");
console.log(`Generated sitemap.xml in public folder: ${publicPath}`);

// Write to dist folder if it exists
const distPath = path.resolve(__dirname, "../dist/sitemap.xml");
try {
  if (fs.existsSync(path.dirname(distPath))) {
    fs.writeFileSync(distPath, sitemapXml, "utf8");
    console.log(`Generated sitemap.xml in dist folder: ${distPath}`);
  }
} catch (err) {
  // Ignore if dist doesn't exist yet
}
