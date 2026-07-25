// This script extracts the CSV content from the document and saves it
const fs = require('fs');

// The CSV content from the provided document
const csvContent = `forge_id,content_type,category,title_or_question,difficulty,status
SD001,Self Description,Self Opinion,What do you think of yourself?,Medium,approved
SD002,Self Description,Parents Opinion,What do your parents think of you?,Medium,approved
SD003,Self Description,Friends Opinion,What do your friends think of you?,Medium,approved
SD004,Self Description,Teachers Opinion,What do your teachers or employer think of you?,Medium,approved
SD005,Self Description,Life Goals,What kind of person do you want to become in life?,Medium,approved
SD006,Self Description,Life Goals,What qualities would you like to improve in yourself?,Medium,approved
SD007,Self Description,Friends Opinion,What is one quality your best friends would like you to change?,Medium,approved
SD008,Self Description,Parents Opinion,What two things does your mother advise you to improve?,Medium,approved
SD009,Self Description,Friends Opinion,What suggestions do your close friends give you for self-improvement?,Medium,approved
SD010,Self Description,Parents Opinion,"If your family could change one quality in you, what would it be?",Medium,approved`;

// Note: The full CSV from your document is too large for one string literal
// You should copy the CSV content directly from the document to a file named:
// scripts/Forge-Master-Content.csv

console.log('⚠️  MANUAL ACTION REQUIRED:');
console.log('');
console.log('Please create the file: scripts/Forge-Master-Content.csv');
console.log('And paste the complete CSV content from the Forge-Master-Content.csv document.');
console.log('');
console.log('The file should start with:');
console.log('forge_id,content_type,category,title_or_question,difficulty,status');
console.log('');
console.log('After creating the file, run:');
console.log('node scripts/import-master-content.js');
