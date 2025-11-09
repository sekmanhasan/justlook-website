// Admin Script
initFirebase();

let currentEditingId = null;
let selectedFiles = [];

// DOM Elements
let loginScreen, adminPanel, emailInput, passwordInput, loginBtn, logoutBtn, loginMessage;
let addProductBtn, productModal, closeModal, productsList, saveProductBtn;
let addCategoryBtn, categoryModal, closeCategoryModal, categoriesList, saveCategoryBtn;
let productsTab, categoriesTab, productsSection, categoriesSection;
let changePasswordBtn, changePasswordModal, closePasswordModal;
let currentPasswordInput, newPasswordInput, confirmPasswordInput, passwordMessage, updatePasswordBtn;

// Sayfa yüklendikten sonra DOM elementlerini tanımla
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    loginScreen = document.getElementById('loginScreen');
    adminPanel = document.getElementById('adminPanel');
    emailInput = document.getElementById('emailInput');
    passwordInput = document.getElementById('passwordInput');
    loginBtn = document.getElementById('loginBtn');
    logoutBtn = document.getElementById('logoutBtn');
    loginMessage = document.getElementById('loginMessage');
    
    // Products
    addProductBtn = document.getElementById('addProductBtn');
    productModal = document.getElementById('productModal');
    closeModal = document.getElementById('closeModal');
    productsList = document.getElementById('productsList');
    saveProductBtn = document.getElementById('saveProductBtn');
    
    // Categories
    addCategoryBtn = document.getElementById('addCategoryBtn');
    categoryModal = document.getElementById('categoryModal');
    closeCategoryModal = document.getElementById('closeCategoryModal');
    categoriesList = document.getElementById('categoriesList');
    saveCategoryBtn = document.getElementById('saveCategoryBtn');
    
    // Tabs
    productsTab = document.getElementById('productsTab');
    categoriesTab = document.getElementById('categoriesTab');
    productsSection = document.getElementById('productsSection');
    categoriesSection = document.getElementById('categoriesSection');
    
    // Şifre değiştirme elements
    changePasswordBtn = document.getElementById('changePasswordBtn');
    changePasswordModal = document.getElementById('changePasswordModal');
    closePasswordModal = document.getElementById('closePasswordModal');
    currentPasswordInput = document.getElementById('currentPassword');
    newPasswordInput = document.getElementById('newPassword');
    confirmPasswordInput = document.getElementById('confirmPassword');
    passwordMessage = document.getElementById('passwordMessage');
    updatePasswordBtn = document.getElementById('updatePasswordBtn');
    
    // Event listener'ları kur
    setupEventListeners();
    
    // Auth state değişikliklerini dinle
    if (window.auth) {
        window.auth.onAuthStateChanged((user) => {
            if (user) {
                showAdminPanel();
            } else {
                showLoginScreen();
            }
        });
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
    // Login
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = emailInput.value;
            const password = passwordInput.value;
            
            if (!email || !password) {
                loginMessage.textContent = 'E-posta ve şifre gerekli!';
                loginMessage.style.color = '#e74c3c';
                return;
            }
            
            try {
                await window.auth.signInWithEmailAndPassword(email, password);
            } catch (error) {
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
    
    // Google Login
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await window.auth.signInWithPopup(provider);
                const user = result.user;
                
                // Kullanıcı bilgilerini Firestore'a kaydet (eğer yoksa)
                const userDoc = await window.db.collection('users').doc(user.uid).get();
                if (!userDoc.exists) {
                    await window.db.collection('users').doc(user.uid).set({
                        name: user.displayName || 'Admin',
                        email: user.email,
                        photoURL: user.photoURL,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        isAdmin: true,
                        favorites: []
                    });
                }
                
            } catch (error) {
                if (loginMessage) {
                    loginMessage.textContent = 'Google ile giriş başarısız: ' + error.message;
                    loginMessage.style.color = '#e74c3c';
                }
            }
        });
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.auth.signOut();
        });
    }
    
    // Yeni Ürün Modal'ını Aç
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            currentEditingId = null;
            clearProductForm();
            if (productModal) {
                productModal.classList.add('active');
            }
        });
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
            const name = document.getElementById('productName').value;
            const brand = document.getElementById('productBrand').value;
            const category = document.getElementById('productCategory').value;
            const price = document.getElementById('productPrice').value;
            const link = document.getElementById('productLink').value;
            
            if (!name || !brand || !category || !price) {
                alert('Lütfen tüm alanları doldurun!');
                return;
            }
            
            if (selectedFiles.length === 0) {
                alert('En az 1 fotoğraf eklemelisiniz!');
                return;
            }
            
            saveProductBtn.textContent = `Yükleniyor... (0/${selectedFiles.length})`;
            saveProductBtn.disabled = true;
            
            try {
                if (!window.storage || !window.db) {
                    alert('Firebase servisleri yüklenemedi! Sayfayı yenileyin.');
                    return;
                }
                
                const imageUrls = [];
                
                // Upload all images to Cloudinary
                for (let i = 0; i < selectedFiles.length; i++) {
                    const file = selectedFiles[i];
                    
                    try {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('upload_preset', window.cloudinaryConfig.uploadPreset);
                        formData.append('folder', 'justlook/products');
                        
                        const response = await fetch(`https://api.cloudinary.com/v1_1/${window.cloudinaryConfig.cloudName}/image/upload`, {
                            method: 'POST',
                            body: formData
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        
                        const data = await response.json();
                        const url = data.secure_url;
                        imageUrls.push(url);
                        saveProductBtn.textContent = `Yükleniyor... (${i + 1}/${selectedFiles.length})`;
                        
                    } catch (uploadError) {
                        throw uploadError;
                    }
                }
                
                const productData = {
                    name,
                    brand,
                    category,
                    price,
                    link: link || '',
                    images: imageUrls,
                    imageUrl: imageUrls[0],
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                if (currentEditingId) {
                    await window.db.collection('products').doc(currentEditingId).update(productData);
                } else {
                    productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    await window.db.collection('products').add(productData);
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
            }
        });
    }
    
    // Fotoğraf Seç
    const fileInput = document.getElementById('productImages');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            selectedFiles = Array.from(e.target.files);
            
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
    
    // Tab Switching
    if (productsTab && categoriesTab && productsSection && categoriesSection) {
        productsTab.addEventListener('click', () => switchTab('products'));
        categoriesTab.addEventListener('click', () => switchTab('categories'));
    }
    
    // Kategori Modal'ını Aç
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            currentEditingId = null;
            clearCategoryForm();
            if (categoryModal) {
                categoryModal.classList.add('active');
            }
        });
    }
    
    // Kategori Modal'ı Kapat
    if (closeCategoryModal) {
        closeCategoryModal.addEventListener('click', () => {
            categoryModal.classList.remove('active');
        });
    }
    
    // Kategori Kaydet
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', async () => {
            const name = document.getElementById('categoryName').value;
            const description = document.getElementById('categoryDescription').value;
            
            if (!name.trim()) {
                alert('Kategori adı gerekli!');
                return;
            }
            
            saveCategoryBtn.textContent = 'Kaydediliyor...';
            saveCategoryBtn.disabled = true;
            
            try {
                const categoryData = {
                    name: name.trim(),
                    description: description.trim(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                if (currentEditingId) {
                    await window.db.collection('categories').doc(currentEditingId).update(categoryData);
                } else {
                    categoryData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    await window.db.collection('categories').add(categoryData);
                }
                
                categoryModal.classList.remove('active');
                loadCategories();
                updateCategoryDropdown();
            } catch (error) {
                console.error('❌ Kategori kaydetme hatası:', error);
                alert('Hata: ' + error.message);
            } finally {
                saveCategoryBtn.disabled = false;
                saveCategoryBtn.textContent = 'Kaydet';
            }
        });
    }
}

// Admin panelini göster
function showAdminPanel() {
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
    loadProducts();
    loadCategories();
    updateCategoryDropdown();
}

// Tab switching
function switchTab(tabName) {
    // Remove active class from all tabs and sections
    productsTab.classList.remove('active');
    categoriesTab.classList.remove('active');
    productsSection.classList.remove('active');
    categoriesSection.classList.remove('active');
    
    // Add active class to selected tab and section
    if (tabName === 'products') {
        productsTab.classList.add('active');
        productsSection.classList.add('active');
    } else if (tabName === 'categories') {
        categoriesTab.classList.add('active');
        categoriesSection.classList.add('active');
    }
}

// Kategori formunu temizle
function clearCategoryForm() {
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryDescription').value = '';
    document.getElementById('categoryModalTitle').textContent = 'Yeni Kategori';
}

// Kategorileri yükle
async function loadCategories() {
    console.log('📂 Kategoriler yükleniyor...');
    
    try {
        const snapshot = await window.db.collection('categories').orderBy('name').get();
        const categories = [];
        
        snapshot.forEach(doc => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`📂 ${categories.length} kategori yüklendi`);
        renderCategories(categories);
        
    } catch (error) {
        console.error('❌ Kategori yükleme hatası:', error);
    }
}

// Kategorileri render et
function renderCategories(categories) {
    if (!categoriesList) return;
    
    categoriesList.innerHTML = '';
    
    if (categories.length === 0) {
        categoriesList.innerHTML = '<div class="loading">Henüz kategori eklenmemiş.</div>';
        return;
    }
    
    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-item';
        categoryDiv.innerHTML = `
            <h3>${category.name}</h3>
            <p>${category.description || 'Açıklama yok'}</p>
            <div class="category-meta">
                Oluşturulma: ${category.createdAt ? new Date(category.createdAt.toDate()).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
            </div>
            <div class="category-actions">
                <button class="btn-edit" onclick="editCategory('${category.id}')">Düzenle</button>
                <button class="btn-delete" onclick="deleteCategory('${category.id}')">Sil</button>
            </div>
        `;
        categoriesList.appendChild(categoryDiv);
    });
}

// Kategori düzenle
function editCategory(categoryId) {
    console.log('✏️ Kategori düzenleniyor:', categoryId);
    currentEditingId = categoryId;
    
    // Kategori bilgilerini al ve formu doldur
    window.db.collection('categories').doc(categoryId).get().then(doc => {
        const category = doc.data();
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value = category.description || '';
        document.getElementById('categoryModalTitle').textContent = 'Kategori Düzenle';
        
        categoryModal.classList.add('active');
    });
}

// Kategori sil
async function deleteCategory(categoryId) {
    console.log('🗑️ Kategori siliniyor:', categoryId);
    
    if (confirm('Bu kategoriyi silmek istediğinizden emin misiniz? Bu kategoriyi kullanan ürünler etkilenebilir.')) {
        try {
            await window.db.collection('categories').doc(categoryId).delete();
            console.log('✅ Kategori silindi');
            loadCategories();
            updateCategoryDropdown();
        } catch (error) {
            console.error('❌ Kategori silme hatası:', error);
            alert('Kategori silinirken hata oluştu: ' + error.message);
        }
    }
}

// Kategori dropdown'ını güncelle
async function updateCategoryDropdown() {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) return;
    
    try {
        const snapshot = await window.db.collection('categories').orderBy('name').get();
        
        // Clear existing options except first one
        categorySelect.innerHTML = '<option value="">Kategori Seçin...</option>';
        
        snapshot.forEach(doc => {
            const category = doc.data();
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
        
        console.log(`📂 ${snapshot.size} kategori dropdown'a eklendi`);
    } catch (error) {
        console.error('❌ Kategori dropdown güncelleme hatası:', error);
    }
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
    document.getElementById('productLink').value = '';
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
        document.getElementById('productLink').value = product.link || '';
        
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