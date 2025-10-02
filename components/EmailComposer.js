// export default function EmailComposer({ subject, setSubject, template, setTemplate }) {
 
//   return (
//     <div className="space-y-4">
//       <input
//         type="text"
//         value={subject}
//         onChange={(e) => setSubject(e.target.value)}
//         placeholder="Subject"
//         className="w-full p-2 border border-base-gray rounded shadow-sm"
//       />
//       <textarea
//         value={template}
//         onChange={(e) => setTemplate(e.target.value)}
//         placeholder="HTML template..."
//         rows={10}
//         className="w-full p-2 border border-base-gray rounded shadow-sm"
//       />
//     </div>
//   );
// }


export default function EmailComposer({ subject, setSubject, template, setTemplate }) {
  return (
    <div className="space-y-4">
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        className="input-box"
      />
      <textarea
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        placeholder="HTML template..."
        rows={10}
        className="textarea-box"
      />
    </div>
  );
}
