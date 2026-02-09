// Simple Script - Firebase ile çalışır
console.log('🚀 Script yükleniyor...');

// Global variables
let favorites = new Set();
let filterPanel = null;
let searchPanel = null;
let cartSidebar = null;
let currentUser = null;

// ========== CART SYSTEM (LocalStorage) ==========
function getCart() {
    try {
        return JSON.parse(localStorage.getItem('cart')) || [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(item => item.name === product.name);
    
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            name: product.name,
            brand: product.brand,
            price: product.price,
            imageUrl: (product.images && product.images.length > 0) ? product.images[0] : product.imageUrl,
            quantity: 1
        });
    }
    
    saveCart(cart);
    showCartNotification();
    
    // Sidebar açıksa güncelle
    if (cartSidebar && cartSidebar.classList.contains('active')) {
        renderCartSidebar();
    }
}

function removeFromCart(productName) {
    let cart = getCart();
    cart = cart.filter(item => item.name !== productName);
    saveCart(cart);
    renderCartSidebar();
}

function updateCartQuantity(productName, delta) {
    const cart = getCart();
    const item = cart.find(i => i.name === productName);
    
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productName);
            return;
        }
    }
    
    saveCart(cart);
    renderCartSidebar();
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((sum, item) => {
        const price = parseFloat(item.price.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
        return sum + (price * item.quantity);
    }, 0);
}

function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        const count = getCartItemCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function showCartNotification() {
    // Kısa bir animasyon ile kullanıcıya bildir
    const cartBtn = document.querySelector('.cart-icon-btn');
    if (cartBtn) {
        cartBtn.classList.add('cart-bounce');
        setTimeout(() => cartBtn.classList.remove('cart-bounce'), 500);
    }
}

function createCartSidebar() {
    if (cartSidebar && document.body.contains(cartSidebar)) {
        cartSidebar.classList.add('active');
        renderCartSidebar();
        return;
    }
    
    cartSidebar = document.createElement('div');
    cartSidebar.className = 'cart-sidebar';
    cartSidebar.innerHTML = `
        <div class="cart-overlay"></div>
        <div class="cart-panel">
            <div class="cart-header">
                <h3 data-tr="Sepet" data-en="Cart">${translations[currentLang].cart || 'Sepet'}</h3>
                <button class="close-btn cart-close-btn">✕</button>
            </div>
            <div class="cart-items"></div>
            <div class="cart-footer">
                <div class="cart-total">
                    <span data-tr="Toplam" data-en="Total">${translations[currentLang].total || 'Toplam'}</span>
                    <span class="cart-total-price">₺0</span>
                </div>
                <button class="cart-checkout-btn" data-tr="Ödeme Yap" data-en="Checkout">${translations[currentLang].checkout || 'Ödeme Yap'}</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(cartSidebar);
    
    setTimeout(() => cartSidebar.classList.add('active'), 10);
    
    // Kapat butonları
    cartSidebar.querySelector('.cart-close-btn').addEventListener('click', closeCartSidebar);
    cartSidebar.querySelector('.cart-overlay').addEventListener('click', closeCartSidebar);
    
    // Ödeme butonu (şimdilik bilgi ver)
    cartSidebar.querySelector('.cart-checkout-btn').addEventListener('click', () => {
        const lang = currentLang;
        if (lang === 'tr') {
            alert('Ödeme sistemi yakında aktif olacak!');
        } else {
            alert('Payment system coming soon!');
        }
    });
    
    renderCartSidebar();
}

function closeCartSidebar() {
    if (cartSidebar) {
        cartSidebar.classList.remove('active');
    }
}

function renderCartSidebar() {
    if (!cartSidebar) return;
    
    const cart = getCart();
    const itemsContainer = cartSidebar.querySelector('.cart-items');
    const totalPrice = cartSidebar.querySelector('.cart-total-price');
    const checkoutBtn = cartSidebar.querySelector('.cart-checkout-btn');
    
    if (cart.length === 0) {
        itemsContainer.innerHTML = `
            <div class="cart-empty">
                <svg width="48" height="48" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 6H18L16.5 13H7.5L6 6Z" stroke="#ccc" stroke-width="1" stroke-linejoin="round"/>
                    <path d="M6 6L5 2H2" stroke="#ccc" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="8.5" cy="16.5" r="1.5" stroke="#ccc" stroke-width="1"/>
                    <circle cx="15.5" cy="16.5" r="1.5" stroke="#ccc" stroke-width="1"/>
                </svg>
                <p data-tr="Sepetiniz boş" data-en="Your cart is empty">${translations[currentLang].cartEmpty || 'Sepetiniz boş'}</p>
            </div>
        `;
        totalPrice.textContent = '₺0';
        checkoutBtn.disabled = true;
        return;
    }
    
    checkoutBtn.disabled = false;
    
    itemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item" data-name="${item.name}">
            <div class="cart-item-image">
                <img src="${item.imageUrl}" alt="${item.name}">
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-brand">${item.brand}</div>
                <div class="cart-item-price">${item.price}</div>
            </div>
            <div class="cart-item-actions">
                <div class="cart-quantity-controls">
                    <button class="qty-btn qty-minus" data-name="${item.name}">−</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn qty-plus" data-name="${item.name}">+</button>
                </div>
                <button class="cart-remove-btn" data-name="${item.name}">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
    
    // Event listeners
    itemsContainer.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', () => updateCartQuantity(btn.dataset.name, -1));
    });
    
    itemsContainer.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', () => updateCartQuantity(btn.dataset.name, 1));
    });
    
    itemsContainer.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => removeFromCart(btn.dataset.name));
    });
    
    // Toplam fiyat
    const total = getCartTotal();
    totalPrice.textContent = `₺${total.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// DOM yüklenince başlat
// ========== LANGUAGE SYSTEM ==========
const translations = {
    tr: {
        'login': 'Giriş Yap',
        'signup': 'Kayıt Ol',
        'profile': 'Profilim',
        'logout': 'Çıkış',
        'share': 'Paylaş',
        'linkCopied': 'Link kopyalandı! ✅',
        'whatsapp': 'WhatsApp',
        'instagram': 'Instagram',
        'copyLink': 'Kopyala',
        'filter': 'Filtrele',
        'category': 'Kategori',
        'priceRange': 'Fiyat Aralığı',
        'applyFilters': 'Filtreleri Uygula',
        'living': 'Ev & Yaşam',
        'tech': 'Teknoloji',
        'accessories': 'Aksesuar',
        'outdoor': 'Outdoor',
        'fitness': 'Spor',
        'office': 'Ofis',
        'search': 'Ara',
        'searchPlaceholder': 'Ürün ara...',
        'favorites': 'Favoriler',
        'noFavorites': 'Henüz favori ürününüz yok',
        'addToFavorites': 'Favorilere Ekle',
        'removeFromFavorites': 'Favorilerden Çıkar',
        'shareProduct': 'Paylaş',
        'shareWhatsApp': 'WhatsApp',
        'shareInstagram': 'Instagram',
        'shareCopy': 'Kopyala',
        'goToProduct': 'Ürüne Git',
        'cart': 'Sepet',
        'addToCart': 'Sepete Ekle',
        'cartEmpty': 'Sepetiniz boş',
        'total': 'Toplam',
        'checkout': 'Ödeme Yap',
        'remove': 'Kaldır'
    },
    en: {
        'login': 'Login',
        'signup': 'Sign Up',
        'profile': 'Profile',
        'logout': 'Logout',
        'share': 'Share',
        'linkCopied': 'Link copied! ✅',
        'whatsapp': 'WhatsApp',
        'instagram': 'Instagram',
        'copyLink': 'Copy',
        'filter': 'Filter',
        'category': 'Category',
        'priceRange': 'Price Range',
        'applyFilters': 'Apply Filters',
        'living': 'Home & Living',
        'tech': 'Technology',
        'accessories': 'Accessories',
        'outdoor': 'Outdoor',
        'fitness': 'Sports',
        'office': 'Office',
        'search': 'Search',
        'searchPlaceholder': 'Search products...',
        'favorites': 'Favorites',
        'noFavorites': 'No favorite products yet',
        'addToFavorites': 'Add to Favorites',
        'removeFromFavorites': 'Remove from Favorites',
        'shareProduct': 'Share',
        'shareWhatsApp': 'WhatsApp',
        'shareInstagram': 'Instagram',
        'shareCopy': 'Copy',
        'goToProduct': 'Go to Product',
        'cart': 'Cart',
        'addToCart': 'Add to Cart',
        'cartEmpty': 'Your cart is empty',
        'total': 'Total',
        'checkout': 'Checkout',
        'remove': 'Remove'
    }
};

let currentLang = localStorage.getItem('language') || 'tr';


function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);
    updateLanguageUI();
    updateFilterPanel();
    updateSearchPanel();
}


function updateLanguageUI() {
    // Update language toggle
    const langText = document.getElementById('langText');
    const langButtons = document.querySelectorAll('.lang-btn');
    
    if (langText) {
        langText.textContent = currentLang.toUpperCase();
    }
    
    langButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === currentLang) {
            btn.classList.add('active');
        }
    });
    
    // Update all text elements
    const elements = document.querySelectorAll('[data-tr]');
    
    elements.forEach(element => {
        if (element.dataset[currentLang]) {
            element.textContent = element.dataset[currentLang];
        }
    });
    
    // Update "Ürüne Git" buttons
    const productLinkBtns = document.querySelectorAll('.product-link-btn span');
    productLinkBtns.forEach(span => {
        span.textContent = translations[currentLang].goToProduct;
    });
    
    // Update "Sepete Ekle" buttons
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn span');
    addToCartBtns.forEach(span => {
        span.textContent = translations[currentLang].addToCart;
    });
    
    // Update cart sidebar if open
    if (cartSidebar && document.body.contains(cartSidebar)) {
        const cartHeader = cartSidebar.querySelector('.cart-header h3');
        if (cartHeader) cartHeader.textContent = translations[currentLang].cart;
        
        const totalLabel = cartSidebar.querySelector('.cart-total span:first-child');
        if (totalLabel) totalLabel.textContent = translations[currentLang].total;
        
        const checkoutBtn = cartSidebar.querySelector('.cart-checkout-btn');
        if (checkoutBtn) checkoutBtn.textContent = translations[currentLang].checkout;
        
        const emptyMsg = cartSidebar.querySelector('.cart-empty p');
        if (emptyMsg) emptyMsg.textContent = translations[currentLang].cartEmpty;
    }
}

function setupLanguageToggle() {
    const langButtons = document.querySelectorAll('.lang-btn');
    
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.lang;
            setLanguage(lang);
        });
    });
}

function updateFilterPanel() {
    if (filterPanel) {
        const header = filterPanel.querySelector('h3');
        const categoryTitle = filterPanel.querySelector('.filter-group h4');
        const priceTitle = filterPanel.querySelectorAll('.filter-group h4')[1];
        const applyBtn = filterPanel.querySelector('.apply-filter-btn');
        
        if (header) header.textContent = translations[currentLang].filter;
        if (categoryTitle) categoryTitle.textContent = translations[currentLang].category;
        if (priceTitle) priceTitle.textContent = translations[currentLang].priceRange;
        if (applyBtn) applyBtn.textContent = translations[currentLang].applyFilters;
        
        // Kategori etiketlerini güncelle
        const categoryLabels = filterPanel.querySelectorAll('.filter-group:first-child label');
        const categoryKeys = ['living', 'tech', 'accessories', 'outdoor', 'fitness', 'office'];
        categoryLabels.forEach((label, index) => {
            if (categoryKeys[index]) {
                const textNode = Array.from(label.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                if (textNode) {
                    textNode.textContent = ` ${translations[currentLang][categoryKeys[index]]}`;
                }
            }
        });
    }
}

function updateSearchPanel() {
    if (searchPanel) {
        const input = searchPanel.querySelector('input');
        if (input) {
            input.placeholder = translations[currentLang].searchPlaceholder;
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM yüklendi!');
    
    // Logo yönlendirme
        // HTML href artık doğru, JavaScript event listener'a gerek yok
    
    // Butonları bul
    const filterBtn = document.querySelector('[aria-label="Filter"]');
    const searchBtn = document.querySelector('[aria-label="Search"]');
    const favoritesBtn = document.querySelector('[aria-label="Favorites"]');
    
    if (!filterBtn || !searchBtn || !favoritesBtn) {
        console.error('❌ HATA: Butonlar bulunamadı!');
        return;
    }
    
    console.log('✅ Tüm butonlar bulundu!');
    
    // ========== USER AUTH ==========
    const userBtn = document.getElementById('userBtn');
    const userDropdown = document.getElementById('userDropdown');
    const userDropdownLogged = document.getElementById('userDropdownLogged');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtnMain = document.getElementById('logoutBtnMain');
    
    if (!userBtn || !userDropdown || !loginBtn || !signupBtn) {
        console.error('❌ Menü elementleri yok!');
        return;
    }
    
    // Kullanıcı butonu click - dropdown toggle
    userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (currentUser) {
            userDropdownLogged.classList.toggle('active');
            userDropdown.classList.remove('active');
        } else {
            userDropdown.classList.toggle('active');
            userDropdownLogged.classList.remove('active');
        }
    });
    
    // Login button
    loginBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
    
    // Signup button
    signupBtn.addEventListener('click', () => {
        window.location.href = 'signup.html';
    });
    
    // Profile button
    profileBtn.addEventListener('click', () => {
        window.location.href = 'profile.html';
    });
    
    // Logout button
    logoutBtnMain.addEventListener('click', async () => {
        if (confirm('Çıkış yapmak istediğine emin misin?')) {
            try {
                await window.auth.signOut();
                userDropdownLogged.classList.remove('active');
            } catch (error) {
                alert('Çıkış yapılırken hata oluştu!');
            }
        }
    });
    
    // Dışarı tıklayınca dropdown'u kapat
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            userDropdown.classList.remove('active');
            userDropdownLogged.classList.remove('active');
        }
    });
    
    // Kullanıcı durumunu kontrol et
    if (window.auth) {
        window.auth.onAuthStateChanged(async (user) => {
            currentUser = user;
            
            if (user) {
                console.log('✅ User logged in:', user.email);
                userBtn.classList.add('logged-in');
                
                // Logged dropdown'u göster, guest'i gizle
                userDropdownLogged.classList.add('show-dropdown');
                userDropdownLogged.classList.remove('hide-dropdown');
                userDropdown.classList.add('hide-dropdown');
                userDropdown.classList.remove('show-dropdown');
                
                // Kullanıcının favorilerini yükle
                try {
                    const userDoc = await window.db.collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        if (userData.favorites) {
                            favorites = new Set(userData.favorites);
                            console.log(`✅ ${favorites.size} favori yüklendi`);
                        }
                        // Dropdown'da ismi göster
                        const userName = userData.name || user.email.split('@')[0];
                        dropdownUserName.textContent = userName;
                    }
                } catch (error) {
                    console.error('Favoriler yüklenemedi:', error);
                }
            } else {
                console.log('ℹ️ No user logged in');
                userBtn.classList.remove('logged-in');
                
                // Guest dropdown'u göster, logged'i gizle
                userDropdown.classList.add('show-dropdown');
                userDropdown.classList.remove('hide-dropdown');
                userDropdownLogged.classList.add('hide-dropdown');
                userDropdownLogged.classList.remove('show-dropdown');
            }
        });
    }
    
    // ========== CART BUTTON ==========
    const cartBtn = document.querySelector('[aria-label="Cart"]');
    if (cartBtn) {
        cartBtn.addEventListener('click', function() {
            console.log('✅ Cart tıklandı!');
            createCartSidebar();
        });
    }
    
    // Sayfa yüklendiğinde badge'i güncelle
    updateCartBadge();
    
    // ========== FILTER BUTTON ==========
    filterBtn.addEventListener('click', function() {
        console.log('✅ Filter tıklandı!');
        if (!filterPanel || !document.body.contains(filterPanel)) {
            createFilterPanel();
        } else {
            filterPanel.classList.toggle('active');
        }
    });
    
    function createFilterPanel() {
        filterPanel = document.createElement('div');
        filterPanel.className = 'filter-panel';
        filterPanel.innerHTML = `
            <div class="filter-header">
                <h3>${translations[currentLang].filter}</h3>
                <button class="close-btn">✕</button>
            </div>
            <div class="filter-content">
                <div class="filter-group">
                    <h4>${translations[currentLang].category}</h4>
                    <label><input type="checkbox" value="living"> ${translations[currentLang].living}</label>
                    <label><input type="checkbox" value="tech"> ${translations[currentLang].tech}</label>
                    <label><input type="checkbox" value="accessories"> ${translations[currentLang].accessories}</label>
                    <label><input type="checkbox" value="outdoor"> ${translations[currentLang].outdoor}</label>
                    <label><input type="checkbox" value="fitness"> ${translations[currentLang].fitness}</label>
                    <label><input type="checkbox" value="office"> ${translations[currentLang].office}</label>
                </div>
                <div class="filter-group">
                    <h4>${translations[currentLang].priceRange}</h4>
                    <label><input type="checkbox" value="0-50"> ₺0 - ₺500</label>
                    <label><input type="checkbox" value="50-100"> ₺500 - ₺1000</label>
                    <label><input type="checkbox" value="100-200"> ₺1000 - ₺2000</label>
                    <label><input type="checkbox" value="200+"> ₺2000+</label>
                </div>
                <button class="apply-filter-btn">${translations[currentLang].applyFilters}</button>
            </div>
        `;
        document.body.appendChild(filterPanel);
        
        setTimeout(() => filterPanel.classList.add('active'), 10);
        
        filterPanel.querySelector('.close-btn').addEventListener('click', () => {
            filterPanel.classList.remove('active');
            setTimeout(() => {
                if (filterPanel.parentNode) {
                    filterPanel.parentNode.removeChild(filterPanel);
                    filterPanel = null; // Reset filterPanel variable
                }
            }, 350);
        });
        
        filterPanel.querySelector('.apply-filter-btn').addEventListener('click', () => {
            applyFilters();
            filterPanel.classList.remove('active');
            setTimeout(() => {
                if (filterPanel.parentNode) {
                    filterPanel.parentNode.removeChild(filterPanel);
                    filterPanel = null; // Reset filterPanel variable
                }
            }, 350);
        });
        
        // Dışarıya tıklayınca kapat
        filterPanel.addEventListener('click', (e) => {
            if (e.target === filterPanel) {
                filterPanel.classList.remove('active');
                setTimeout(() => {
                    if (filterPanel.parentNode) {
                        filterPanel.parentNode.removeChild(filterPanel);
                        filterPanel = null; // Reset filterPanel variable
                    }
                }, 350);
            }
        });
    }
    
    function applyFilters() {
        const selectedCategories = Array.from(document.querySelectorAll('.filter-group input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        const cards = document.querySelectorAll('.product-card');
        
        if (selectedCategories.length === 0) {
            cards.forEach(card => card.style.display = 'block');
            return;
        }
        
        cards.forEach(card => {
            const category = card.querySelector('.product-meta').textContent.toLowerCase();
            const shouldShow = selectedCategories.some(cat => category.includes(cat));
            card.style.display = shouldShow ? 'block' : 'none';
        });
    }
    
    // ========== SEARCH BUTTON ==========
    searchBtn.addEventListener('click', function() {
        console.log('✅ Search tıklandı!');
        if (!searchPanel) {
            createSearchPanel();
        } else {
            searchPanel.classList.toggle('active');
            document.querySelector('main').classList.toggle('search-open');
            if (searchPanel.classList.contains('active')) {
                searchPanel.querySelector('input').focus();
            }
        }
    });
    
    function createSearchPanel() {
        searchPanel = document.createElement('div');
        searchPanel.className = 'search-panel';
        searchPanel.innerHTML = `
            <div class="search-box">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="9" cy="9" r="5" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M13 13L17 17" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
                <input type="text" placeholder="${translations[currentLang].searchPlaceholder}" />
                <button class="search-close-btn">✕</button>
            </div>
        `;
        document.querySelector('header').appendChild(searchPanel);
        
        setTimeout(() => {
            searchPanel.classList.add('active');
            document.querySelector('main').classList.add('search-open');
            searchPanel.querySelector('input').focus();
        }, 10);
        
        const input = searchPanel.querySelector('input');
        input.addEventListener('input', (e) => {
            searchProducts(e.target.value);
        });
        
        searchPanel.querySelector('.search-close-btn').addEventListener('click', () => {
            searchPanel.classList.remove('active');
            document.querySelector('main').classList.remove('search-open');
            input.value = '';
            searchProducts('');
        });
    }
    
    function searchProducts(query) {
        const cards = document.querySelectorAll('.product-card');
        const searchTerm = query.toLowerCase();
        
        if (!searchTerm) {
            cards.forEach(card => card.style.display = 'block');
            return;
        }
        
        cards.forEach(card => {
            const name = card.querySelector('.product-name').textContent.toLowerCase();
            const meta = card.querySelector('.product-meta').textContent.toLowerCase();
            const matches = name.includes(searchTerm) || meta.includes(searchTerm);
            card.style.display = matches ? 'block' : 'none';
        });
    }
    
    // ========== FAVORITES BUTTON ==========
    favoritesBtn.addEventListener('click', function() {
        console.log('✅ Favorites tıklandı!');
        toggleFavoritesView();
    });
    
    function toggleFavoritesView() {
        const cards = document.querySelectorAll('.product-card');
        const isShowingFavorites = favoritesBtn.classList.contains('active');
        
        if (isShowingFavorites) {
            favoritesBtn.classList.remove('active');
            cards.forEach(card => card.style.display = 'block');
        } else {
            favoritesBtn.classList.add('active');
            if (favorites.size === 0) {
                alert('Henüz favori ürün yok! Ürün kartlarındaki kalp ikonuna tıklayarak favori ekleyin.');
                favoritesBtn.classList.remove('active');
                return;
            }
            cards.forEach(card => {
                const productName = card.querySelector('.product-name').textContent;
                card.style.display = favorites.has(productName) ? 'block' : 'none';
            });
        }
    }
    
    // ========== SOUND EFFECT ==========
    const clickSound = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    
    function playSound() {
        try {
            const audio = new Audio(clickSound);
            audio.volume = 0.05;
            audio.play().catch(() => {});
        } catch (e) {}
    }
    
    // Add sound to icon buttons
    document.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', () => playSound());
    });
    
    // Close filter panel when clicking outside
    document.addEventListener('click', (e) => {
        if (filterPanel && filterPanel.classList.contains('active')) {
            if (!filterPanel.contains(e.target) && e.target !== filterBtn && !filterBtn.contains(e.target)) {
                filterPanel.classList.remove('active');
            }
        }
    });
    
    console.log('✅ Tüm özellikler yüklendi!');
    
    // Firebase'den ürünleri yükle
    loadFirebaseProducts();
    
    // Initialize language system (delay to ensure DOM is ready)
    setTimeout(() => {
        setupLanguageToggle();
        
        // Her zaman UI'ı güncelle (kayıtlı dil varsa)
        const savedLang = localStorage.getItem('language');
        
        if (savedLang) {
            currentLang = savedLang;
        }
        
        updateLanguageUI();
    }, 100);
});

// ========== FIREBASE PRODUCTS ==========
async function loadFirebaseProducts() {
    console.log('🔥 Firebase ürünleri yükleniyor...');
    
    // Firebase'in hazır olmasını bekle
    if (window.firebaseReady) {
        await window.firebaseReady;
    }
    
    // Firebase hazır mı kontrol et
    if (typeof window.db === 'undefined' || !window.db) {
        setTimeout(loadFirebaseProducts, 3000);
        return;
    }
    
    const productsGrid = document.querySelector('.products-grid');
    
    try {
        // Tarihe göre sırala - en yeni üstte
        let snapshot;
        try {
            snapshot = await window.db.collection('products').orderBy('createdAt', 'desc').get();
            console.log('✅ Tarihe göre sıralandı (en yeni üstte)');
        } catch (e) {
            // createdAt yoksa veya index yoksa normal getir
            snapshot = await window.db.collection('products').get();
            console.log('⚠️ Tarihe göre sıralanamadı, normal sırada');
        }
        
        if (snapshot.empty) {
            console.log('ℹ️ Firebase\'de ürün yok, statik ürünler gösteriliyor');
            return;
        }
        
        console.log(`✅ ${snapshot.size} ürün Firebase'den yüklendi`);
        
        // Grid'i temizle
        productsGrid.innerHTML = '';
        
        // Firebase ürünlerini ekle
        snapshot.forEach((doc) => {
            const product = doc.data();
            
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // Fotoğraf slider'ı oluştur
            let imageSliderHTML = '';
            if (product.images && product.images.length > 0) {
                imageSliderHTML = `
                    <div class="image-slider">
                        ${product.images.map((url, index) => `
                            <img src="${url}" alt="${product.name} ${index + 1}" class="slider-image ${index === 0 ? 'active' : ''}" data-index="${index}">
                        `).join('')}
                        ${product.images.length > 1 ? `
                            <button class="slider-btn prev">‹</button>
                            <button class="slider-btn next">›</button>
                            <div class="slider-dots">
                                ${product.images.map((_, index) => `<span class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            } else if (product.imageUrl) {
                imageSliderHTML = `<img src="${product.imageUrl}" alt="${product.name}">`;
            }
            
            card.innerHTML = `
                <div class="product-image">
                    ${imageSliderHTML}
                </div>
                <div class="product-info">
                    <div class="product-meta">${product.brand} · ${product.category}</div>
                    <div class="product-details">
                        <h3 class="product-name">${product.name}</h3>
                        <span class="product-price">${product.price}</span>
                    </div>
                    ${product.link ? `<button class="product-link-btn" data-link="${product.link}">
                        <span>${translations[currentLang].goToProduct}</span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>` : ''}
                    <button class="add-to-cart-btn" data-tr="Sepete Ekle" data-en="Add to Cart">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 6H18L16.5 13H7.5L6 6Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                            <path d="M6 6L5 2H2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="8.5" cy="16.5" r="1.5" stroke="currentColor" stroke-width="1.2"/>
                            <circle cx="15.5" cy="16.5" r="1.5" stroke="currentColor" stroke-width="1.2"/>
                        </svg>
                        <span>${translations[currentLang].addToCart}</span>
                    </button>
                </div>
            `;
            
            // Slider fonksiyonlarını ekle
            if (product.images && product.images.length > 1) {
                setupImageSlider(card);
            }
            
            // Favori butonu ekle
            const favoriteIcon = document.createElement('button');
            favoriteIcon.className = 'favorite-icon';
            favoriteIcon.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 17.5L3.5 12.5L2 7.5L4 3.5L8 2L10 3L12 2L16 3.5L18 7.5L16.5 12.5L10 17.5Z" stroke="currentColor" stroke-width="1.2" fill="none"/>
                </svg>
            `;
            card.querySelector('.product-image').appendChild(favoriteIcon);
            
            // Paylaşma butonu ekle
            const shareIcon = document.createElement('button');
            shareIcon.className = 'share-icon';
            shareIcon.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 7C16.66 7 18 5.66 18 4C18 2.34 16.66 1 15 1C13.34 1 12 2.34 12 4L7.69 7.18C7.14 6.45 6.28 6 5.33 6C3.67 6 2.33 7.34 2.33 9C2.33 10.66 3.67 12 5.33 12L12.64 12.18C13.19 11.45 14.05 11 15 11C16.66 11 18 12.34 18 14C18 15.66 16.66 17 15 17C13.34 17 12 15.66 12 14L8.26 9.64L12.64 5.82C13.19 6.55 14.05 7 15 7Z" stroke="currentColor" stroke-width="1.2"/>
                </svg>
            `;
            card.querySelector('.product-image').appendChild(shareIcon);
            
            shareIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                showShareMenu(product);
            });
            
            const productName = product.name;
            
            if (favorites.has(productName)) {
                favoriteIcon.classList.add('active');
            }
            
            favoriteIcon.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                // Giriş yapmamışsa login'e yönlendir
                if (!currentUser) {
                    if (confirm('Favorileri kaydetmek için giriş yapmalısın. Giriş sayfasına gitmek ister misin?')) {
                        window.location.href = 'login.html';
                    }
                    return;
                }
                
                if (favorites.has(productName)) {
                    favorites.delete(productName);
                    favoriteIcon.classList.remove('active');
                } else {
                    favorites.add(productName);
                    favoriteIcon.classList.add('active');
                }
                
                // Favorileri Firebase'e kaydet
                try {
                    await window.db.collection('users').doc(currentUser.uid).update({
                        favorites: Array.from(favorites)
                    });
                    console.log('✅ Favoriler kaydedildi');
                } catch (error) {
                    console.error('Favori kaydedilemedi:', error);
                }
                
                playSound();
            });
            
            card.addEventListener('click', () => playSound());
            
            // Ürüne Git butonu event listener'ı
            const productLinkBtn = card.querySelector('.product-link-btn');
            if (productLinkBtn) {
                productLinkBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const link = productLinkBtn.getAttribute('data-link');
                    if (link) {
                        window.open(link, '_blank');
                        playSound();
                    }
                });
            }
            
            // Sepete Ekle butonu event listener'ı
            const addToCartBtn = card.querySelector('.add-to-cart-btn');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    addToCart(product);
                    playSound();
                    
                    // Buton feedback
                    const span = addToCartBtn.querySelector('span');
                    const originalText = span.textContent;
                    span.textContent = currentLang === 'tr' ? 'Eklendi ✓' : 'Added ✓';
                    addToCartBtn.classList.add('added');
                    setTimeout(() => {
                        span.textContent = originalText;
                        addToCartBtn.classList.remove('added');
                    }, 1200);
                });
            }
            
            productsGrid.appendChild(card);
        });
        
        console.log(`✅ Toplam ${snapshot.size} ürün gösteriliyor`);
        
    } catch (error) {
        console.error('❌ Firebase ürün yükleme hatası:', error);
    }
}

// ========== SHARE PRODUCT ==========
function showShareMenu(product) {
    const productUrl = `${window.location.origin}?product=${encodeURIComponent(product.name)}`;
    const shareText = `${product.name} - ${product.price}\n${product.brand}`;
    
    // Create share modal
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
        <div class="share-content">
            <h3>${product.name} ${translations[currentLang].shareProduct}</h3>
            <div class="share-buttons">
                <button class="share-btn whatsapp" onclick="shareWhatsApp('${encodeURIComponent(shareText + '\n' + productUrl)}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                    ${translations[currentLang].shareWhatsApp}
                </button>
                <button class="share-btn instagram" onclick="shareInstagram()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    ${translations[currentLang].shareInstagram}
                </button>
                <button class="share-btn copy" onclick="shareCopy('${productUrl}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    ${translations[currentLang].shareCopy}
                </button>
            </div>
            <button class="close-share" onclick="closeShareModal()">✕</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function shareWhatsApp(text) {
    window.open(`https://wa.me/?text=${text}`, '_blank');
    closeShareModal();
}

function shareInstagram() {
    window.open(`https://www.instagram.com/`, '_blank');
    closeShareModal();
}

function shareCopy(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert(translations[currentLang].linkCopied);
        closeShareModal();
    }).catch(() => {
        prompt('Link:', url);
        closeShareModal();
    });
}

function closeShareModal() {
    const modal = document.querySelector('.share-modal');
    if (modal) {
        modal.remove();
    }
}

// ========== IMAGE SLIDER ==========
function setupImageSlider(card) {
    const images = card.querySelectorAll('.slider-image');
    const dots = card.querySelectorAll('.dot');
    const prevBtn = card.querySelector('.slider-btn.prev');
    const nextBtn = card.querySelector('.slider-btn.next');
    let currentIndex = 0;
    
    function showImage(index) {
        images.forEach(img => img.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        images[index].classList.add('active');
        dots[index].classList.add('active');
        currentIndex = index;
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
            showImage(newIndex);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
            showImage(newIndex);
        });
    }
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(index);
        });
    });
}
