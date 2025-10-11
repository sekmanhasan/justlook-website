// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDxSaE_RNKuBy6uSuK90agjyBgbm_-dW_k",
    authDomain: "justlook-e7669.firebaseapp.com",
    projectId: "justlook-e7669",
    storageBucket: "justlook-e7669.firebasestorage.app",
    messagingSenderId: "1095374100433",
    appId: "1:1095374100433:web:1131004145f2261e67f2f0"
};

// Cloudinary Configuration
const cloudinaryConfig = {
    cloudName: 'dfdrdbmjc', // Cloudinary dashboard'dan al
    uploadPreset: 'justlook_products' // Upload preset adı
};

// Global değişkenleri window'a ata
window.cloudinaryConfig = cloudinaryConfig;

// Firebase'i başlat
let db, storage, auth;

function initFirebase() {
    if (typeof firebase !== 'undefined') {
        try {
            // Firebase app zaten başlatılmış mı kontrol et
            let app;
            try {
                app = firebase.app();
            } catch (e) {
                app = firebase.initializeApp(firebaseConfig);
            }
            
            db = firebase.firestore();
            storage = firebase.storage();
            auth = firebase.auth();
            
            // Global değişkenleri window'a ata
            window.db = db;
            window.storage = storage;
            window.auth = auth;
            
        } catch (error) {
            console.error('Firebase başlatma hatası:', error);
        }
    } else {
        console.error('Firebase SDK yüklenemedi!');
    }
}

