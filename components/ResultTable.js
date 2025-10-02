// export default function ResultTable({ results }) {
//   if (!results.length) return null;

//   return (
//     <div className="mt-8">
//       <h3 className="text-lg font-semibold text-blue-600 mb-2">Results</h3>
//       <table className="table-auto w-full border border-gray-300 text-sm">
//         <thead className="bg-gray-100">
//           <tr>
//             <th className="border px-3 py-2 text-left">Email</th>
//             <th className="border px-3 py-2 text-left">Status</th>
//             <th className="border px-3 py-2 text-left">Error</th>
//           </tr>
//         </thead>
//         <tbody>
//           {results.map((r, i) => (
//             <tr key={i}>
//               <td className="border px-3 py-2">{r.email}</td>
//               <td className="border px-3 py-2">{r.status}</td>
//               <td className="border px-3 py-2 text-red-600">{r.error || '-'}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }






export default function ResultTable({ results }) {
  if (!results.length) return null;

  return (
    <div className="report-table-container">
      <h3 className="report-title">Detailed Send Report</h3>
      <div className="scroll-table">
        <table className="report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Email</th>
              <th>Status</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className={r.status === "failed" ? "row-failed" : r.status === "skipped" ? "row-skipped" : ""}>
                <td>{i + 1}</td>
                <td>{r.email}</td>
                <td>
                  {r.status === "sent" && <span className="status sent">Sent</span>}
                  {r.status === "failed" && <span className="status failed">Failed</span>}
                  {r.status === "skipped" && <span className="status skipped">Skipped</span>}
                </td>
                <td>{r.error || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
