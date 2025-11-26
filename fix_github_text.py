# GitHub sayfasındaki metin rengini düzelt
with open(r'c:\Users\user\Desktop\yenisitem\src\pages\GitHub.tsx', 'r', encoding='utf-8') as f:
    github_content = f.read()

# text-white/90'ı text-white'a değiştir
github_content = github_content.replace(
    'className="text-white/90 max-w-3xl text-lg mb-6"',
    'className="text-white text-lg mb-6 leading-relaxed max-w-3xl"'
)

# Dosyayı kaydet
with open(r'c:\Users\user\Desktop\yenisitem\src\pages\GitHub.tsx', 'w', encoding='utf-8') as f:
    f.write(github_content)

print("GitHub sayfası düzeltildi!")
