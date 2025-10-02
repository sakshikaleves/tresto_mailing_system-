import { renderTemplate } from '../lib/template';

export default function EmailPreview({ data, template }) {
  const sample = data[0] || {};
  const preview = renderTemplate(template, sample);

  return (
    // <div>
    //   <h3>3) Preview (Row 0)</h3>
    //   <div dangerouslySetInnerHTML={{ __html: preview }} style={{ border: '1px solid #ccc', padding: 10 }} />
    // </div>
    <div className="border border-base-gray p-4 rounded shadow-sm max-h-[600px] overflow-auto">
  <div dangerouslySetInnerHTML={{ __html: preview }} />
</div>

  );
}
