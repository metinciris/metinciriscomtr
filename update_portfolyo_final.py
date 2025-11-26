import re

# Read the file
with open(r'c:\Users\user\Desktop\yenisitem\src\pages\Portfolyo.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update course count from 50+ to 60+
content = content.replace(
    '<h2>Katılım ve Kurslar (50+)</h2>',
    '<h2>Katılım ve Kurslar (60+)</h2>'
)

# Update the note from 10+ to 20+
content = content.replace(
    '<p className="mt-4 italic">...ve 10+ ek kurs ve kongre katılımı</p>',
    '<p className="mt-4 italic">...ve 20+ ek kurs ve kongre katılımı</p>'
)

# Remove the İletişim section at the end
# Find and remove the entire İletişim section
iletisim_pattern = r'\s*{/\* İletişim \*/}\s*<div className="bg-gradient-to-r from-\[#8E44AD\] to-\[#9B59B6\] text-white p-8">.*?</div>\s*</PageContainer>'

content = re.sub(iletisim_pattern, '\n    </PageContainer>', content, flags=re.DOTALL)

# Write back
with open(r'c:\Users\user\Desktop\yenisitem\src\pages\Portfolyo.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Güncellemeler başarıyla yapıldı!")
print("- Kurs sayısı: 60+")
print("- Ek kurs notu: 20+")
print("- İletişim bölümü kaldırıldı")
