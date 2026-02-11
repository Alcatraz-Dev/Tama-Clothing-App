const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyAZYgY-PsjDK5vSxssjsWmUI9J8CE6FUFw",
    authDomain: "tama-clothing-v2-alcatraz.firebaseapp.com",
    projectId: "tama-clothing-v2-alcatraz",
    storageBucket: "tama-clothing-v2-alcatraz.firebasestorage.app",
    messagingSenderId: "32411249289",
    appId: "1:32411249289:web:fd4b30ad0233dec21df458"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixTimestamps(collectionName) {
    console.log(`🔍 Checking ${collectionName} for malformed timestamps...`);
    const snap = await getDocs(collection(db, collectionName));
    for (const d of snap.docs) {
        const data = d.data();
        let needsUpdate = false;
        const updates = {};

        for (const [key, value] of Object.entries(data)) {
            if (value && typeof value === 'object' && value.type === 'firestore/timestamp/1.0') {
                updates[key] = new Timestamp(value.seconds, value.nanoseconds);
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            await updateDoc(doc(db, collectionName, d.id), updates);
            console.log(`✅ Fixed timestamps for ${collectionName}/${d.id}`);
        }
    }
}

async function run() {
    const collections = ['brands', 'categories', 'products', 'promoBanners', 'settings', 'users', 'orders', 'reviews'];
    for (const col of collections) {
        await fixTimestamps(col);
    }
    console.log('🎉 ALL TIMESTAMPS REPAIRED!');
    process.exit(0);
}

run();
