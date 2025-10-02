import multiparty from 'multiparty';
import fs from 'fs';
import { sendEmailRotating } from '../../lib/smtp';
import { renderTemplate } from '../../lib/template';

// Disable default body parser so we can use multiparty
export const config = {
  api: { bodyParser: false }
};

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const form = new multiparty.Form();

//   form.parse(req, async (err, fields, files) => {
//     if (err) return res.status(500).json({ error: 'Form parsing failed' });

//     const data = JSON.parse(fields.data[0]);
//     const subject = fields.subject[0];
//     const template = fields.template[0];
//     const attachment = files.attachment?.[0];
//     const status = [];

//     for (const row of data) {
//       const email = row.Email || row.email;
//       if (!email) {
//         status.push({ email: '', status: 'skipped', error: 'No email' });
//         continue;
//       }

//       try {
//         const html = renderTemplate(template, row);
//         const text = html.replace(/<[^>]+>/g, '');
//         const subj = renderTemplate(subject, row);

//         let attachOptions = null;
//         if (attachment) {
//           attachOptions = {
//             filename: attachment.originalFilename,
//             path: attachment.path
//           };
//         }

//         await sendEmailRotating(email, subj, html, text, attachOptions);
//         status.push({ email, status: 'sent' });
//       } catch (e) {
//         status.push({ email, status: 'failed', error: e.message });
//       }
//     }

//     if (attachment) {
//       fs.unlink(attachment.path, () => {});
//     }

//     res.status(200).json({ status });
//   });
// }


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log("Wrong method", req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parsing failed:", err);
      return res.status(500).json({ error: 'Form parsing failed' });
    }

    // Add logging here
    console.log("Fields received:", fields);
    console.log("Files received:", files);

    const data = JSON.parse(fields.data[0]);
    const subject = fields.subject[0];
    const template = fields.template[0];
    const attachment = files.attachment?.[0];
    const status = [];

    for (const row of data) {
      const email = row.Email || row.email;
      if (!email) {
        status.push({ email: '', status: 'skipped', error: 'No email' });
        continue;
      }

      try {
        console.log("Preparing email for:", email);

        const html = renderTemplate(template, row);
        const text = html.replace(/<[^>]+>/g, '');
        const subj = renderTemplate(subject, row);

        let attachOptions = null;
        if (attachment) {
          attachOptions = {
            filename: attachment.originalFilename,
            path: attachment.path
          };
        }

        // Log sending
        console.log("Sending email to:", email, "with subject:", subj);

        await sendEmailRotating(email, subj, html, text, attachOptions);

        console.log("Email sent to:", email);

        status.push({ email, status: 'sent' });
      } catch (e) {
        console.error("Error sending email to", email, e);
        status.push({ email, status: 'failed', error: e.message });
      }
    }

    if (attachment) {
      fs.unlink(attachment.path, () => {});
    }

    res.status(200).json({ status });
  });
}
