// Profile Script
initFirebase();

let currentUser = null;

// DOM Elements
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const editName = document.getElementById('editName');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const logoutBtn = document.getElementById('logoutBtn');
const favoritesGrid = document.getElementById('favoritesGrid');
const shareFavoritesBtn = document.getElementById('shareFavoritesBtn');
const shareModal = document.getElementById('shareModal');
const closeShareModal = document.getElementById('closeShareModal');
const shareLink = document.getElementById('shareLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const shareWhatsApp = document.getElementById('shareWhatsApp');
const shareTwitter = document.getElementById('shareTwitter');

// Auth State
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    userEmail.textContent = user.email;
    
    // Load user data
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            userName.textContent = userData.name || 'Kullanıcı';
            editName.value = userData.name || '';
            
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
        const snapshot = await db.collection('products').get();
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

// Save Profile
saveProfileBtn.addEventListener('click', async () => {
    const name = editName.value.trim();
    
    if (!name) {
        alert('Lütfen isminizi girin!');
        return;
    }
    
    saveProfileBtn.textContent = 'Kaydediliyor...';
    saveProfileBtn.disabled = true;
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            name: name
        });
        
        userName.textContent = name;
        alert('Profil güncellendi!');
    } catch (error) {
        alert('Hata: ' + error.message);
    }
    
    saveProfileBtn.textContent = 'Bilgileri Güncelle';
    saveProfileBtn.disabled = false;
});

// Logout
logoutBtn.addEventListener('click', async () => {
    if (confirm('Çıkış yapmak istediğine emin misin?')) {
        try {
            await auth.signOut();
            console.log('✅ Çıkış yapıldı');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Çıkış hatası:', error);
            alert('Çıkış yapılırken hata oluştu!');
        }
    }
});

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

