const { parse } = require('csv-parse/sync');

async function main() {
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYJrADaXkcTrfJWYu9mQPfyQu_d2FLm5EOA0SUiE2LmRXsQYizSHTGc64SODF8DSl1ET72iIKi2M10/pub?output=csv';
  
  const res = await fetch(sheetUrl);
  const text = await res.text();
  const rows = parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true });
  
  const missingByTypes = {};
  
  rows.forEach((row) => {
    const id = (row.content_id || row.id || '').trim();
    const type = (row.question_type || '').trim();
    
    if (!id) {
      missingByTypes[type] = (missingByTypes[type] || 0) + 1;
    }
  });
  
  console.log('\nMissing stable IDs in Google Sheet by Question Type:');
  console.log(missingByTypes);
}

main().catch(console.error);
