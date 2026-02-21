const fs = require('fs');
const frContent = fs.readFileSync('src/translations/fr.ts', 'utf8');
const enContent = fs.readFileSync('src/translations/en.ts', 'utf8');
const arContent = fs.readFileSync('src/translations/ar.ts', 'utf8');

const extractKeys = (content) => {
  const matches = [...content.matchAll(/([a-zA-Z0-9_]+)\s*:/g)];
  return matches.map(m => m[1]);
};

const frKeys = extractKeys(frContent);
const enKeys = extractKeys(enContent);
const arKeys = extractKeys(arContent);

const missingInEn = frKeys.filter(k => !enKeys.includes(k));
const missingInAr = frKeys.filter(k => !arKeys.includes(k));

console.log('Missing in EN:', missingInEn);
console.log('Missing in AR:', missingInAr);
