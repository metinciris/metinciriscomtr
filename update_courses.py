import re

# Read the file
with open(r'c:\Users\user\Desktop\yenisitem\src\pages\Portfolyo.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update the course count from 40+ to 50+
content = content.replace(
    '<h2>Katılım ve Kurslar (40+)</h2>',
    '<h2>Katılım ve Kurslar (50+)</h2>'
)

# Find the courses section and replace it with updated content in reverse chronological order
old_courses = '''              <div className="space-y-3 text-muted-foreground">
                <p>• XIII. Ulusal Patoloji Kongresi (1997, İstanbul)</p>
                <p>• Deri eki tümörleri kursu (1998, İzmir)</p>
                <p>• XIV. Ulusal Patoloji Kongresi (1999, Kuşadası)</p>
                <p>• Kemik ve yumuşak doku tümörleri sempozyumu (2002, Pamukkale Ü)</p>
                <p>• GEP endokrin tümörler kursu (2004, İstanbul)</p>
                <p>• Cerrahi meme patolojisi günleri (2005, İstanbul)</p>
                <p>• Tiroid sitopatolojisi kursu (2005, Hacettepe)</p>
                <p>• Nefropatoloji kursu (2005, Adana)</p>
                <p>• Karaciğer patolojisi kursu (2008, İzmir)</p>
                <p>• 36th European Congress of Cytology (2011, İstanbul)</p>
                <p>• Dermatopatoloji kursu (2012, İstanbul)</p>
                <p>• Endokrin kursu (2013, İstanbul)</p>
                <p>• Nefropatoloji kursu (2014, İzmir)</p>
                <p>• Meme kanseri patolojisi kursu (2018, İzmir)</p>
                <p>• 29. Ulusal Patoloji Kongresi (2019, Trabzon)</p>
                <p>• Baş boyun patolojisi kursu (2019, İzmir)</p>
                <p className="mt-4 italic">...ve 20+ ek kurs ve kongre katılımı</p>
              </div>'''

new_courses = '''              <div className="space-y-3 text-muted-foreground">
                <p>• 34. Ulusal Patoloji Kongresi (2025, Belek)</p>
                <p>• Sağlık Profesyonelleri Eğiticileri İçin Ölçme Değerlendirme Kursu (2025)</p>
                <p>• Pankreas ve Periampuller Bölge Tümörleri Kursu (2021)</p>
                <p>• Makroskopi Teknikleri Kursu - 1 (2021)</p>
                <p>• USCAP Mesenchymal Tumors of the Gynecologic Tract, CME/SAM Certificate (2020)</p>
                <p>• USCAP Vascular Tumors, CME/SAM Certificate (2020)</p>
                <p>• USCAP Giant Cell-Rich Tumors of Bone, CME/SAM Certificate (2020)</p>
                <p>• USCAP Myxoid Tumors of Soft Tissue, CME/SAM Certificate (2020)</p>
                <p>• USCAP Cartilaginous Tumors, CME/SAM Certificate (2020)</p>
                <p>• USCAP Adipocytic Tumors, CME/SAM Certificate (2020)</p>
                <p>• USCAP Round Cell Sarcomas, CME/SAM Certificate (2020)</p>
                <p>• USCAP Nodal and Extranodal Reactive and Borderline Lymphoid Proliferations, CME/SAM Certificate (2020)</p>
                <p>• 29. Ulusal Patoloji Kongresi (2019, Trabzon)</p>
                <p>• Baş boyun patolojisi kursu (2019, İzmir)</p>
                <p>• Meme kanseri patolojisi kursu (2018, İzmir)</p>
                <p>• Nefropatoloji kursu (2014, İzmir)</p>
                <p>• Endokrin kursu (2013, İstanbul)</p>
                <p>• Dermatopatoloji kursu (2012, İstanbul)</p>
                <p>• 36th European Congress of Cytology (2011, İstanbul)</p>
                <p>• Karaciğer patolojisi kursu (2008, İzmir)</p>
                <p>• Nefropatoloji kursu (2005, Adana)</p>
                <p>• Tiroid sitopatolojisi kursu (2005, Hacettepe)</p>
                <p>• Cerrahi meme patolojisi günleri (2005, İstanbul)</p>
                <p>• GEP endokrin tümörler kursu (2004, İstanbul)</p>
                <p>• Kemik ve yumuşak doku tümörleri sempozyumu (2002, Pamukkale Ü)</p>
                <p>• XIV. Ulusal Patoloji Kongresi (1999, Kuşadası)</p>
                <p>• Deri eki tümörleri kursu (1998, İzmir)</p>
                <p>• XIII. Ulusal Patoloji Kongresi (1997, İstanbul)</p>
                <p className="mt-4 italic">...ve 10+ ek kurs ve kongre katılımı</p>
              </div>'''

content = content.replace(old_courses, new_courses)

# Write back
with open(r'c:\Users\user\Desktop\yenisitem\src\pages\Portfolyo.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Kurslar başarıyla güncellendi!")
