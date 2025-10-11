// Admin Script
initFirebase();

let currentEditingId = null;
let selectedFiles = [];

// DOM Elements
let loginScreen, adminPanel, emailInput, passwordInput, loginBtn, logoutBtn, loginMessage;
let addProductBtn, productModal, closeModal, productsList, saveProductBtn;
let changePasswordBtn, changePasswordModal, closePasswordModal;
let currentPasswordInput, newPasswordInput, confirmPasswordInput, passwordMessage, updatePasswordBtn;

// Sayfa yüklendikten sonra DOM elementlerini tanımla
document.addEventListener('DOMContentLoaded', () => {
    debugLog('📄 Admin sayfası yüklendi');
    
    // DOM Elements
    loginScreen = document.getElementById('loginScreen');
    adminPanel = document.getElementById('adminPanel');
    emailInput = document.getElementById('emailInput');
    passwordInput = document.getElementById('passwordInput');
    loginBtn = document.getElementById('loginBtn');
    logoutBtn = document.getElementById('logoutBtn');
    loginMessage = document.getElementById('loginMessage');
    addProductBtn = document.getElementById('addProductBtn');
    productModal = document.getElementById('productModal');
    closeModal = document.getElementById('closeModal');
    productsList = document.getElementById('productsList');
    saveProductBtn = document.getElementById('saveProductBtn');
    
    // Şifre değiştirme elements
    changePasswordBtn = document.getElementById('changePasswordBtn');
    changePasswordModal = document.getElementById('changePasswordModal');
    closePasswordModal = document.getElementById('closePasswordModal');
    currentPasswordInput = document.getElementById('currentPassword');
    newPasswordInput = document.getElementById('newPassword');
    confirmPasswordInput = document.getElementById('confirmPassword');
    passwordMessage = document.getElementById('passwordMessage');
    updatePasswordBtn = document.getElementById('updatePasswordBtn');
    
    debugLog('🔍 DOM elementleri kontrol ediliyor...');
    debugLog(`🔍 addProductBtn: ${addProductBtn ? 'VAR' : 'YOK'}`);
    debugLog(`🔍 saveProductBtn: ${saveProductBtn ? 'VAR' : 'YOK'}`);
    debugLog(`🔍 productModal: ${productModal ? 'VAR' : 'YOK'}`);
    
    // Event listener'ları kur
    setupEventListeners();
    
    // Auth state değişikliklerini dinle
    if (window.auth) {
        window.auth.onAuthStateChanged((user) => {
            if (user) {
                debugLog(`👤 Kullanıcı giriş yaptı: ${user.email}`);
                showAdminPanel();
            } else {
                debugLog('👤 Kullanıcı çıkış yaptı');
                showLoginScreen();
            }
        });
    } else {
        debugLog('❌ window.auth bulunamadı');
    }
});

// Firebase servislerinin hazır olmasını bekle
setTimeout(() => {
    if (!window.auth || !window.db || !window.storage) {
        console.error('❌ Firebase servisleri yüklenemedi!');
        if (loginMessage) {
            loginMessage.textContent = 'Firebase servisleri yüklenemedi! Sayfayı yenileyin.';
        }
        return;
    }
    console.log('✅ Firebase servisleri hazır');
}, 1000);

// Event listener'ları kur
function setupEventListeners() {
    debugLog('🔗 Event listener\'lar kuruluyor...');
    
    // Login
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            console.log('🔐 Login butonu tıklandı');
            const email = emailInput.value;
            const password = passwordInput.value;
            
            if (!email || !password) {
                loginMessage.textContent = 'E-posta ve şifre gerekli!';
                loginMessage.style.color = '#e74c3c';
                return;
            }
            
            try {
                await window.auth.signInWithEmailAndPassword(email, password);
                console.log('✅ Giriş başarılı');
            } catch (error) {
                console.log('❌ Giriş hatası:', error.code);
                if (error.code === 'auth/user-not-found') {
                    // Kullanıcı yoksa hesap oluştur
                    try {
                        await window.auth.createUserWithEmailAndPassword(email, password);
                        loginMessage.textContent = 'Hesap oluşturuldu ve giriş yapıldı!';
                        loginMessage.style.color = '#27ae60';
                    } catch (signupError) {
                        loginMessage.textContent = 'Hata: ' + error.message;
                        loginMessage.style.color = '#e74c3c';
                    }
                } else {
                    loginMessage.textContent = 'Giriş hatası: ' + error.message;
                    loginMessage.style.color = '#e74c3c';
                }
            }
        });
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('🚪 Logout butonu tıklandı');
            window.auth.signOut();
        });
    }
    
    // Yeni Ürün Modal'ını Aç
    if (addProductBtn) {
        debugLog('✅ addProductBtn bulundu, event listener ekleniyor');
        addProductBtn.addEventListener('click', () => {
            debugLog('➕ Yeni ürün butonu tıklandı');
            currentEditingId = null;
            clearProductForm();
            if (productModal) {
                productModal.classList.add('active');
                debugLog('✅ Modal açıldı');
            } else {
                debugLog('❌ productModal bulunamadı');
            }
        });
    } else {
        debugLog('❌ addProductBtn bulunamadı!');
    }
    
    // Modal'ı Kapat
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            console.log('❌ Modal kapatma butonu tıklandı');
            productModal.classList.remove('active');
            selectedFiles = [];
        });
    }
    
    // Ürün Kaydet
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', async () => {
            console.log('💾 Kaydet butonuna tıklandı');
            
            const name = document.getElementById('productName').value;
            const brand = document.getElementById('productBrand').value;
            const category = document.getElementById('productCategory').value;
            const price = document.getElementById('productPrice').value;
            
            console.log('📝 Form verileri:', { name, brand, category, price });
            console.log('📁 Seçili dosyalar:', selectedFiles.length);
            
            if (!name || !brand || !category || !price) {
                alert('Lütfen tüm alanları doldurun!');
                return;
            }
            
            if (selectedFiles.length === 0) {
                alert('En az 1 fotoğraf eklemelisiniz!');
                return;
            }
            
            console.log('✅ Form validasyonu geçti');
            
            saveProductBtn.textContent = `Yükleniyor... (0/${selectedFiles.length})`;
            saveProductBtn.disabled = true;
            
            try {
                console.log('🔄 Firebase servisleri kontrol ediliyor...');
                console.log('🔍 window.storage:', typeof window.storage);
                console.log('🔍 window.db:', typeof window.db);
                
                if (!window.storage || !window.db) {
                    alert('Firebase servisleri yüklenemedi! Sayfayı yenileyin.');
                    return;
                }
                
                const imageUrls = [];
                
                console.log('📤 Fotoğraflar yükleniyor...');
                // Upload all images
                for (let i = 0; i < selectedFiles.length; i++) {
                    const file = selectedFiles[i];
                    console.log(`📷 Fotoğraf ${i + 1}/${selectedFiles.length} yükleniyor:`, file.name);
                    
                    const storageRef = window.storage.ref();
                    const imageRef = storageRef.child(`products/${Date.now()}_${i}_${file.name}`);
                    await imageRef.put(file);
                    const url = await imageRef.getDownloadURL();
                    imageUrls.push(url);
                    
                    console.log(`✅ Fotoğraf ${i + 1} yüklendi:`, url);
                    saveProductBtn.textContent = `Yükleniyor... (${i + 1}/${selectedFiles.length})`;
                }
                
                console.log('💾 Ürün verisi oluşturuluyor...');
                const productData = {
                    name,
                    brand,
                    category,
                    price,
                    images: imageUrls,
                    imageUrl: imageUrls[0], // İlk fotoğraf (eski sistem için uyumluluk)
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                console.log('📦 Ürün verisi:', productData);
                
                if (currentEditingId) {
                    // Update
                    console.log('🔄 Ürün güncelleniyor...');
                    await window.db.collection('products').doc(currentEditingId).update(productData);
                    console.log('✅ Ürün güncellendi');
                } else {
                    // Create
                    console.log('➕ Yeni ürün oluşturuluyor...');
                    productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    await window.db.collection('products').add(productData);
                    console.log('✅ Yeni ürün oluşturuldu');
                }
                
                productModal.classList.remove('active');
                selectedFiles = [];
                loadProducts();
            } catch (error) {
                console.error('❌ Ürün kaydetme hatası:', error);
                alert('Hata: ' + error.message);
            } finally {
                saveProductBtn.disabled = false;
                saveProductBtn.textContent = 'Kaydet';
                console.log('🔄 Buton tekrar aktif edildi');
            }
        });
    }
    
    // Fotoğraf Seç
    const fileInput = document.getElementById('productImages');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            console.log('📁 Fotoğraf seçimi değişti');
            selectedFiles = Array.from(e.target.files);
            console.log('📁 Seçilen dosyalar:', selectedFiles.length);
            
            // Preview
            const preview = document.getElementById('imagePreview');
            if (preview) {
                preview.innerHTML = '';
                selectedFiles.forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.style.width = '100px';
                        img.style.height = '100px';
                        img.style.objectFit = 'cover';
                        img.style.margin = '5px';
                        img.style.borderRadius = '8px';
                        preview.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                });
            }
        });
    }
    
    // Şifre değiştirme
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            console.log('🔐 Şifre değiştir butonu tıklandı');
            changePasswordModal.style.display = 'flex';
            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
            passwordMessage.textContent = '';
        });
    }
    
    if (closePasswordModal) {
        closePasswordModal.addEventListener('click', () => {
            changePasswordModal.style.display = 'none';
        });
    }
    
    if (updatePasswordBtn) {
        updatePasswordBtn.addEventListener('click', async () => {
            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                passwordMessage.textContent = 'Tüm alanları doldurun!';
                passwordMessage.style.color = '#e74c3c';
                return;
            }
            
            if (newPassword !== confirmPassword) {
                passwordMessage.textContent = 'Yeni şifreler eşleşmiyor!';
                passwordMessage.style.color = '#e74c3c';
                return;
            }
            
            if (newPassword.length < 6) {
                passwordMessage.textContent = 'Yeni şifre en az 6 karakter olmalı!';
                passwordMessage.style.color = '#e74c3c';
                return;
            }
            
            try {
                const user = window.auth.currentUser;
                if (!user) {
                    passwordMessage.textContent = 'Oturum bulunamadı!';
                    passwordMessage.style.color = '#e74c3c';
                    return;
                }
                
                await user.updatePassword(newPassword);
                passwordMessage.textContent = 'Şifre başarıyla güncellendi!';
                passwordMessage.style.color = '#27ae60';
                
                setTimeout(() => {
                    changePasswordModal.style.display = 'none';
                }, 2000);
                
            } catch (error) {
                passwordMessage.textContent = 'Hata: ' + error.message;
                passwordMessage.style.color = '#e74c3c';
            }
        });
    }
    
    debugLog('✅ Event listener\'lar kuruldu');
}

// Admin panelini göster
function showAdminPanel() {
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    loadProducts();
}

// Login ekranını göster
function showLoginScreen() {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (adminPanel) adminPanel.style.display = 'none';
}

// Ürün formunu temizle
function clearProductForm() {
    document.getElementById('productName').value = '';
    document.getElementById('productBrand').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productImages').value = '';
    const preview = document.getElementById('imagePreview');
    if (preview) preview.innerHTML = '';
    selectedFiles = [];
}

// Ürünleri yükle
async function loadProducts() {
    console.log('📦 Ürünler yükleniyor...');
    
    try {
        const snapshot = await window.db.collection('products').orderBy('createdAt', 'desc').get();
        const products = [];
        
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`📦 ${products.length} ürün yüklendi`);
        renderProducts(products);
        
    } catch (error) {
        console.error('❌ Ürün yükleme hatası:', error);
    }
}

// Ürünleri render et
function renderProducts(products) {
    if (!productsList) return;
    
    productsList.innerHTML = '';
    
    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product-item';
        productDiv.innerHTML = `
            <div class="product-images">
                ${product.images && product.images.length > 0 ? 
                    product.images.map(img => `<img src="${img}" alt="${product.name}">`).join('') :
                    `<img src="${product.imageUrl}" alt="${product.name}">`
                }
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p><strong>Marka:</strong> ${product.brand}</p>
                <p><strong>Kategori:</strong> ${product.category}</p>
                <p><strong>Fiyat:</strong> ${product.price} TL</p>
                <div class="product-actions">
                    <button onclick="editProduct('${product.id}')" class="edit-btn">Düzenle</button>
                    <button onclick="deleteProduct('${product.id}')" class="delete-btn">Sil</button>
                </div>
            </div>
        `;
        productsList.appendChild(productDiv);
    });
}

// Ürün düzenle
function editProduct(productId) {
    console.log('✏️ Ürün düzenleniyor:', productId);
    currentEditingId = productId;
    
    // Ürün bilgilerini al ve formu doldur
    window.db.collection('products').doc(productId).get().then(doc => {
        const product = doc.data();
        document.getElementById('productName').value = product.name;
        document.getElementById('productBrand').value = product.brand;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        
        productModal.classList.add('active');
    });
}

// Ürün sil
async function deleteProduct(productId) {
    console.log('🗑️ Ürün siliniyor:', productId);
    
    if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        try {
            await window.db.collection('products').doc(productId).delete();
            console.log('✅ Ürün silindi');
            loadProducts();
        } catch (error) {
            console.error('❌ Ürün silme hatası:', error);
            alert('Ürün silinirken hata oluştu: ' + error.message);
        }
    }
}