// // pages/api/ecom-scrape.js
// import { load } from "cheerio";
// import fetch from "node-fetch";
// import pLimit from "p-limit";
// import path from "path";
// import { promises as fs } from "fs";
// import { saveLeads } from "../../lib/mongodb";

// const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";

// const CONCURRENCY = 8;
// const REQUEST_TIMEOUT_MS = 12000;
// const REQUEST_DELAY_MS = 200;
// const MAX_SITE_PAGES = 3;
// const MAX_SEARCH_RESULTS = 100;

// const MARKETPLACES = {
//   amazon: { domain: "amazon.in", label: "Amazon" },
//   flipkart: { domain: "flipkart.com", label: "Flipkart" },
//   nykaa: { domain: "nykaa.com", label: "Nykaa" },
//   myntra: { domain: "myntra.com", label: "Myntra" },
// };

// const CONTACT_HINTS = ["contact", "about", "support", "customer", "help", "team", "privacy", "terms"];
// const SOCIAL_DOMAINS = ["instagram.com", "facebook.com", "linkedin.com", "x.com", "twitter.com", "youtube.com"];
// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// function hostnameOf(u) {
//   try {
//     return new URL(u).hostname.replace(/^www\./, "");
//   } catch {
//     return null;
//   }
// }

// async function safeFetch(url, { retries = 2, headers = {}, timeout = REQUEST_TIMEOUT_MS } = {}) {
//   for (let i = 0; i <= retries; i++) {
//     try {
//       const controller = new AbortController();
//       const id = setTimeout(() => controller.abort(), timeout);
//       const res = await fetch(url, { headers: { "User-Agent": UA, ...headers }, signal: controller.signal });
//       clearTimeout(id);
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       return res;
//     } catch (err) {
//       if (i === retries) throw err;
//       await sleep(250 * (i + 1));
//     }
//   }
// }

// function extractContacts(html) {
//   const emails = new Set((html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map((s) => s.toLowerCase()));
//   const phonesRaw = html.match(/(\+?\d[\d\s\-().]{8,}\d)/g) || [];
//   const phones = new Set(phonesRaw.filter((p) => p.replace(/\D+/g, "").length >= 9));
//   return { emails: [...emails], phones: [...phones] };
// }

// function detectPlatform(html) {
//   const h = html.toLowerCase();
//   if (/shopify|cdn\.shopify\.com|cart\.js/.test(h)) return "Shopify";
//   if (/woocommerce|wp-content/.test(h)) return "WooCommerce";
//   if (/magento|mage\//.test(h)) return "Magento";
//   if (/bigcommerce/.test(h)) return "BigCommerce";
//   if (/squarespace/.test(h)) return "Squarespace";
//   if (/wixstatic\.com|wix\.com/.test(h)) return "Wix";
//   return null;
// }

// function detectChatbot(html) {
//   const h = html.toLowerCase();
//   const widgets = [];
//   if (/intercom\.io/.test(h)) widgets.push("Intercom");
//   if (/crisp\.chat/.test(h)) widgets.push("Crisp");
//   if (/tidio\.co/.test(h)) widgets.push("Tidio");
//   if (/zendesk\.com|zdassets/.test(h)) widgets.push("Zendesk Chat");
//   if (/drift\.com/.test(h)) widgets.push("Drift");
//   if (/freshchat\.com/.test(h)) widgets.push("Freshchat");
//   if (/hubspot\.com|hs-analytics/.test(h)) widgets.push("HubSpot Chat");
//   if (/wa\.me\/|api\.whatsapp/.test(h)) widgets.push("WhatsApp Chat");
//   return widgets.length ? widgets : null;
// }

// function extractSocials($, baseUrl) {
//   const socials = new Set();
//   $("a[href]").each((_, a) => {
//     const href = $(a).attr("href");
//     if (href && SOCIAL_DOMAINS.some((d) => href.includes(d))) {
//       try {
//         socials.add(new URL(href, baseUrl).href);
//       } catch {}
//     }
//   });
//   return [...socials];
// }

// async function crawlSite(startUrl, maxPages = MAX_SITE_PAGES) {
//   const origin = new URL(startUrl).origin;
//   const queue = [startUrl];
//   const seen = new Set();
//   const emails = new Set();
//   const phones = new Set();
//   let platform = null;
//   let chatbot = null;
//   let socials = [];

//   while (queue.length && seen.size < maxPages) {
//     const url = queue.shift();
//     if (!url || seen.has(url)) continue;
//     seen.add(url);

//     try {
//       const html = await (await safeFetch(url)).text();
//       const $ = load(html);
//       const c = extractContacts(html);
//       c.emails.forEach((e) => emails.add(e));
//       c.phones.forEach((p) => phones.add(p));
//       platform = platform || detectPlatform(html);
//       chatbot = chatbot || detectChatbot(html);
//       socials = [...new Set([...socials, ...extractSocials($, url)])];

//       $("a[href]").each((_, a) => {
//         const href = $(a).attr("href");
//         if (!href) return;
//         try {
//           const abs = new URL(href, url).href;
//           if (hostnameOf(abs) === hostnameOf(origin) && CONTACT_HINTS.some((k) => abs.toLowerCase().includes(k))) {
//             if (!seen.has(abs)) queue.push(abs);
//           }
//         } catch {}
//       });

//       await sleep(REQUEST_DELAY_MS);
//     } catch {}
//   }

//   return { domain: hostnameOf(startUrl), url: startUrl, emails: [...emails], phones: [...phones], socials, platform, chatbot, has_website: true };
// }

// // --- GOOGLE CUSTOM SEARCH + FALLBACK ---
// async function googleCseSearch({ q, cx, key, startIndex = 1 }) {
//   const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(q)}&key=${key}&cx=${cx}&start=${startIndex}`;
//   try {
//     const json = await (await safeFetch(url)).json();
//     return json.items ? json.items.map((i) => i.link) : [];
//   } catch {
//     return [];
//   }
// }

// async function duckDuckGoSearch({ q, num = 25 }) {
//   const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=in-en`;
//   try {
//     const html = await (await safeFetch(url)).text();
//     const $ = load(html);
//     const links = [];
//     $("a.result__a").each((_, a) => {
//       const href = $(a).attr("href");
//       if (href && links.length < num) links.push(href);
//     });
//     return links;
//   } catch {
//     return [];
//   }
// }

// async function webSearchLinks(queries) {
//   const out = new Set();
//   const key = process.env.GOOGLE_CSE_KEY;
//   const cx = process.env.GOOGLE_CSE_CX;

//   for (const q of queries) {
//     console.log("🔎 Searching:", q);
//     if (key && cx) {
//       console.log("🌐 Using Google Custom Search API...");
//       for (let start = 1; start <= 91; start += 10) {
//         const pageLinks = await googleCseSearch({ q, cx, key, startIndex: start });
//         if (!pageLinks.length) break;
//         pageLinks.forEach((l) => out.add(l));
//         await sleep(200);
//       }
//     }
//     if (!out.size) {
//       console.log("⚠️ Google API empty/quota exceeded. Falling back to DuckDuckGo...");
//       const ddg = await duckDuckGoSearch({ q });
//       ddg.forEach((l) => out.add(l));
//     }
//   }

//   console.log(`✅ Total links found: ${out.size}`);
//   return [...out];
// }

// function isMarketplaceUrl(u) {
//   const h = hostnameOf(u) || "";
//   return Object.keys(MARKETPLACES).find((k) => h.endsWith(MARKETPLACES[k].domain));
// }

// function brandNameFromUrl(u) {
//   try {
//     const parts = new URL(u).pathname.split("/").filter(Boolean);
//     if (parts.length) return decodeURIComponent(parts[parts.length - 1]).replace(/[-_]+/g, " ");
//   } catch {}
//   return null;
// }

// export default async function handler(req, res) {
//   if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

//   try {
//     const { industry = "", keywords = [], sources = ["web", "flipkart", "myntra"], limit = 50 } = req.body || {};
//     if (!industry) return res.status(400).json({ error: "industry is required" });

//     // More aggressive, brand-oriented queries
//     const queries = [
//       `buy ${industry} online India site:.com`,
//       `top ${industry} brands India -amazon -flipkart -nykaa -myntra`,
//       `${industry} ecommerce website India site:.in`,
//       ...(keywords || []).map((k) => `${k} ${industry} brand India site:.com`),
//     ];

//     const webLinks = sources.includes("web") ? await webSearchLinks(queries) : [];
//     console.log(`🌐 Found ${webLinks.length} raw web links`);

//     const websiteCandidates = new Set();
//     const marketplaceCandidates = new Set();

//     for (const link of webLinks) {
//       const host = hostnameOf(link);
//       if (!host) continue;
//       console.log("🔗 Checking host:", host);

//       if (Object.values(MARKETPLACES).some((m) => host.endsWith(m.domain))) {
//         marketplaceCandidates.add(link);
//       } else if (!/facebook\.com|linkedin\.com|twitter\.com|pinterest\.com/i.test(host)) {
//         websiteCandidates.add(link);
//       } else {
//         console.log("⛔ Skipped host:", host);
//       }
//     }

//     console.log("✅ Website candidates:", [...websiteCandidates].slice(0, 10));
//     console.log("🛒 Marketplace candidates:", [...marketplaceCandidates].slice(0, 10));

//     const limitFn = pLimit(CONCURRENCY);
//     const crawled = await Promise.allSettled(
//       [...websiteCandidates].slice(0, MAX_SEARCH_RESULTS).map((site) =>
//         limitFn(async () => {
//           try {
//             const data = await crawlSite(site);
//             return {
//               brand: (data.domain || "").split(".")[0],
//               ...data,
//               marketplace_only: false,
//               marketplaces: [],
//               industry,
//               country: "IN",
//               source: "Web",
//             };
//           } catch {
//             return null;
//           }
//         })
//       )
//     );

//     const websiteLeads = crawled.filter((r) => r.status === "fulfilled" && r.value).map((r) => r.value);

//     const marketplaceLeads = [...marketplaceCandidates].map((link) => {
//       const k = isMarketplaceUrl(link);
//       return {
//         brand: brandNameFromUrl(link) || "Unknown Brand",
//         website: null,
//         domain: null,
//         url: null,
//         emails: [],
//         phones: [],
//         socials: [],
//         platform: null,
//         chatbot: null,
//         has_website: false,
//         marketplace_only: true,
//         marketplaces: [MARKETPLACES[k]?.label || "Marketplace"],
//         product_link: link,
//         industry,
//         country: "IN",
//         source: MARKETPLACES[k]?.label || "Marketplace",
//       };
//     });

//     const leads = [...websiteLeads, ...marketplaceLeads].slice(0, limit);
//     console.log(`🎯 Final leads count: ${leads.length}`);

//     let saved = 0;
//     try {
//       if (leads.length) saved = await saveLeads(leads);
//     } catch {}

//     return res.status(200).json({
//       count: leads.length,
//       saved,
//       leads,
//       meta: {
//         website_candidates: websiteCandidates.size,
//         marketplace_candidates: marketplaceCandidates.size,
//       },
//     });
//   } catch (err) {
//     console.error("❌ ecom-scrape error:", err);
//     return res.status(500).json({ error: err.message });
//   }
// }















// // pages/api/ecom-scrape.js
// import { load } from "cheerio";
// import fetch from "node-fetch";
// import pLimit from "p-limit";
// import { saveLeads } from "../../lib/mongodb";

// const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";

// const CONCURRENCY = 8;
// const REQUEST_TIMEOUT_MS = 12000;
// const REQUEST_DELAY_MS = 200;
// const MAX_SITE_PAGES = 3;
// const MAX_SEARCH_RESULTS = 100;

// const CONTACT_HINTS = ["contact", "about", "support", "customer", "help", "team"];
// const SOCIAL_DOMAINS = ["instagram.com", "facebook.com", "linkedin.com", "x.com", "twitter.com", "youtube.com"];
// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// function hostnameOf(u) {
//   try {
//     return new URL(u).hostname.replace(/^www\./, "");
//   } catch {
//     return null;
//   }
// }

// async function safeFetch(url, { retries = 2, headers = {}, timeout = REQUEST_TIMEOUT_MS } = {}) {
//   for (let i = 0; i <= retries; i++) {
//     try {
//       const controller = new AbortController();
//       const id = setTimeout(() => controller.abort(), timeout);
//       const res = await fetch(url, { headers: { "User-Agent": UA, ...headers }, signal: controller.signal });
//       clearTimeout(id);
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       return res;
//     } catch (err) {
//       if (i === retries) throw err;
//       await sleep(250 * (i + 1));
//     }
//   }
// }

// function extractContacts(html) {
//   const emails = new Set((html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map((s) => s.toLowerCase()));
//   const phonesRaw = html.match(/(\+?\d[\d\s\-().]{8,}\d)/g) || [];
//   const phones = new Set(phonesRaw.filter((p) => p.replace(/\D+/g, "").length >= 9));
//   return { emails: [...emails], phones: [...phones] };
// }

// function detectPlatform(html) {
//   const h = html.toLowerCase();
//   if (/shopify|cdn\.shopify\.com|cart\.js/.test(h)) return "Shopify";
//   if (/woocommerce|wp-content/.test(h)) return "WooCommerce";
//   if (/magento|mage\//.test(h)) return "Magento";
//   if (/bigcommerce/.test(h)) return "BigCommerce";
//   if (/squarespace/.test(h)) return "Squarespace";
//   if (/wixstatic\.com|wix\.com/.test(h)) return "Wix";
//   return null;
// }

// function detectChatbot(html) {
//   const h = html.toLowerCase();
//   const widgets = [];
//   if (/intercom\.io/.test(h)) widgets.push("Intercom");
//   if (/crisp\.chat/.test(h)) widgets.push("Crisp");
//   if (/tidio\.co/.test(h)) widgets.push("Tidio");
//   if (/zendesk\.com|zdassets/.test(h)) widgets.push("Zendesk Chat");
//   if (/drift\.com/.test(h)) widgets.push("Drift");
//   if (/freshchat\.com/.test(h)) widgets.push("Freshchat");
//   if (/hubspot\.com|hs-analytics/.test(h)) widgets.push("HubSpot Chat");
//   if (/wa\.me\/|api\.whatsapp/.test(h)) widgets.push("WhatsApp Chat");
//   return widgets.length ? widgets : null;
// }

// function extractSocials($, baseUrl) {
//   const socials = new Set();
//   $("a[href]").each((_, a) => {
//     const href = $(a).attr("href");
//     if (href && SOCIAL_DOMAINS.some((d) => href.includes(d))) {
//       try {
//         socials.add(new URL(href, baseUrl).href);
//       } catch {}
//     }
//   });
//   return [...socials];
// }

// async function crawlSite(startUrl, maxPages = MAX_SITE_PAGES) {
//   const originHost = hostnameOf(startUrl);
//   const queue = [startUrl];
//   const seen = new Set();
//   const emails = new Set();
//   const phones = new Set();
//   const externalBrandLinks = new Set();
//   let platform = null;
//   let chatbot = null;
//   let socials = [];

//   while (queue.length && seen.size < maxPages) {
//     const url = queue.shift();
//     if (!url || seen.has(url)) continue;
//     seen.add(url);

//     try {
//       const html = await (await safeFetch(url)).text();
//       const $ = load(html);
//       const c = extractContacts(html);
//       c.emails.forEach((e) => emails.add(e));
//       c.phones.forEach((p) => phones.add(p));
//       platform = platform || detectPlatform(html);
//       chatbot = chatbot || detectChatbot(html);
//       socials = [...new Set([...socials, ...extractSocials($, url)])];

//       $("a[href]").each((_, a) => {
//         const href = $(a).attr("href");
//         if (!href) return;
//         let abs;
//         try {
//           abs = new URL(href, url).href;
//         } catch {
//           return;
//         }

//         const host = hostnameOf(abs);

//         // Enqueue internal contact-like pages
//         if (host === originHost && CONTACT_HINTS.some((k) => abs.toLowerCase().includes(k))) {
//           if (!seen.has(abs)) queue.push(abs);
//         }

//         // Collect external brand links
//         if (host && host !== originHost && /\.(com|in|shop|store|co)$/i.test(host) &&
//           !/facebook|linkedin|twitter|pinterest|instagram|youtube/.test(host)) {
//           externalBrandLinks.add(abs);
//         }
//       });

//       await sleep(REQUEST_DELAY_MS);
//     } catch (err) {
//       console.warn(`⚠️ Failed to crawl ${url}: ${err.message}`);
//     }
//   }

//   return {
//     domain: hostnameOf(startUrl),
//     url: startUrl,
//     emails: [...emails],
//     phones: [...phones],
//     socials,
//     platform,
//     chatbot,
//     has_website: true,
//     discoveredBrands: [...externalBrandLinks],
//   };
// }

// // --- Google CSE + DuckDuckGo Fallback ---
// async function googleCseSearch({ q, cx, key, startIndex = 1 }) {
//   const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(q)}&key=${key}&cx=${cx}&start=${startIndex}`;
//   try {
//     const json = await (await safeFetch(url)).json();
//     return json.items ? json.items.map((i) => i.link) : [];
//   } catch {
//     return [];
//   }
// }

// async function duckDuckGoSearch({ q, num = 25 }) {
//   const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=in-en`;
//   try {
//     const html = await (await safeFetch(url)).text();
//     const $ = load(html);
//     const links = [];
//     $("a.result__a").each((_, a) => {
//       const href = $(a).attr("href");
//       if (href && links.length < num) links.push(href);
//     });
//     return links;
//   } catch {
//     return [];
//   }
// }

// // ✅ Normalize DuckDuckGo redirect links
// function normalizeDuckDuckGoLink(link) {
//   try {
//     if (link.startsWith("//duckduckgo.com/l/?uddg=") || link.includes("duckduckgo.com/l/?uddg=")) {
//       const urlObj = new URL(link.startsWith("http") ? link : "https:" + link);
//       const real = urlObj.searchParams.get("uddg");
//       if (real) return decodeURIComponent(real);
//     }
//   } catch {}
//   return link;
// }

// async function webSearchLinks(queries) {
//   const out = new Set();
//   const key = process.env.GOOGLE_CSE_KEY;
//   const cx = process.env.GOOGLE_CSE_CX;

//   for (const q of queries) {
//     console.log("🔎 Searching:", q);
//     if (key && cx) {
//       console.log("🌐 Using Google Custom Search API...");
//       for (let start = 1; start <= 91; start += 10) {
//         const pageLinks = await googleCseSearch({ q, cx, key, startIndex: start });
//         if (!pageLinks.length) break;
//         pageLinks.forEach((l) => out.add(l));
//         await sleep(200);
//       }
//     }
//     if (!out.size) {
//       console.log("⚠️ Google API empty/quota exceeded. Falling back to DuckDuckGo...");
//       const ddg = await duckDuckGoSearch({ q });
//       ddg.forEach((l) => out.add(l));
//     }
//   }

//   const normalized = [...out].map(normalizeDuckDuckGoLink);
//   console.log(`✅ Total links found: ${normalized.length}`);
//   normalized.forEach((l) => console.log("   🔗", l));
//   return normalized;
// }

// export default async function handler(req, res) {
//   if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

//   try {
//     const { industry = "", keywords = [], limit = 50 } = req.body || {};
//     if (!industry) return res.status(400).json({ error: "industry is required" });

//     const queries = [
//       `buy ${industry} online India site:.com`,
//       `top ${industry} brands India -amazon -flipkart -nykaa -myntra`,
//       `${industry} ecommerce website India site:.in`,
//       ...(keywords || []).map((k) => `${k} ${industry} brand India site:.com`),
//     ];

//     const webLinks = await webSearchLinks(queries);

//     const limitFn = pLimit(CONCURRENCY);

//     // Pass 1: Crawl all search result links
//     const crawled = await Promise.allSettled(
//       webLinks.slice(0, MAX_SEARCH_RESULTS).map((link) =>
//         limitFn(() => crawlSite(link))
//       )
//     );

//     const websiteLeads = [];
//     const discoveredLinks = new Set();

//     crawled.forEach((r) => {
//       if (r.status === "fulfilled" && r.value) {
//         websiteLeads.push({
//           brand: (r.value.domain || "").split(".")[0],
//           ...r.value,
//           marketplace_only: false,
//           marketplaces: [],
//           industry,
//           country: "IN",
//           source: "SeedLink",
//         });

//         r.value.discoveredBrands.forEach((l) => discoveredLinks.add(l));
//       }
//     });

//     console.log(`🔎 Found ${discoveredLinks.size} discovered brand links from blogs/articles.`);

//     // Pass 2: Crawl discovered brand sites
//     const discoveredResults = await Promise.allSettled(
//       [...discoveredLinks].slice(0, MAX_SEARCH_RESULTS).map((link) =>
//         limitFn(() => crawlSite(link))
//       )
//     );

//     const discoveredLeads = discoveredResults
//       .filter((r) => r.status === "fulfilled" && r.value)
//       .map((r) => ({
//         brand: (r.value.domain || "").split(".")[0],
//         ...r.value,
//         marketplace_only: false,
//         marketplaces: [],
//         industry,
//         country: "IN",
//         source: "Discovered",
//       }));

//     const leads = [...websiteLeads, ...discoveredLeads].slice(0, limit);

//     console.log(`🎯 Final leads count: ${leads.length}`);

//     let saved = 0;
//     try {
//       if (leads.length) saved = await saveLeads(leads);
//     } catch {}

//     return res.status(200).json({
//       count: leads.length,
//       saved,
//       leads,
//       meta: {
//         discovered_links: discoveredLinks.size,
//         crawled_links: webLinks.length,
//       },
//     });
//   } catch (err) {
//     console.error("❌ ecom-scrape error:", err);
//     return res.status(500).json({ error: err.message });
//   }
// }













// pages/api/ecom-scrape.js
import { load } from "cheerio";
import fetch from "node-fetch";
import pLimit from "p-limit";
import path from "path";
import { promises as fs } from "fs";
import { saveLeads } from "../../lib/mongodb";

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";
const CONCURRENCY = 8;
const REQUEST_TIMEOUT_MS = 12000;
const REQUEST_DELAY_MS = 200;
const MAX_SITE_PAGES = 3;
const MAX_SEARCH_RESULTS = 100;

const CONTACT_HINTS = ["contact", "about", "support", "customer", "help", "team"];
const SOCIAL_DOMAINS = ["instagram.com", "facebook.com", "linkedin.com", "x.com", "twitter.com", "youtube.com"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function hostnameOf(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function safeFetch(url, { retries = 2, headers = {}, timeout = REQUEST_TIMEOUT_MS } = {}) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const res = await fetch(url, { headers: { "User-Agent": UA, ...headers }, signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (i === retries) throw err;
      await sleep(250 * (i + 1));
    }
  }
}

function extractContacts(html) {
  const emails = new Set((html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map((s) => s.toLowerCase()));
  const phonesRaw = html.match(/(\+?\d[\d\s\-().]{8,}\d)/g) || [];
  const phones = new Set(phonesRaw.filter((p) => p.replace(/\D+/g, "").length >= 9));
  return { emails: [...emails], phones: [...phones] };
}

function detectPlatform(html) {
  const h = html.toLowerCase();
  if (/shopify|cdn\.shopify\.com|cart\.js/.test(h)) return "Shopify";
  if (/woocommerce|wp-content/.test(h)) return "WooCommerce";
  if (/magento|mage\//.test(h)) return "Magento";
  if (/bigcommerce/.test(h)) return "BigCommerce";
  if (/squarespace/.test(h)) return "Squarespace";
  if (/wixstatic\.com|wix\.com/.test(h)) return "Wix";
  return null;
}

function detectChatbot(html) {
  const h = html.toLowerCase();
  const widgets = [];
  if (/intercom\.io/.test(h)) widgets.push("Intercom");
  if (/crisp\.chat/.test(h)) widgets.push("Crisp");
  if (/tidio\.co/.test(h)) widgets.push("Tidio");
  if (/zendesk\.com|zdassets/.test(h)) widgets.push("Zendesk Chat");
  if (/drift\.com/.test(h)) widgets.push("Drift");
  if (/freshchat\.com/.test(h)) widgets.push("Freshchat");
  if (/hubspot\.com|hs-analytics/.test(h)) widgets.push("HubSpot Chat");
  if (/wa\.me\/|api\.whatsapp/.test(h)) widgets.push("WhatsApp Chat");
  return widgets.length ? widgets : null;
}

function extractSocials($, baseUrl) {
  const socials = new Set();
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href");
    if (href && SOCIAL_DOMAINS.some((d) => href.includes(d))) {
      try {
        socials.add(new URL(href, baseUrl).href);
      } catch {}
    }
  });
  return [...socials];
}

async function crawlSite(startUrl, maxPages = MAX_SITE_PAGES) {
  const originHost = hostnameOf(startUrl);
  const queue = [startUrl];
  const seen = new Set();
  const emails = new Set();
  const phones = new Set();
  const externalBrandLinks = new Set();
  let platform = null;
  let chatbot = null;
  let socials = [];

  while (queue.length && seen.size < maxPages) {
    const url = queue.shift();
    if (!url || seen.has(url)) continue;
    seen.add(url);

    try {
      const html = await (await safeFetch(url)).text();
      const $ = load(html);
      const c = extractContacts(html);
      c.emails.forEach((e) => emails.add(e));
      c.phones.forEach((p) => phones.add(p));
      platform = platform || detectPlatform(html);
      chatbot = chatbot || detectChatbot(html);
      socials = [...new Set([...socials, ...extractSocials($, url)])];

      $("a[href]").each((_, a) => {
        const href = $(a).attr("href");
        if (!href) return;
        let abs;
        try {
          abs = new URL(href, url).href;
        } catch {
          return;
        }

        const host = hostnameOf(abs);

        if (host === originHost && CONTACT_HINTS.some((k) => abs.toLowerCase().includes(k))) {
          if (!seen.has(abs)) queue.push(abs);
        }

        if (host && host !== originHost && /\.(com|in|shop|store|co)$/i.test(host) &&
          !/facebook|linkedin|twitter|pinterest|instagram|youtube/.test(host)) {
          externalBrandLinks.add(abs);
        }
      });

      await sleep(REQUEST_DELAY_MS);
    } catch (err) {
      console.warn(`⚠️ Failed to crawl ${url}: ${err.message}`);
    }
  }

  return {
    domain: hostnameOf(startUrl),
    url: startUrl,
    emails: [...emails],
    phones: [...phones],
    socials,
    platform,
    chatbot,
    has_website: true,
    discoveredBrands: [...externalBrandLinks],
  };
}

async function googleCseSearch({ q, cx, key, startIndex = 1 }) {
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(q)}&key=${key}&cx=${cx}&start=${startIndex}`;
  try {
    const json = await (await safeFetch(url)).json();
    return json.items ? json.items.map((i) => i.link) : [];
  } catch {
    return [];
  }
}

async function duckDuckGoSearch({ q, num = 25 }) {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=in-en`;
  try {
    const html = await (await safeFetch(url)).text();
    const $ = load(html);
    const links = [];
    $("a.result__a").each((_, a) => {
      const href = $(a).attr("href");
      if (href && links.length < num) links.push(href);
    });
    return links;
  } catch {
    return [];
  }
}

function normalizeDuckDuckGoLink(link) {
  try {
    if (link.startsWith("//duckduckgo.com/l/?uddg=") || link.includes("duckduckgo.com/l/?uddg=")) {
      const urlObj = new URL(link.startsWith("http") ? link : "https:" + link);
      const real = urlObj.searchParams.get("uddg");
      if (real) return decodeURIComponent(real);
    }
  } catch {}
  return link;
}

async function webSearchLinks(queries) {
  const out = new Set();
  const key = process.env.GOOGLE_CSE_KEY;
  const cx = process.env.GOOGLE_CSE_CX;

  for (const q of queries) {
    console.log("🔎 Searching:", q);
    if (key && cx) {
      console.log("🌐 Using Google Custom Search API...");
      for (let start = 1; start <= 91; start += 10) {
        const pageLinks = await googleCseSearch({ q, cx, key, startIndex: start });
        if (!pageLinks.length) break;
        pageLinks.forEach((l) => out.add(l));
        await sleep(200);
      }
    }
    if (!out.size) {
      console.log("⚠️ Google API empty/quota exceeded. Falling back to DuckDuckGo...");
      const ddg = await duckDuckGoSearch({ q });
      ddg.forEach((l) => out.add(l));
    }
  }

  const normalized = [...out].map(normalizeDuckDuckGoLink);
  console.log(`✅ Total links found: ${normalized.length}`);
  normalized.forEach((l) => console.log("   🔗", l));
  return normalized;
}

// ✅ CSV Export Helper
async function exportToCSV(leads) {
  if (!leads.length) return null;
  const header = ["Brand", "Domain", "URL", "Emails", "Phones", "Socials", "Platform", "Chatbot"].join(",");
  const rows = leads.map(l =>
    [
      l.brand || "",
      l.domain || "",
      l.url || "",
      (l.emails || []).join("; "),
      (l.phones || []).join("; "),
      (l.socials || []).join("; "),
      l.platform || "",
      Array.isArray(l.chatbot) ? l.chatbot.join("; ") : (l.chatbot || "")
    ].map(f => `"${String(f).replace(/"/g, '""')}"`).join(",")
  );
  const content = [header, ...rows].join("\n");
  const dir = path.join(process.cwd(), "public", "downloads");
  await fs.mkdir(dir, { recursive: true });

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const filePath = path.join(dir, `ecom-leads-${today}.csv`);
  await fs.writeFile(filePath, content, "utf-8");
  console.log(`📁 CSV exported: ${filePath}`);
  return `/downloads/${path.basename(filePath)}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { industry = "", keywords = [], limit = 50 } = req.body || {};
    if (!industry) return res.status(400).json({ error: "industry is required" });

    // const queries = [
    //   `buy ${industry} online India site:.com`,
    //   `top ${industry} brands India -amazon -flipkart -nykaa -myntra`,
    //   `${industry} ecommerce website India site:.in`,
    //   ...(keywords || []).map((k) => `${k} ${industry} brand India site:.com`),
    // ];

const queries = [
  `${industry} brand official website India`,
  `top ${industry} brands India site:.com`,
  `${industry} ecommerce D2C brands India`,
  `${industry} company site:.in`,
  `"buy ${industry}" "India" site:.com`,
  ...(keywords || []).map((k) => `${k} ${industry} brand India site:.com`),
];


    const webLinks = await webSearchLinks(queries);
    const limitFn = pLimit(CONCURRENCY);

    const crawled = await Promise.allSettled(
      webLinks.slice(0, MAX_SEARCH_RESULTS).map((link) =>
        limitFn(() => crawlSite(link))
      )
    );

    const websiteLeads = [];
    const discoveredLinks = new Set();

    crawled.forEach((r) => {
      if (r.status === "fulfilled" && r.value) {
        websiteLeads.push({
          brand: (r.value.domain || "").split(".")[0],
          ...r.value,
          marketplace_only: false,
          marketplaces: [],
          industry,
          country: "IN",
          source: "SeedLink",
        });

        r.value.discoveredBrands.forEach((l) => discoveredLinks.add(l));
      }
    });

    console.log(`🔎 Found ${discoveredLinks.size} discovered brand links from blogs/articles.`);

    const discoveredResults = await Promise.allSettled(
      [...discoveredLinks].slice(0, MAX_SEARCH_RESULTS).map((link) =>
        limitFn(() => crawlSite(link))
      )
    );

    const discoveredLeads = discoveredResults
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => ({
        brand: (r.value.domain || "").split(".")[0],
        ...r.value,
        marketplace_only: false,
        marketplaces: [],
        industry,
        country: "IN",
        source: "Discovered",
      }));

    const leads = [...websiteLeads, ...discoveredLeads].slice(0, limit);

    console.log(`🎯 Final leads count: ${leads.length}`);
    leads.forEach((l, i) => console.log(`${i + 1}. ${l.domain || l.url}`));

    let saved = 0;
    try {
      if (leads.length) saved = await saveLeads(leads);
    } catch {}

    const csvPath = await exportToCSV(leads);

    return res.status(200).json({
      count: leads.length,
      saved,
      csv: csvPath,
      leads,
      meta: {
        discovered_links: discoveredLinks.size,
        crawled_links: webLinks.length,
      },
    });
  } catch (err) {
    console.error("❌ ecom-scrape error:", err);
    return res.status(500).json({ error: err.message });
  }
}
