





// C:\sanket\email-campaign-next\pages\index.js
// 
import { useState } from "react";
import FileUpload from "../components/FileUpload";
import EmailComposer from "../components/EmailComposer";
import EmailPreview from "../components/EmailPreview";
import SendControls from "../components/SendControls";
import ResultTable from "../components/ResultTable";

export default function Home() {
  const [data, setData] = useState([]);
  const [subject, setSubject] = useState("Quick intro: Tresto for {{Property}} in {{Location}}");
  const [template, setTemplate] = useState("");
  const [results, setResults] = useState([]);

  return (
    <div className="main-container">
      <h1>Email Campaign — Compose & Preview</h1>

      {/* 1. File Upload */}
      <div className="section">
        <FileUpload onDataParsed={setData} />
      </div>

      {/* 2. Compose */}
      <div className="section">
        <div className="section-title">2) Compose & Preview</div>
        <EmailComposer
          subject={subject}
          setSubject={setSubject}
          template={template}
          setTemplate={setTemplate}
        />
      </div>

      {/* 3. Preview */}
      <div className="section">
        <div className="section-title">3) Preview </div>
        {data.length > 0 ? (
          <EmailPreview data={data} template={template} />
        ) : (
          <div className="info-box">Upload a file and enter a template to see the preview.</div>
        )}
      </div>

      {/* 4. Send Controls */}
      <div className="section">
        <SendControls
          data={data}
          subject={subject}
          template={template}
          onSendComplete={setResults}
        />
      </div>

      {/* 5. Results */}
      <ResultTable results={results} />
    </div>
  );
}
