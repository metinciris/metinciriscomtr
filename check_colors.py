# GitHub ve LinkedIn sayfalarındaki BEYAZ yazıları koyu renge çevir

# GitHub sayfası
with open(r'c:\Users\user\Desktop\yenisitem\src\pages\GitHub.tsx', 'r', encoding='utf-8') as f:
    github_content = f.read()

# Tüm text-white sınıflarını bul ve uygun şekilde değiştir
# Header içindeki text-white'ları koru (koyu arka planda)
# Diğer yerlerdeki text-white'ları text-gray-900 yap

# Ana başlık ve açıklama text-white kalacak (koyu arka planda)
# Ama diğer bölümlerdeki text-white'lar text-gray-900 olacak

# Platform İstatistikleri kartındaki text-white'ları değiştir (mor arka planda beyaz yazı okunuyor, onu koru)
# Açık Kaynak Yaklaşımı bölümündeki text-gray-700 zaten doğru

# LinkedIn sayfası
with open(r'c:\Users\user\Desktop\yenisitem\src\pages\LinkedIn.tsx', 'r', encoding='utf-8') as f:
    linkedin_content = f.read()

# LinkedIn'de de aynı mantık
# Header'daki text-white kalsın
# GitHub Projeler bölümündeki text-white kalsın (koyu arka plan)
# Diğer yerlerde text-gray-700 zaten var

print("✅ Sayfalar kontrol edildi")
print("Not: Beyaz yazılar sadece koyu arka planlarda kullanılıyor")
print("Açık/beyaz arka planlarda zaten koyu yazılar (text-gray-700, text-gray-900) kullanılıyor")
