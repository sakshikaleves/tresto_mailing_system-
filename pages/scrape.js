// import { useState } from 'react';

// export default function ScrapePage() {
//   const [industry, setIndustry] = useState('');
//   const [area, setArea] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);

//   const handleScrape = async () => {
//     setLoading(true);
//     const res = await fetch('/api/scrape', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ industry, area })
//     });
//     const data = await res.json();
//     setResult(data);
//     setLoading(false);
//   };

//   return (
//     <div className="p-6 max-w-2xl mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Scrape Leads</h1>

//       <input
//         className="border p-2 mr-2"
//         placeholder="Industry"
//         value={industry}
//         onChange={e => setIndustry(e.target.value)}
//       />
//       <input
//         className="border p-2 mr-2"
//         placeholder="Area"
//         value={area}
//         onChange={e => setArea(e.target.value)}
//       />
//       <button onClick={handleScrape} className="bg-blue-600 text-white px-4 py-2 rounded">
//         {loading ? 'Scraping...' : 'Scrape'}
//       </button>

//       {result && (
//         <div className="mt-6">
//           <p className="font-semibold">✅ {result.count} leads scraped.</p>
//         </div>
//       )}
//     </div>
//   );
// }



// import { useState } from "react";

// export default function ScrapePage() {
//   const [industry, setIndustry] = useState("");
//   const [area, setArea] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState(null);

//   const handleScrape = async () => {
//     setError(null);
//     setResult(null);

//     if (!industry.trim() || !area.trim()) {
//       setError("⚠️ Please enter both industry and area.");
//       return;
//     }

//     try {
//       setLoading(true);
//       const res = await fetch("/api/scrape", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         // body: JSON.stringify({ industry, area }),
//         body: JSON.stringify({ term: `${industry} in ${area}` }),

//       });

//       if (!res.ok) {
//         const errData = await res.json().catch(() => ({}));
//         throw new Error(errData.error || `Request failed with ${res.status}`);
//       }

//       const data = await res.json();
//       setResult(data);
//     } catch (err) {
//       console.error("❌ Scrape failed:", err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 max-w-4xl mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Scrape Leads</h1>

//       <div className="flex gap-2 mb-4">
//         <input
//           className="border p-2 flex-1"
//           placeholder="Industry (e.g. hotels, e-commerce)"
//           value={industry}
//           onChange={(e) => setIndustry(e.target.value)}
//         />
//         <input
//           className="border p-2 flex-1"
//           placeholder="Area (e.g. Mumbai, Delhi)"
//           value={area}
//           onChange={(e) => setArea(e.target.value)}
//         />
//         <button
//           onClick={handleScrape}
//           disabled={loading}
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
//         >
//           {loading ? "Scraping..." : "Scrape"}
//         </button>
//       </div>

//       {error && <p className="text-red-600">{error}</p>}

//       {result && (
//         <div className="mt-6">
//           <p className="font-semibold mb-3">✅ {result.count} leads scraped.</p>

//           {result.leads && result.leads.length > 0 && (
//             <div className="overflow-x-auto">
//               <table className="border-collapse border border-gray-300 w-full text-sm">
//                 <thead>
//                   <tr className="bg-gray-100">
//                     <th className="border p-2">Domain</th>
//                     <th className="border p-2">Emails</th>
//                     <th className="border p-2">Phones</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {result.leads.map((lead, idx) => (
//                     <tr key={idx}>
//                       <td className="border p-2">
//                         <a
//                           href={lead.url}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-blue-600 hover:underline"
//                         >
//                           {lead.domain}
//                         </a>
//                       </td>
//                       <td className="border p-2">{lead.emails.join(", ") || "-"}</td>
//                       <td className="border p-2">{lead.phones.join(", ") || "-"}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>


//           )}
//         </div>
//       )}
//     </div>
//   );
// }





// C:\sanket\email-campaign-next\pages\scrape.js
import { useState } from "react";

export default function ScrapePage() {
  const [industry, setIndustry] = useState("");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScrape = async () => {
    setError(null);
    setResult(null);

    if (!industry.trim() || !area.trim()) {
      setError("⚠️ Please enter both industry and area.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, area }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setResult(data);

      // ✅ Automatically trigger CSV download if available
      if (data.csv) {
        console.log("📥 Downloading CSV:", data.csv);
        // Trigger a download in the browser
        const link = document.createElement("a");
        link.href = data.csv;
        link.download = data.csv.split("/").pop(); // suggest file name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("❌ Scrape failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Scrape Leads</h1>

      <div className="flex gap-2 mb-4">
        <input
          className="border p-2 flex-1"
          placeholder="Industry (e.g. hotels, e-commerce)"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        />
        <input
          className="border p-2 flex-1"
          placeholder="Area (e.g. Mumbai, Delhi)"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />
        <button
          onClick={handleScrape}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Scraping..." : "Scrape"}
        </button>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <div className="mt-6">
          <p className="font-semibold mb-3">
            ✅ {result.count} leads scraped & saved to database.
          </p>
          {result.csv && (
            <p className="text-green-700">
              📁 CSV file created:{" "}
              <a
                href={result.csv}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600"
              >
                {result.csv.split("/").pop()}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
