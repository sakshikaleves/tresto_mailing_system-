// import { useRef, useState } from 'react';

// export default function SendControls({ data, subject, template, onSendComplete }) {
//   const fileRef = useRef();
//   const [sending, setSending] = useState(false);

//   const handleSend = async () => {
//     setSending(true);
//     const formData = new FormData();
//     formData.append('data', JSON.stringify(data));
//     formData.append('subject', subject);
//     formData.append('template', template);
//     if (fileRef.current?.files[0]) {
//       formData.append('attachment', fileRef.current.files[0]);
//     }

//     const res = await fetch('/api/send', {
//       method: 'POST',
//       body: formData
//     });

//     const result = await res.json();
//     setSending(false);
//     onSendComplete(result.status || []);
//   };

//   return (
//     <div>
//       <h3>4) Send Emails</h3>
// <input type="file" ref={fileRef} className="input-box" />
// <button
//   className="button"
//   onClick={handleSend}
//   disabled={sending}
// >
//   {sending ? "Sending..." : "Send Emails"}
// </button>

//     </div>
//   );
// }



import { useRef, useState } from 'react';

export default function SendControls({ data, subject, template, onSendComplete }) {
  const fileRef = useRef();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    formData.append('subject', subject);
    formData.append('template', template);
    if (fileRef.current?.files[0]) {
      formData.append('attachment', fileRef.current.files[0]);
    }

    const res = await fetch('/api/send', {
      method: 'POST',
      body: formData
    });

    const json = await res.json();
    setSending(false);
    setResult(json.status || []);
    onSendComplete(json.status || []);
  };

  // Calculate summary
  let sent = 0, failed = 0, skipped = 0;
  if (result && result.length) {
    sent = result.filter(r => r.status === "sent").length;
    failed = result.filter(r => r.status === "failed").length;
    skipped = result.filter(r => r.status === "skipped").length;
  }

  return (
    <div>
      {/* Attachment Section */}
      <div className="form-group">
        <div className="section-title" style={{ fontSize: "1.05rem", marginTop: 0 }}>Attachment (optional)</div>
        <div
          className="input-box"
          style={{
            background: "#f3f5f8",
            padding: "14px 18px",
            borderRadius: "10px",
            border: "1px solid #edeef2",
            width: "100%",
            display: "flex",
            alignItems: "center"
          }}
        >
          <input
            type="file"
            ref={fileRef}
            style={{ border: "none", background: "transparent", fontSize: 16 }}
          />
        </div>
      </div>

      {/* Send Button */}
      {/* <div style={{ marginTop: 20 }}>
        <button
          className="button"
          onClick={handleSend}
          disabled={sending}
          style={{ width: 180, fontWeight: 600, fontSize: "1.09rem" }}
        >
          {sending ? "Sending..." : "Send Emails"}
        </button>
      </div>

     Report Section 
      {result && result.length > 0 && (
        <div className="info-box" style={{ marginTop: 24 }}>
          <b>Mail Report:</b> Sent: <span style={{ color: "#22c55e" }}>{sent}</span>,
          Failed: <span style={{ color: "#ef4444" }}>{failed}</span>,
          Skipped: <span style={{ color: "#f59e42" }}>{skipped}</span>
        </div>
      )} */}




{/* Loader Bar */}
{sending && (
  <div
    style={{
      width: "100%",
      margin: "24px 0 8px 0",
      background: "#f3f5f8",
      borderRadius: 8,
      height: 14,
      boxShadow: "0 2px 8px #e2e4f5"
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(90deg,#2563eb 20%,#5fa8ee 80%)",
        borderRadius: 8,
        animation: "loader-bar 1.2s linear infinite"
      }}
    ></div>
    {/* Loader bar animation keyframes */}
    <style>{`
      @keyframes loader-bar {
        0% { opacity: 0.7; width: 10%; }
        60% { opacity: 1; width: 100%; }
        100% { opacity: 0.7; width: 10%; }
      }
    `}</style>
  </div>
)}

<div style={{ marginTop: 20 }}>
  <button
    className="button"
    onClick={handleSend}
    disabled={sending}
    style={{ width: 180, fontWeight: 600, fontSize: "1.09rem" }}
  >
    {sending ? (
      <>
        <span className="loader" style={{ marginRight: 8 }} />
        Sending...
      </>
    ) : (
      "Send Emails"
    )}
  </button>
</div>

{/* Report Section */}
{result && result.length > 0 && (
  <div
    className="info-box"
    style={{
      marginTop: 24,
      padding: "22px 24px",
      // background: "#eef6fa",
      border: "1.5px solid #2563eb33",
      // boxShadow: "0 1px 7px #c0e5ff28",
      fontSize: "1.09rem",
      borderRadius: "11px",
      // color: "#2e3859",
      display: "flex",
      flexDirection: "column",
      alignItems: "start",
      gap: 10
    }}
  >
    <div style={{ fontWeight: 600, fontSize: "1.13rem" }}>
      <span style={{ marginRight: 8 }}></span>
      Mail Report
    </div>
    <div>
      <span style={{ marginRight: 10 }}>
        ✅ <b>Sent:</b> <span style={{ color: "#22c55e" }}>{sent}</span>
      </span>
      <span style={{ marginRight: 10 }}>
        ❌ <b>Failed:</b> <span style={{ color: "#ef4444" }}>{failed}</span>
      </span>
      <span>
        ⏭️ <b>Skipped:</b> <span style={{ color: "#f59e42" }}>{skipped}</span>
      </span>
    </div>
    <button
      className="button"
      style={{
        background: "#e2e8f0",
        color: "#2563eb",
        border: "1.2px solid #cbd5e1",
        padding: "7px 18px",
        borderRadius: 8,
        marginTop: 8,
        fontSize: "0.97rem"
      }}
      onClick={() => {
        // Download as CSV
        const csvRows = [
          "Email,Status,Error",
          ...result.map(r => `"${r.email}","${r.status}","${r.error || '-'}"`)
        ];
        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mail_report.csv";
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      ⬇️ Download Report
    </button>
  </div>
)}







    </div>
  );
}
