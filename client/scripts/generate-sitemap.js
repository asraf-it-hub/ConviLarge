import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { toolCatalog, categoryMeta } from "../src/utils/tools.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to escape special XML characters
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Read base URL from env with precedence:
// 1. process.env.VITE_SITE_URL (explicit env var)
// 2. process.env.CLIENT_URL (explicit env var)
// 3. .env file VITE_SITE_URL
// 4. .env file CLIENT_URL
// 5. Fallback to production domain
let siteUrl = process.env.VITE_SITE_URL || process.env.CLIENT_URL;

if (!siteUrl) {
  const searchPaths = [
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../.env"),
    path.resolve(__dirname, "../../client/.env")
  ];

  for (const envPath of searchPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf8");
        const viteSiteUrlMatch = envContent.match(/^VITE_SITE_URL=(.+)$/m);
        if (viteSiteUrlMatch && viteSiteUrlMatch[1]) {
          siteUrl = viteSiteUrlMatch[1].trim();
          break;
        }
        const clientUrlMatch = envContent.match(/^CLIENT_URL=(.+)$/m);
        if (clientUrlMatch && clientUrlMatch[1]) {
          siteUrl = clientUrlMatch[1].trim();
          break;
        }
      }
    } catch (err) {
      // Ignore
    }
  }
}

if (!siteUrl) {
  siteUrl = "https://convi-large-client.vercel.app";
}

// Clean siteUrl (remove trailing slash)
siteUrl = siteUrl.replace(/\/$/, "");

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
    <loc>${escapeXml(siteUrl + p)}</loc>
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
