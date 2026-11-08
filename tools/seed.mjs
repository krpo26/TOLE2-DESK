// Sube src/data/parts.json a Firestore (colección "piezas") para que la app
// reciba actualizaciones sin recompilar el APK.
//
// Pensado para correr en la nube (GitHub Codespaces), no en la netbook:
//   cd tools && npm install
//   (subir tu clave de servicio como tools/serviceAccount.json — NO la subas al repo)
//   node seed.mjs
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const cred = JSON.parse(readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8'));
const parts = JSON.parse(readFileSync(new URL('../src/data/parts.json', import.meta.url), 'utf8'));

initializeApp({ credential: cert(cred) });
const db = getFirestore();

let batch = db.batch();
let n = 0;
for (const p of parts) {
  batch.set(db.collection('piezas').doc(p.id), p);
  n++;
  if (n % 400 === 0) {
    await batch.commit();
    batch = db.batch();
  }
}
await batch.commit();
console.log(`Listo: ${n} piezas subidas a Firestore.`);
