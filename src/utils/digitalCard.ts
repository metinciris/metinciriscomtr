/**
 * Dijital akademik kartvizit için tekil, herkese açık iletişim verileri.
 * Cep telefonu numarası iletişim sayfasında maskelendiğinden vCard'a eklenmez.
 */
export const DIGITAL_CARD_URL = 'https://metinciris.com.tr/kartvizit/';

export const DIGITAL_CARD = {
  fullName: 'Prof. Dr. İbrahim Metin Çiriş',
  firstName: 'İbrahim Metin',
  lastName: 'Çiriş',
  honorific: 'Prof. Dr.',
  title: 'Tıbbi Patoloji Uzmanı',
  institution: 'Süleyman Demirel Üniversitesi',
  department: 'Tıbbi Patoloji Anabilim Dalı',
  email: 'metin@metinciris.com.tr',
  universityEmail: 'ibrahimciris@sdu.edu.tr',
  officePhone: '+902462119292',
} as const;

/** vCard 3.0 metin alanı kaçış kuralları (yapısal noktalı virgüller hariç). */
export function escapeVCardText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\n|\r/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/**
 * UTF-8 vCard 3.0. Satır sonları CRLF olmalıdır.
 * Yalnızca mevcut iletişim sayfasında açık biçimde yayımlanmış bilgiler kullanılır.
 */
export function buildDigitalCardVCard(): string {
  const c = DIGITAL_CARD;
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:' + [c.lastName, c.firstName, '', c.honorific, ''].map(escapeVCardText).join(';'),
    'FN:' + escapeVCardText(c.fullName),
    'ORG:' + ['Süleyman Demirel Üniversitesi', 'Tıp Fakültesi', c.department]
      .map(escapeVCardText).join(';'),
    'TITLE:' + escapeVCardText(c.title),
    'EMAIL;TYPE=INTERNET,WORK:' + c.email,
    'EMAIL;TYPE=INTERNET,WORK:' + c.universityEmail,
    'TEL;TYPE=WORK,VOICE:' + c.officePhone,
    'ADR;TYPE=WORK:;;SDÜ Araştırma ve Uygulama Hastanesi;Isparta;;32260;Türkiye',
    'URL:' + DIGITAL_CARD_URL,
    'END:VCARD',
    '',
  ].join('\r\n');
}
