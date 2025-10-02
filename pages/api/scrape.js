




// // generating leads good ammount but not saving in mongo db 

// import { load } from "cheerio";
// import fetch from "node-fetch";
// import { saveLeads } from "../../lib/mongodb";

// const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";
// const GRID_STEP_KM = 50;
// const GRID_RADIUS_M = 2500;
// const MAX_PAGES = 2;
// const CONTACT_PATHS = ["/", "/contact", "/contact-us"];
// const REQUEST_DELAY_MS = 250;

// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// async function safeFetch(url, options = {}, retries = 2) {
//   for (let i = 0; i <= retries; i++) {
//     try {
//       const controller = new AbortController();
//       const id = setTimeout(() => controller.abort(), 10000);
//       const res = await fetch(url, {
//         ...options,
//         signal: controller.signal,
//         headers: { "User-Agent": UA, ...(options.headers || {}) },
//       });
//       clearTimeout(id);
//       if (!res.ok) throw new Error(`HTTP ${res.status}`);
//       return res;
//     } catch (err) {
//       if (i === retries) throw err;
//       console.warn(`⚠️ Fetch failed ${url} – retrying (${i + 1}/${retries})`);
//       await sleep(400 * (i + 1));
//     }
//   }
// }

// function extractEmailsPhones(html) {
//   const emails = Array.from(
//     new Set((html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map((s) => s.toLowerCase()))
//   );
//   const phones = Array.from(new Set(html.match(/(\+?\d[\d\s\-().]{8,}\d)/g) || []));
//   return { emails, phones };
// }

// async function scrapeSiteQuick(baseUrl) {
//   console.log(`   🌐 Scraping site: ${baseUrl}`);
//   const origin = new URL(baseUrl).origin;
//   const allEmails = new Set();
//   const allPhones = new Set();

//   for (const p of CONTACT_PATHS) {
//     const url = new URL(p, origin).href;
//     try {
//       console.log(`      📄 Fetching: ${url}`);
//       const html = await (await safeFetch(url)).text();
//       const { emails, phones } = extractEmailsPhones(html);
//       emails.forEach((e) => allEmails.add(e));
//       phones.forEach((p) => allPhones.add(p));
//       await sleep(REQUEST_DELAY_MS);
//     } catch (err) {
//       console.warn(`      ❌ Failed to fetch ${url}: ${err.message}`);
//     }
//   }

//   return { emails: Array.from(allEmails), phones: Array.from(allPhones) };
// }

// function kmToDegLat(km) { return km / 110.574; }
// function kmToDegLng(km, lat) { return km / (111.320 * Math.cos((lat * Math.PI) / 180)); }

// async function buildGridForArea(area) {
//   console.log(`🗺 Geocoding area: ${area}`);
//   const key = process.env.GOOGLE_MAPS_API_KEY;
//   const geoRes = await safeFetch(
//     `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(area)}&key=${key}`
//   );
//   const geo = await geoRes.json();
//   if (!geo.results?.length) throw new Error("Geocode failed for area");

//   const { lat, lng } = geo.results[0].geometry.location;
//   const stepLat = kmToDegLat(GRID_STEP_KM);
//   const stepLng = kmToDegLng(GRID_STEP_KM, lat);

//   const grid = [];
//   for (let dx = -1; dx <= 1; dx++) {
//     for (let dy = -1; dy <= 1; dy++) {
//       grid.push([Number((lat + dx * stepLat).toFixed(6)), Number((lng + dy * stepLng).toFixed(6))]);
//     }
//   }
//   console.log(`  ✅ Built grid with ${grid.length} tiles`);
//   return grid;
// }

// async function placesNearby({ lat, lng, radius }) {
//   const key = process.env.GOOGLE_MAPS_API_KEY;
//   const url = (pagetoken) =>
//     `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=lodging&key=${key}${pagetoken ? `&pagetoken=${pagetoken}` : ""}`;
//   let token = null;
//   const results = [];
//   for (let i = 0; i < MAX_PAGES; i++) {
//     if (token) await sleep(2000);
//     const data = await (await safeFetch(url(token))).json();
//     results.push(...(data.results || []));
//     token = data.next_page_token;
//     if (!token) break;
//   }
//   console.log(`  🏨 Found ${results.length} places near [${lat},${lng}]`);
//   return results;
// }

// async function placeDetails(place_id) {
//   const key = process.env.GOOGLE_MAPS_API_KEY;
//   const fields = "place_id,website,formatted_phone_number,rating";
//   const u = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${key}`;
//   return (await (await safeFetch(u)).json()).result || {};
// }

// async function scrapeLocal({ industry, area }) {
//   const grid = await buildGridForArea(area);
//   const seen = new Set();
//   const leads = [];

//   for (const [lat, lng] of grid) {
//     console.log(`🔎 Scanning tile lat=${lat}, lng=${lng}`);
//     const near = await placesNearby({ lat, lng, radius: GRID_RADIUS_M });
//     for (const r of near) {
//       const pid = r.place_id;
//       if (!pid || seen.has(pid)) continue;
//       seen.add(pid);

//       const detail = await placeDetails(pid);
//       const website = detail.website;
//       const phone = detail.formatted_phone_number;
//       if (!website && !phone) continue;

//       let emails = [], phones = phone ? [phone] : [];
//       if (website) {
//         const scraped = await scrapeSiteQuick(website);
//         emails = scraped.emails;
//         phones = [...new Set([...phones, ...scraped.phones])];
//       }

//       if (emails.length || phones.length) {
//         console.log(`      ✅ Lead found: ${website || "(no website)"}`);
//         leads.push({
//           url: website,
//           domain: website ? new URL(website).hostname.replace(/^www\./, "") : null,
//           emails,
//           phones,
//           industry,
//           area,
//           source: "places",
//         });
//       }
//     }
//   }
//   console.log(`✅ Local scrape done: ${leads.length} leads`);
//   return leads;
// }

// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     res.setHeader("Allow", "POST");
//     return res.status(405).json({ error: "Method Not Allowed" });
//   }

//   try {
//     const { industry, area } = req.body || {};
//     if (!industry || !area) return res.status(400).json({ error: "Industry and area required" });

//     console.log(`🚀 Starting scrape for: ${industry} in ${area}`);
//     const leads = await scrapeLocal({ industry, area });

//     console.log(`🧹 Deduplicating ${leads.length} leads...`);
//     const saved = await saveLeads(leads);
//     console.log(`💾 Saved ${saved} leads to MongoDB`);

//     return res.status(200).json({
//       count: leads.length,
//       saved,
//       leads,
//     });
//   } catch (err) {
//     console.error("❌ scrape error:", err);
//     return res.status(500).json({ error: err.message });
//   }
// }







// C:\sanket\email-campaign-next\pages\api\scrape.js
import { load } from "cheerio";
import fetch from "node-fetch";
import { promises as fs } from "fs";
import path from "path";
import { saveLeads } from "../../lib/mongodb";

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";
const GRID_STEP_KM = 50;
const GRID_RADIUS_M = 2500;
const MAX_PAGES = 2;
const CONTACT_PATHS = ["/", "/contact", "/contact-us"];
const REQUEST_DELAY_MS = 250;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function safeFetch(url, options = {}, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: { "User-Agent": UA, ...(options.headers || {}) },
      });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      console.warn(`⚠️ Fetch failed ${url} (${err.message}) retry ${i + 1}/${retries}`);
      if (i === retries) throw err;
      await sleep(400 * (i + 1));
    }
  }
}

function extractEmailsPhones(html) {
  const emails = Array.from(
    new Set((html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map((s) => s.toLowerCase()))
  );
  const phones = Array.from(new Set(html.match(/(\+?\d[\d\s\-().]{8,}\d)/g) || []));
  return { emails, phones };
}

async function scrapeSiteQuick(baseUrl) {
  console.log(`   🌐 Scraping site: ${baseUrl}`);
  const origin = new URL(baseUrl).origin;
  const allEmails = new Set();
  const allPhones = new Set();

  for (const p of CONTACT_PATHS) {
    const url = new URL(p, origin).href;
    try {
      console.log(`      📄 Fetching: ${url}`);
      const html = await (await safeFetch(url)).text();
      const { emails, phones } = extractEmailsPhones(html);
      emails.forEach((e) => allEmails.add(e));
      phones.forEach((p) => allPhones.add(p));
      await sleep(REQUEST_DELAY_MS);
    } catch (err) {
      console.warn(`      ❌ Failed: ${url} (${err.message})`);
    }
  }

  return { emails: Array.from(allEmails), phones: Array.from(allPhones) };
}

function kmToDegLat(km) {
  return km / 110.574;
}
function kmToDegLng(km, lat) {
  return km / (111.320 * Math.cos((lat * Math.PI) / 180));
}

async function buildGridForArea(area) {
  console.log(`🗺 Geocoding area: ${area}`);
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const geoRes = await safeFetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(area)}&key=${key}`
  );
  const geo = await geoRes.json();
  if (!geo.results?.length) throw new Error("Geocode failed for area");

  const { lat, lng } = geo.results[0].geometry.location;
  const stepLat = kmToDegLat(GRID_STEP_KM);
  const stepLng = kmToDegLng(GRID_STEP_KM, lat);

  const grid = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      grid.push([Number((lat + dx * stepLat).toFixed(6)), Number((lng + dy * stepLng).toFixed(6))]);
    }
  }
  console.log(`  ✅ Built grid with ${grid.length} tiles`);
  return grid;
}

async function placesNearby({ lat, lng, radius }) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const url = (pagetoken) =>
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=salon&key=${key}${pagetoken ? `&pagetoken=${pagetoken}` : ""}`;
  let token = null;
  const results = [];
  for (let i = 0; i < MAX_PAGES; i++) {
    if (token) await sleep(2000);
    const data = await (await safeFetch(url(token))).json();
    results.push(...(data.results || []));
    token = data.next_page_token;
    if (!token) break;
  }
  console.log(`  🏨 Found ${results.length} places near [${lat},${lng}]`);
  return results;
}

async function placeDetails(place_id) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const fields = "place_id,website,formatted_phone_number,rating";
  const u = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${key}`;
  return (await (await safeFetch(u)).json()).result || {};
}

async function scrapeLocal({ industry, area }) {
  const grid = await buildGridForArea(area);
  const seen = new Set();
  const leads = [];

  for (const [lat, lng] of grid) {
    console.log(`🔎 Scanning tile lat=${lat}, lng=${lng}`);
    const near = await placesNearby({ lat, lng, radius: GRID_RADIUS_M });
    for (const r of near) {
      const pid = r.place_id;
      if (!pid || seen.has(pid)) continue;
      seen.add(pid);

      const detail = await placeDetails(pid);
      const website = detail.website;
      const phone = detail.formatted_phone_number;
      if (!website && !phone) continue;

      let emails = [],
        phones = phone ? [phone] : [];
      if (website) {
        const scraped = await scrapeSiteQuick(website);
        emails = scraped.emails;
        phones = [...new Set([...phones, ...scraped.phones])];
      }

      if (emails.length || phones.length) {
        leads.push({
          url: website,
          domain: website ? new URL(website).hostname.replace(/^www\./, "") : null,
          emails,
          phones,
          industry,
          area,
          source: "places",
        });
      }
    }
  }
  console.log(`✅ Local scrape done: ${leads.length} leads`);
  return leads;
}

async function exportToCSV(leads) {
  if (!leads.length) return null;

  const csvHeader = "Domain,URL,Emails,Phones,Industry,Area\n";
  const csvRows = leads
    .map((l) =>
      [
        l.domain || "",
        l.url || "",
        l.emails.join("; "),
        l.phones.join("; "),
        l.industry,
        l.area,
      ]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const csvContent = csvHeader + csvRows;
  const fileName = `leads-${Date.now()}.csv`;
  const filePath = path.join(process.cwd(), "public", "downloads", fileName);

  // Ensure folder exists
  await fs.mkdir(path.join(process.cwd(), "public", "downloads"), { recursive: true });
  await fs.writeFile(filePath, csvContent, "utf-8");

  console.log(`📁 CSV exported: /downloads/${fileName}`);
  return `/downloads/${fileName}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { industry, area } = req.body || {};
    if (!industry || !area) return res.status(400).json({ error: "Industry and area required" });

    console.log(`🚀 Starting scrape for: ${industry} in ${area}`);
    const leads = await scrapeLocal({ industry, area });

    console.log(`🧹 Deduplicating ${leads.length} leads...`);
    const savedCount = await saveLeads(leads);

    const csvUrl = await exportToCSV(leads);

    return res.status(200).json({
      count: leads.length,
      saved: savedCount,
      csv: csvUrl,
      leads,
    });
  } catch (err) {
    console.error("❌ scrape error:", err);
    return res.status(500).json({ error: err.message });
  }
}
