import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FINLIGEN_BLOG_DATA } from "../src/data/blogData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.resolve(ROOT_DIR, "public");

const BASE_URL = process.env.SITE_URL || "https://finligen.com";
const API_BLOG_URL = "https://caster-backend.onrender.com/api/blog?organization=finligen";

// Static routes configuration
const STATIC_ROUTES = [
  {
    path: "/",
    changefreq: "weekly",
    priority: "1.0",
  },
  {
    path: "/services",
    changefreq: "weekly",
    priority: "0.9",
  },
  {
    path: "/cpa-firms",
    changefreq: "weekly",
    priority: "0.9",
  },
  {
    path: "/about",
    changefreq: "monthly",
    priority: "0.8",
  },
  {
    path: "/blog",
    changefreq: "weekly",
    priority: "0.8",
  },
  {
    path: "/contact",
    changefreq: "monthly",
    priority: "0.8",
  },
];

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(dateInput) {
  if (!dateInput) return new Date().toISOString().split("T")[0];
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().split("T")[0];
    }
    return d.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

/**
 * Clean & normalize URL
 */
function buildFullUrl(base, routePath) {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Fetch remote blogs with fallback to local blog data
 */
async function fetchBlogs() {
  const blogsMap = new Map();

  // 1. Add local fallback blogs first
  if (Array.isArray(FINLIGEN_BLOG_DATA)) {
    for (const post of FINLIGEN_BLOG_DATA) {
      const handle = post.url_handle || post._id;
      if (handle) {
        blogsMap.set(handle, {
          handle,
          lastmod: formatDate(post.updated_at || post.created_at),
          title: post.title,
        });
      }
    }
  }

  // 2. Fetch live blog posts from API
  try {
    console.log(`[sitemap] Fetching live blog posts from ${API_BLOG_URL}...`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(API_BLOG_URL, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const result = await response.json();
      const articles = Array.isArray(result) ? result : (result.data || []);

      if (Array.isArray(articles) && articles.length > 0) {
        console.log(`[sitemap] Fetched ${articles.length} posts from API.`);
        for (const post of articles) {
          const handle = post.url_handle || post.slug || post._id;
          if (handle) {
            blogsMap.set(handle, {
              handle,
              lastmod: formatDate(post.updated_at || post.created_at || post.date),
              title: post.title,
            });
          }
        }
      }
    } else {
      console.warn(`[sitemap] API returned status ${response.status}. Using local blog data.`);
    }
  } catch (err) {
    console.warn(`[sitemap] Could not fetch live blog API (${err.message}). Using local blog data fallback.`);
  }

  return Array.from(blogsMap.values());
}

/**
 * Generate XML content for sitemap
 */
function buildSitemapXml(urls) {
  const today = formatDate();
  const urlEntries = urls
    .map(
      (item) => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${item.lastmod || today}</lastmod>
    <changefreq>${item.changefreq || "monthly"}</changefreq>
    <priority>${item.priority || "0.7"}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>
`;
}

/**
 * Generate robots.txt
 */
function buildRobotsTxt(baseUrl) {
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
}

/**
 * Main execution
 */
async function generate() {
  console.log(`[sitemap] Starting dynamic sitemap generation for ${BASE_URL}...`);

  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const today = formatDate();
  const sitemapUrls = [];

  // Add static routes
  for (const route of STATIC_ROUTES) {
    sitemapUrls.push({
      loc: buildFullUrl(BASE_URL, route.path),
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
    });
  }

  // Add dynamic blog posts
  const blogs = await fetchBlogs();
  console.log(`[sitemap] Adding ${blogs.length} dynamic blog routes...`);

  for (const blog of blogs) {
    sitemapUrls.push({
      loc: buildFullUrl(BASE_URL, `/blog/${blog.handle}`),
      lastmod: blog.lastmod,
      changefreq: "monthly",
      priority: "0.7",
    });
  }

  // Generate XML
  const sitemapXml = buildSitemapXml(sitemapUrls);
  const sitemapPath = path.join(PUBLIC_DIR, "sitemap.xml");
  fs.writeFileSync(sitemapPath, sitemapXml, "utf-8");
  console.log(`[sitemap] Successfully wrote ${sitemapUrls.length} URLs to ${sitemapPath}`);

  // Generate / update robots.txt
  const robotsTxt = buildRobotsTxt(BASE_URL);
  const robotsPath = path.join(PUBLIC_DIR, "robots.txt");
  fs.writeFileSync(robotsPath, robotsTxt, "utf-8");
  console.log(`[sitemap] Successfully wrote robots.txt to ${robotsPath}`);

  console.log("\n--- Generated Sitemap URLs ---");
  sitemapUrls.forEach((u) => console.log(` [${u.priority}] ${u.loc} (${u.lastmod})`));
  console.log("------------------------------\n");
}

generate().catch((err) => {
  console.error("[sitemap] Error generating sitemap:", err);
  process.exit(1);
});
