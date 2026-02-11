const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfigOld = {
    apiKey: "AIzaSyARYACJ1kXfSAXGYp2xc65LTUyjnX5hqpY",
    authDomain: "tama-clothing-tunisia.firebaseapp.com",
    projectId: "tama-clothing-tunisia",
    storageBucket: "tama-clothing-tunisia.firebasestorage.app",
    messagingSenderId: "720312684180",
    appId: "1:720312684180:web:b56c9ef0cd926f00172e81"
};

const firebaseConfigNew = {
    apiKey: "AIzaSyAZYgY-PsjDK5vSxssjsWmUI9J8CE6FUFw",
    authDomain: "tama-clothing-v2-alcatraz.firebaseapp.com",
    projectId: "tama-clothing-v2-alcatraz",
    storageBucket: "tama-clothing-v2-alcatraz.firebasestorage.app",
    messagingSenderId: "32411249289",
    appId: "1:32411249289:web:fd4b30ad0233dec21df458"
};

const appOld = initializeApp(firebaseConfigOld, 'old');
const dbOld = getFirestore(appOld);

const appNew = initializeApp(firebaseConfigNew, 'new');
const dbNew = getFirestore(appNew);

async function migrateCollection(name) {
    console.log(`🚀 Migrating ${name}...`);
    try {
        const snap = await getDocs(collection(dbOld, name));
        console.log(`📦 Found ${snap.docs.length} documents in ${name}`);
        
        let count = 0;
        for (const d of snap.docs) {
            const data = JSON.parse(JSON.stringify(d.data())); // Deep copy and flatten timestamps/complex objects
            await setDoc(doc(dbNew, name, d.id), data);
            count++;
        }
        console.log(`✅ Finished ${name}: ${count} docs copied.`);
    } catch (err) {
        console.error(`⚠️ Error migrating ${name}:`, err.message);
    }
}

async function run() {
    try {
        const collections = [
            'Live_sessions', 'ads', 'banners', 'brands', 'categories', 
            'chats', 'collaborations', 'coupons', 'liveSessions', 
            'notifications', 'orders', 'products', 'promoBanners', 
            'reviews', 'settings', 'users'
        ];
        for (const col of collections) {
            await migrateCollection(col);
        }
        console.log('🎉 ALL DATA MIGRATED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

run();
