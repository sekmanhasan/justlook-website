// Profile Script
initFirebase();

// Ana sayfa butonu için JavaScript yönlendirme
document.addEventListener('DOMContentLoaded', () => {
    const homeBtn = document.getElementById('homeBtn');
    const logoBtn = document.getElementById('logoBtn');
    
    if (homeBtn) {
        console.log('🏠 Ana sayfa butonu bulundu:', homeBtn);
        homeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🏠 Ana sayfa butonuna tıklandı');
            window.location.href = window.location.origin + '/';
        });
    } else {
        console.log('❌ Ana sayfa butonu bulunamadı');
    }
    
    if (logoBtn) {
        console.log('🏠 Logo butonu bulundu:', logoBtn);
        logoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🏠 Logo butonuna tıklandı');
            window.location.href = window.location.origin + '/';
        });
    } else {
        console.log('❌ Logo butonu bulunamadı');
    }
});

let currentUser = null;

// DOM Elements
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const favoritesGrid = document.getElementById('favoritesGrid');
const shareFavoritesBtn = document.getElementById('shareFavoritesBtn');
const shareModal = document.getElementById('shareModal');
const closeShareModal = document.getElementById('closeShareModal');
const shareLink = document.getElementById('shareLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const shareWhatsApp = document.getElementById('shareWhatsApp');
const shareTwitter = document.getElementById('shareTwitter');

// Debug: DOM elements kontrolü
console.log('🔍 DOM Elements Debug:');
console.log('logoutBtn:', logoutBtn);

// Auth State
window.auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    userEmail.textContent = user.email;
    
    // Load user data
    try {
        const userDoc = await window.db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            userName.textContent = userData.name || 'Kullanıcı';
            
            // Load favorites
            if (userData.favorites && userData.favorites.length > 0) {
                loadFavorites(userData.favorites);
            } else {
                favoritesGrid.innerHTML = '<div class="loading">Henüz favori ürün eklemedin!</div>';
            }
        }
    } catch (error) {
        console.error('Profil yüklenemedi:', error);
    }
});

// Load Favorites
async function loadFavorites(favoritesList) {
    favoritesGrid.innerHTML = '<div class="loading">Favoriler yükleniyor...</div>';
    
    try {
        const snapshot = await window.db.collection('products').get();
        const products = [];
        
        snapshot.forEach((doc) => {
            const product = doc.data();
            if (favoritesList.includes(product.name)) {
                products.push(product);
            }
        });
        
        if (products.length === 0) {
            favoritesGrid.innerHTML = '<div class="loading">Henüz favori ürün eklemedin!</div>';
            return;
        }
        
        favoritesGrid.innerHTML = '';
        
        products.forEach((product) => {
            const card = document.createElement('div');
            card.className = 'favorite-card';
            card.innerHTML = `
                <h3>${product.name}</h3>
                <p>${product.brand} · ${product.category}</p>
                <p style="margin-top: 8px; font-weight: 400; color: #000;">${product.price}</p>
            `;
            favoritesGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Favoriler yüklenemedi:', error);
        favoritesGrid.innerHTML = '<div class="loading">Favoriler yüklenirken hata oluştu!</div>';
    }
}


// Logout - DOM yüklendikten sonra ekle
if (logoutBtn) {
    console.log('✅ Logout butonu bulundu, event listener ekleniyor');
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('🚪 Logout butonu tıklandı');
        
        if (confirm('Çıkış yapmak istediğine emin misin?')) {
            try {
                console.log('🔄 Çıkış yapılıyor...');
                if (window.auth) {
                    await window.auth.signOut();
                    console.log('✅ Çıkış yapıldı');
                    window.location.href = 'login.html';
                } else {
                    console.error('❌ window.auth bulunamadı');
                    alert('Sistem hatası! Sayfayı yenileyin.');
                }
            } catch (error) {
                console.error('❌ Çıkış hatası:', error);
                alert('Çıkış yapılırken hata oluştu!');
            }
        }
    });
} else {
    console.error('❌ Logout butonu bulunamadı!');
}

// Share Favorites
shareFavoritesBtn.addEventListener('click', () => {
    const link = `${window.location.origin}/favorites.html?user=${currentUser.uid}`;
    shareLink.value = link;
    shareModal.classList.add('active');
});

closeShareModal.addEventListener('click', () => {
    shareModal.classList.remove('active');
});

// Copy Link
copyLinkBtn.addEventListener('click', () => {
    shareLink.select();
    document.execCommand('copy');
    copyLinkBtn.textContent = 'Kopyalandı!';
    setTimeout(() => {
        copyLinkBtn.textContent = 'Kopyala';
    }, 2000);
});

// Share to WhatsApp
shareWhatsApp.addEventListener('click', () => {
    const link = shareLink.value;
    const text = `Justlook'ta favorilerime göz at! ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
});

// Share to Twitter
shareTwitter.addEventListener('click', () => {
    const link = shareLink.value;
    const text = `Justlook'ta favorilerime göz atın!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`, '_blank');
});

