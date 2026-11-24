/**
 * js/firebase-services.js
 * 集中管理 Firebase 初始化、身份驗證與資料庫核心服務。
 */

const firebaseConfig = {
    apiKey: "AIzaSyBF50fJPE-QL3yV4KaVIWzDmDPFRAkpwT4",
    authDomain: "keicha-membership-system.firebaseapp.com",
    projectId: "keicha-membership-system",
    storageBucket: "keicha-membership-system.firebasestorage.app",
    messagingSenderId: "941650156322",
    appId: "1:941650156322:web:5c7473aeaa184e0b94637b",
    measurementId: "G-H3CT3S2LDE"
};

// 初始化 Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// 初始化 App Check (選用的，僅在部分頁面啟用)
const initAppCheck = (siteKey) => {
    try {
        const appCheck = firebase.appCheck();
        appCheck.activate(siteKey, true);
        console.log('[AppCheck] 🛡️ 服務已啟動');
        return appCheck;
    } catch (e) {
        console.warn('[AppCheck] 啟動中或已在執行:', e.message);
    }
};

// 繞過廣告攔截器設置
try {
    db.settings({
        experimentalForceLongPolling: true,
        useFetchStreams: false
    });
} catch (e) {
    console.warn("Firestore settings apply failed:", e);
}

const FB = {
    auth,
    db,
    initAppCheck,


    // --- 身份驗證 (Authentication) ---
    googleProvider: new firebase.auth.GoogleAuthProvider(),

    async loginWithGoogle() {
        return await auth.signInWithPopup(this.googleProvider);
    },

    async logout() {
        return await auth.signOut();
    },

    onAuthStateChanged(callback) {
        return auth.onAuthStateChanged(callback);
    },

    // --- 資料庫通用操作 (Firestore Helpers) ---

    /**
     * 獲取單個集合的所有文件
     * @param {string} colName 
     * @param {string} orderByField 
     * @param {string} orderDir 
     */
    async getCollection(colName, orderByField = 'timestamp', orderDir = 'desc') {
        let query = db.collection(colName);
        if (orderByField) {
            query = query.orderBy(orderByField, orderDir);
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    /**
     * 更新文件資料 (Merge)
     * @param {string} colName 
     * @param {string} docId 
     * @param {object} data 
     */
    async updateDoc(colName, docId, data) {
        return await db.collection(colName).doc(docId).set(data, { merge: true });
    },

    /**
     * 刪除文件
     * @param {string} colName 
     * @param {string} docId 
     */
    async deleteDoc(colName, docId) {
        return await db.collection(colName).doc(docId).delete();
    },

    /**
     * 獲取指定路徑的單一文件
     */
    async getDoc(colName, docId) {
        const doc = await db.collection(colName).doc(docId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
};

window.FB = FB;
window.auth = auth;
window.db = db;
