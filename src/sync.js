// Sincronización opcional con Firestore (colección "piezas").
// Firestore guarda su propia copia local, así que también funciona sin conexión
// con lo último que se descargó.
import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

export function startSync(onData, onStatus) {
  if (!firebaseConfig) {
    onStatus('local');
    return;
  }
  try {
    const app = initializeApp(firebaseConfig);
    const db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
    });
    onSnapshot(
      collection(db, 'piezas'),
      { includeMetadataChanges: true },
      (snap) => {
        // Si nunca se sincronizó y no hay nada en caché, se mantienen los datos incluidos.
        if (snap.empty && snap.metadata.fromCache) {
          onStatus('cache');
          return;
        }
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        onData(docs);
        onStatus(snap.metadata.fromCache ? 'cache' : 'sync');
      },
      () => onStatus('error')
    );
  } catch (e) {
    onStatus('error');
  }
}
