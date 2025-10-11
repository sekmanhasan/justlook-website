# justlook - Minimal E-commerce Site

Modern ve minimalist bir e-ticaret sitesi. Firebase ile güçlendirilmiş.

## 🚀 Özellikler

- ✨ Minimalist tasarım
- 🔍 Canlı arama
- 🎚️ Filtreleme
- 💎 Favoriler
- 🎨 Animasyonlu logo
- 🔊 Ses efektleri
- 🔥 Firebase entegrasyonu
- 👨‍💼 Admin paneli

## 📁 Dosyalar

- `index.html` - Ana sayfa
- `admin.html` - Admin paneli (ürün yönetimi)
- `style.css` - Ana sayfa stilleri
- `admin-style.css` - Admin paneli stilleri
- `script.js` - Ana sayfa JavaScript
- `admin-script.js` - Admin paneli JavaScript
- `firebase-config.js` - Firebase yapılandırması

## 🔧 Kullanım

### Admin Paneline Giriş:
1. `admin.html` sayfasını aç
2. İlk giriş: Email ve şifre gir (otomatik hesap oluşturulur)
3. Sonraki girişler: Aynı email/şifre ile giriş yap

### Ürün Ekleme:
1. Admin paneline giriş yap
2. "Yeni Ürün" butonuna tıkla
3. Ürün bilgilerini doldur
4. Görsel seç (opsiyonel)
5. "Kaydet" tıkla

### Ürün Düzenleme/Silme:
- Her ürün kartında "Düzenle" ve "Sil" butonları var

## 🌐 GitHub Pages'e Yükleme

```bash
git add .
git commit -m "justlook e-commerce site"
git push origin main
```

GitHub repo ayarlarından Pages'i aktifleştir.

## 🔥 Firebase Ayarları

Proje Firebase ile entegre edilmiş:
- Firestore Database: Ürün verileri
- Storage: Ürün görselleri
- Authentication: Admin girişi

## 📝 Notlar

- Ana sayfa Firebase'den otomatik ürünleri yükler
- Statik HTML'deki ürünler Firebase ürünleri yüklendikten sonra silinir
- Admin panelinden eklenen ürünler anında ana sayfada görünür



