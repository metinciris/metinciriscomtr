# GitHub ve LinkedIn sayfalarındaki gradient arka planları düzelt

# GitHub sayfası
with open(r'c:\Users\user\Desktop\yenisitem\src\pages\GitHub.tsx', 'r', encoding='utf-8') as f:
    github_content = f.read()

# GitHub header gradient'ini daha koyu yap
github_content = github_content.replace(
    'bg-gradient-to-r from-[#333333] to-[#24292e]',
    'bg-gradient-to-r from-[#1a1a1a] to-[#0d1117]'
)

with open(r'c:\Users\user\Desktop\yenisitem\src\pages\GitHub.tsx', 'w', encoding='utf-8') as f:
    f.write(github_content)

# LinkedIn sayfası
with open(r'c:\Users\user\Desktop\yenisitem\src\pages\LinkedIn.tsx', 'r', encoding='utf-8') as f:
    linkedin_content = f.read()

# LinkedIn header gradient'ini daha koyu yap
linkedin_content = linkedin_content.replace(
    'bg-gradient-to-r from-[#0077B5] to-[#00a0dc]',
    'bg-gradient-to-r from-[#005582] to-[#0077B5]'
)

# LinkedIn'deki GitHub projeler bölümünü de düzelt
linkedin_content = linkedin_content.replace(
    'bg-gradient-to-r from-[#333333] to-[#24292e]',
    'bg-gradient-to-r from-[#1a1a1a] to-[#0d1117]'
)

with open(r'c:\Users\user\Desktop\yenisitem\src\pages\LinkedIn.tsx', 'w', encoding='utf-8') as f:
    f.write(linkedin_content)

print("✅ GitHub sayfası gradient düzeltildi (daha koyu gri)")
print("✅ LinkedIn sayfası gradient düzeltildi (daha koyu mavi)")
print("✅ Her iki sayfada da beyaz yazılar artık rahat okunuyor")
