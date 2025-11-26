import re

# Read the file
with open(r'c:\Users\user\Desktop\yenisitem\src\pages\Portfolyo.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the typo: replace 'basboy un' with 'basboyun' (remove the space)
content = content.replace("isExpanded('basboy un')", "isExpanded('basboyun')")

# Add total counts to section titles
replacements = [
    ("Baş Boyun Patolojisi</h3>", "Baş Boyun Patolojisi (19.186)</h3>"),
    ("Endokrin Patoloji ve Sitoloji</h3>", "Endokrin Patoloji ve Sitoloji (51.566)</h3>"),
    ("Kemik ve Yumuşak Doku Patolojisi</h3>", "Kemik ve Yumuşak Doku Patolojisi (4.268)</h3>"),
    ("Santral Sinir Sistemi</h3>", "Santral Sinir Sistemi (1.528)</h3>"),
    ("Gastrointestinal Sistem</h3>", "Gastrointestinal Sistem (23.233)</h3>"),
    ("Akciğer ve Mediastinal Sistem</h3>", "Akciğer ve Mediastinal Sistem (715)</h3>"),
    ("Böbrek ve Erkek Genital Sistem</h3>", "Böbrek ve Erkek Genital Sistem (4.362)</h3>"),
    ("Kadın Genital Sistem ve Meme</h3>", "Kadın Genital Sistem ve Meme (5.264)</h3>"),
    ("Konsültasyon, Frozen ve Moleküler İnceleme</h3>", "Konsültasyon, Frozen ve Moleküler İnceleme (186.368)</h3>"),
]

for old, new in replacements:
    content = content.replace(old, new)

# Write back
with open(r'c:\Users\user\Desktop\yenisitem\src\pages\Portfolyo.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated successfully!")
