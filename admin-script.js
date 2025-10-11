// Admin Script
initFirebase();

let currentEditingId = null;

// Firebase servislerinin hazır olmasını bekle
setTimeout(() => {
    if (!window.auth || !window.db || !window.storage) {
        console.error('Firebase servisleri yüklenemedi!');
        document.getElementById('loginMessage').textContent = 'Firebase servisleri yüklenemedi! Sayfayı yenileyin.';
        return;
    }
}, 1000);

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginMessage = document.getElementById('loginMessage');
const addProductBtn = document.getElementById('addProductBtn');
const productModal = document.getElementById('productModal');
const closeModal = document.getElementById('closeModal');
const productsList = document.getElementById('productsList');
const saveProductBtn = document.getElementById('saveProductBtn');

// Şifre değiştirme elements
const changePasswordBtn = document.getElementById('changePasswordBtn');
const changePasswordModal = document.getElementById('changePasswordModal');
const closePasswordModal = document.getElementById('closePasswordModal');
const updatePasswordBtn = document.getElementById('updatePasswordBtn');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordMessage = document.getElementById('passwordMessage');

// Login
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!email || !password) {
        loginMessage.textContent = 'E-posta ve şifre gerekli!';
        return;
    }
    
    try {
        await window.auth.signInWithEmailAndPassword(email, password);
        loginMessage.textContent = '';
    } catch (error) {
        // İlk giriş ise hesap oluştur
        try {
            await window.auth.createUserWithEmailAndPassword(email, password);
            loginMessage.textContent = 'Hesap oluşturuldu ve giriş yapıldı!';
            loginMessage.style.color = '#27ae60';
        } catch (signupError) {
            loginMessage.textContent = 'Hata: ' + error.message;
            loginMessage.style.color = '#e74c3c';
        }
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Şifre değiştirme modal'ını aç
if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
        console.log('Şifre değiştir butonu tıklandı');
        changePasswordModal.style.display = 'flex';
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        passwordMessage.textContent = '';
    });
} else {
    console.error('Şifre değiştir butonu bulunamadı!');
}

// Şifre değiştirme modal'ını kapat
if (closePasswordModal) {
    closePasswordModal.addEventListener('click', () => {
        changePasswordModal.style.display = 'none';
    });
}

// Şifre güncelle
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
        // Mevcut kullanıcıyı yeniden doğrula
        const user = auth.currentUser;
        if (!user) {
            passwordMessage.textContent = 'Oturum bulunamadı!';
            passwordMessage.style.color = '#e74c3c';
            return;
        }
        
        // Şifreyi güncelle
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

// Auth State
window.auth.onAuthStateChanged((user) => {
    if (user) {
        loginScreen.style.display = 'none';
        adminPanel.style.display = 'block';
        loadProducts();
    } else {
        loginScreen.style.display = 'flex';
        adminPanel.style.display = 'none';
    }
});

// Modal
let selectedFiles = [];

addProductBtn.addEventListener('click', () => {
    currentEditingId = null;
    selectedFiles = [];
    document.getElementById('modalTitle').textContent = 'Yeni Ürün';
    document.getElementById('productName').value = '';
    document.getElementById('productBrand').value = '';
    document.getElementById('productCategory').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productImages').value = '';
    document.getElementById('imagesPreview').innerHTML = '';
    productModal.classList.add('active');
});

closeModal.addEventListener('click', () => {
    productModal.classList.remove('active');
});

// Multiple Images Preview
document.getElementById('productImages').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + selectedFiles.length > 8) {
        alert('Maksimum 8 fotoğraf ekleyebilirsiniz!');
        return;
    }
    
    selectedFiles = [...selectedFiles, ...files];
    updateImagesPreview();
});

function updateImagesPreview() {
    const preview = document.getElementById('imagesPreview');
    preview.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <button class="preview-remove" data-index="${index}">✕</button>
            `;
            
            div.querySelector('.preview-remove').addEventListener('click', () => {
                selectedFiles.splice(index, 1);
                updateImagesPreview();
            });
            
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

// Save Product
saveProductBtn.addEventListener('click', async () => {
    const name = document.getElementById('productName').value;
    const brand = document.getElementById('productBrand').value;
    const category = document.getElementById('productCategory').value;
    const price = document.getElementById('productPrice').value;
    
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
        const imageUrls = [];
        
        // Upload all images
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const storageRef = window.storage.ref();
            const imageRef = storageRef.child(`products/${Date.now()}_${i}_${file.name}`);
            await imageRef.put(file);
            const url = await imageRef.getDownloadURL();
            imageUrls.push(url);
            
            saveProductBtn.textContent = `Yükleniyor... (${i + 1}/${selectedFiles.length})`;
        }
        
        const productData = {
            name,
            brand,
            category,
            price,
            images: imageUrls,
            imageUrl: imageUrls[0], // İlk fotoğraf (eski sistem için uyumluluk)
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (currentEditingId) {
            // Update
            await window.db.collection('products').doc(currentEditingId).update(productData);
        } else {
            // Create
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await window.db.collection('products').add(productData);
        }
        
        productModal.classList.remove('active');
        selectedFiles = [];
        loadProducts();
    } catch (error) {
        alert('Hata: ' + error.message);
    }
    
    saveProductBtn.textContent = 'Kaydet';
    saveProductBtn.disabled = false;
});

// Load Products
async function loadProducts() {
    productsList.innerHTML = '<div class="loading">Yükleniyor...</div>';
    
    try {
        const snapshot = await window.db.collection('products').orderBy('createdAt', 'desc').get();
        
        if (snapshot.empty) {
            productsList.innerHTML = '<div class="loading">Henüz ürün yok. Yeni ürün ekleyin!</div>';
            return;
        }
        
        productsList.innerHTML = '';
        
        snapshot.forEach((doc) => {
            const product = doc.data();
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <h3>${product.name}</h3>
                <p><strong>Marka:</strong> ${product.brand}</p>
                <p><strong>Kategori:</strong> ${product.category}</p>
                <p><strong>Fiyat:</strong> ${product.price}</p>
                ${product.imageUrl ? `<img src="${product.imageUrl}" style="max-width: 100%; margin-top: 12px; border-radius: 8px;">` : ''}
                <div class="product-actions">
                    <button class="btn-edit" onclick="editProduct('${doc.id}')">Düzenle</button>
                    <button class="btn-delete" onclick="deleteProduct('${doc.id}')">Sil</button>
                </div>
            `;
            productsList.appendChild(productItem);
        });
    } catch (error) {
        productsList.innerHTML = '<div class="loading">Hata: ' + error.message + '</div>';
    }
}

// Edit Product
window.editProduct = async (id) => {
    currentEditingId = id;
    const doc = await window.db.collection('products').doc(id).get();
    const product = doc.data();
    
    document.getElementById('modalTitle').textContent = 'Ürünü Düzenle';
    document.getElementById('productName').value = product.name;
    document.getElementById('productBrand').value = product.brand;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    
    if (product.imageUrl) {
        document.getElementById('imagePreview').innerHTML = `<img src="${product.imageUrl}" alt="Current">`;
    }
    
    productModal.classList.add('active');
};

// Delete Product
window.deleteProduct = async (id) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    
    try {
        await window.db.collection('products').doc(id).delete();
        loadProducts();
    } catch (error) {
        alert('Hata: ' + error.message);
    }
};


