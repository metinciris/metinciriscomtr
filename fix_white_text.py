# GitHub ve LinkedIn sayfalarındaki text-white/90 ve benzer şeffaf beyaz yazıları düzelt

# GitHub sayfası
with open(r'c:\Users\user\Desktop\yenisitem\src\pages\GitHub.tsx', 'r', encoding='utf-8') as f:
    github_content = f.read()

# text-white/90'ı text-white'a çevir (mor arka planda)
github_content = github_content.replace(
    'className="text-white/90 mb-4"',
    'className="text-white mb-4"'
)

with open(r'c:\Users\user\Desktop\yenisitem\src\pages\GitHub.tsx', 'w', encoding='utf-8') as f:
    f.write(github_content)

# LinkedIn sayfası
with open(r'c:\Users\user\Desktop\yenisitem\src\pages\LinkedIn.tsx', 'r', encoding='utf-8') as f:
    linkedin_content = f.read()

# Tüm text-white/90'ları text-white'a çevir
linkedin_content = linkedin_content.replace('text-white/90', 'text-white')

with open(r'c:\Users\user\Desktop\yenisitem\src\pages\LinkedIn.tsx', 'w', encoding='utf-8') as f:
    f.write(linkedin_content)

print("✅ GitHub sayfası: text-white/90 → text-white")
print("✅ LinkedIn sayfası: Tüm text-white/90 → text-white")
print("✅ Şeffaf beyaz yazılar düz beyaza çevrildi")
