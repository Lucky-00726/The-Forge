const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

async function main() {
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYJrADaXkcTrfJWYu9mQPfyQu_d2FLm5EOA0SUiE2LmRXsQYizSHTGc64SODF8DSl1ET72iIKi2M10/pub?output=csv';
  console.log(`Fetching Google Sheet from: ${sheetUrl}`);
  
  const res = await fetch(sheetUrl);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const text = await res.text();
  const rows = parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true, trim: true });
  
  console.log(`Loaded ${rows.length} rows.`);
  
  // Find highest existing numbered IDs
  let maxSRT = 152; // Default starting point if not found higher
  let maxPI = 0;
  
  rows.forEach(row => {
    const id = (row.content_id || row.id || '').trim();
    if (id.startsWith('SRT')) {
      const num = parseInt(id.replace('SRT', ''), 10);
      if (!isNaN(num) && num > maxSRT) maxSRT = num;
    }
    if (id.startsWith('PI')) {
      const num = parseInt(id.replace('PI', ''), 10);
      if (!isNaN(num) && num > maxPI) maxPI = num;
    }
  });
  
  console.log(`Highest existing SRT ID in sheet: SRT${String(maxSRT).padStart(4, '0')}`);
  console.log(`Highest existing PI ID in sheet: PI${String(maxPI).padStart(4, '0')}`);
  
  let assignedSRTCount = 0;
  let assignedPICount = 0;
  
  const updatedRows = rows.map((row, idx) => {
    let id = (row.content_id || row.id || '').trim();
    const type = (row.question_type || '').trim();
    
    if (!id) {
      if (type === 'SRT') {
        maxSRT++;
        id = `SRT${String(maxSRT).padStart(4, '0')}`;
        assignedSRTCount++;
      } else if (type === 'Personal Interview' || type === 'Interview' || type === 'Personal_Interview') {
        maxPI++;
        id = `PI${String(maxPI).padStart(4, '0')}`;
        assignedPICount++;
      } else {
        // Fallback generic ID
        id = `${type.substring(0, 3).toUpperCase()}${String(idx + 1).padStart(4, '0')}`;
      }
      
      // Update both id and content_id columns
      row.id = id;
      row.content_id = id;
    }
    
    return row;
  });
  
  console.log(`Assigned ${assignedSRTCount} new stable SRT IDs.`);
  console.log(`Assigned ${assignedPICount} new stable PI IDs.`);
  
  const csvContent = stringify(updatedRows, { header: true });
  const outPath = path.join('scripts', 'Forge-Master-Content-Updated.csv');
  fs.writeFileSync(outPath, csvContent, 'utf-8');
  console.log(`Saved updated content to: ${outPath}`);
}

main().catch(console.error);
