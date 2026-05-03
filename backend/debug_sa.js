require('dotenv').config();
const saString = process.env.FIREBASE_SERVICE_ACCOUNT;
console.log('Length:', saString.length);
console.log('Char at 168:', saString[168], saString.charCodeAt(168));
console.log('Char at 169:', saString[169], saString.charCodeAt(169));
console.log('Char at 170:', saString[170], saString.charCodeAt(170));
try {
  JSON.parse(saString);
  console.log('Parse success');
} catch (e) {
  console.log('Parse failed:', e.message);
}
