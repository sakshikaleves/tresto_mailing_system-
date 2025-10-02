// import * as XLSX from 'xlsx';

// export default function FileUpload({ onDataParsed }) {
//   const handleFile = async (e) => {
//     const file = e.target.files[0];
//     const reader = new FileReader();
//     reader.onload = (evt) => {
//       const data = evt.target.result;
//       const wb = XLSX.read(data, { type: 'binary' });
//       const sheet = wb.Sheets[wb.SheetNames[0]];
//       const json = XLSX.utils.sheet_to_json(sheet);
//       onDataParsed(json);
//     };
//     reader.readAsBinaryString(file);
//   };

//   return (
//     <div>
//       <h3>1) Upload CSV/XLSX</h3>
//    <input
//   type="file"
//   className="w-full border border-base-gray p-2 rounded shadow-sm"
// />

//     </div>
//   );
// }






import * as XLSX from 'xlsx';

export default function FileUpload({ onDataParsed }) {
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = evt.target.result;
      const isCSV = file.name.toLowerCase().endsWith('.csv');

      const workbook = XLSX.read(data, {
        type: isCSV ? 'string' : 'binary',
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      if (json.length > 0) {
        onDataParsed(json);
      } else {
        alert('Could not parse file or it is empty.');
      }
    };

    if (file.name.toLowerCase().endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="font-medium text-base">Upload CSV/XLSX</label>
   <input
  type="file"
  accept=".csv,.xlsx"
  onChange={handleFile}
  className="input-box"
/>

    </div>
  );
}
