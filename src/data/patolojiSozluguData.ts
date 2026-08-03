export interface Term {
    word: string;
    definition: string;
    category?: string;
}

export interface FAQ {
    question: string;
    answer: string;
}

export const TERMS: Term[] = [
    {
        word: 'Adenokarsinom',
        definition: 'Salgı yapan bez yapılarından köken alan kötü huylu (kanser) tümör.',
        category: 'Tümör'
    },
    {
        word: 'Abse',
        definition: 'İltihap hücreleri ve ölü doku artıklarından oluşan irin birikimi.',
        category: 'Enfeksiyon'
    },
    {
        word: 'Atipi / Atipik',
        definition: 'Hücrelerin normal görünümlerinden farklılaşması. Kanser anlamına gelmez ancak takip gerektirebilir.',
        category: 'Hücre Yapısı'
    },
    {
        word: 'Benign',
        definition: 'İyi huylu. Yayılma eğilimi göstermeyen, genellikle sınırlı kalan kitle.',
        category: 'Genel'
    },
    {
        word: 'Biyopsi',
        definition: 'Tanı koymak amacıyla vücuttan alınan küçük doku örneği.',
        category: 'İşlem'
    },
    {
        word: 'Diferansiasyon',
        definition: 'Tümör hücrelerinin köken aldığı normal dokuya ne kadar benzediği. İyi diferansiye tümörler normal dokuya daha çok benzer.',
        category: 'Hücre Yapısı'
    },
    {
        word: 'Displazi',
        definition: 'Doku veya hücrelerin normal gelişim ve organizasyonunun bozulması. Kanser öncesi (pre-kanseröz) bir değişiklik olabilir.',
        category: 'Hücre Yapısı'
    },
    {
        word: 'Evre (Stage)',
        definition: 'Kanserin vücuttaki yaygınlık derecesi (tümör boyutu, lenf nodu tutulumu ve uzak sıçrama durumu).',
        category: 'Tanı'
    },
    {
        word: 'Hiperplazi',
        definition: 'Hücre sayısının normalden fazla artması. Genellikle bir uyarana (hormonal vb.) yanıt olarak gelişir.',
        category: 'Hücre Yapısı'
    },
    {
        word: 'İn situ',
        definition: 'Kanserin henüz başladığı dokunun sınırları içinde kalması, derin dokulara yayılmaması.',
        category: 'Tümör'
    },
    {
        word: 'İnflamasyon',
        definition: 'Vücudun yaralanma veya enfeksiyona karşı verdiği iltihabi tepki (yangı).',
        category: 'Genel'
    },
    {
        word: 'İnvazyon',
        definition: 'Tümör hücrelerinin çevredeki normal dokuların içine doğru yayılması.',
        category: 'Tümör'
    },
    {
        word: 'Karsinom',
        definition: 'Vücudun iç veya dış yüzeylerini örten hücrelerden (epitel) gelişen kanser türü.',
        category: 'Tümör'
    },
    {
        word: 'Kist',
        definition: 'İçerisinde sıvı veya yarı katı madde bulunan, etrafı ince bir zarla çevrili keselere denir.',
        category: 'Genel'
    },
    {
        word: 'Lenfovasküler İnvazyon',
        definition: 'Tümör hücrelerinin kan veya lenf damarlarına girmesi. Yayılma riski açısından önemlidir.',
        category: 'Tanı'
    },
    {
        word: 'Lezyon',
        definition: 'Doku üzerinde meydana gelen herhangi bir yapısal bozukluk veya hastalık bölgesi.',
        category: 'Genel'
    },
    {
        word: 'Malign',
        definition: 'Kötü huylu. Çevresine yayılma ve başka organlara sıçrama potansiyeli olan tümör.',
        category: 'Genel'
    },
    {
        word: 'Metaplazi',
        definition: 'Bir hücre tipinin yerini başka bir düzgün hücre tipine bırakması. Genellikle bir tahrişe yanıt olarak gelişir.',
        category: 'Hücre Yapısı'
    },
    {
        word: 'Metastaz',
        definition: 'Kanserin başladığı bölgeden vücudun başka bir bölgesine yayılması.',
        category: 'Tümör'
    },
    {
        word: 'Mitoz',
        definition: 'Hücre bölünmesi hızı. Kanserli dokularda mitoz sayısının artması genellikle agresif seyirle ilişkilidir.',
        category: 'Hücre Yapısı'
    },
    {
        word: 'Nekroz',
        definition: 'Hücre veya dokuların ölümü.',
        category: 'Genel'
    },
    {
        word: 'Neoplazi',
        definition: 'Kontrolsüz hücre çoğalması sonucu oluşan yeni doku oluşumu (kitle/tümör).',
        category: 'Tümör'
    },
    {
        word: 'Nükleer Derece (Grade)',
        definition: 'Hücre çekirdeğinin görüntüsüne göre belirlenen anormallik derecesi. Yüksek derece genellikle hızlı büyümeyi gösterir.',
        category: 'Tanı'
    },
    {
        word: 'Perinöral İnvazyon',
        definition: 'Tümör hücrelerinin sinir kılıfı çevresine yayılması.',
        category: 'Tanı'
    },
    {
        word: 'Polip',
        definition: 'Organların mukoza adı verilen iç yüzeylerinden dışarıya doğru sarkan saplı veya sapsız doku çıkıntıları.',
        category: 'Genel'
    },
    {
        word: 'Prognoz',
        definition: 'Hastalığın seyri ve iyileşme ihtimali hakkındaki öngörü.',
        category: 'Genel'
    },
    {
        word: 'Reaktif',
        definition: 'Hücrelerin bir hasara (tahriş, iltihap vb.) yanıt olarak gösterdiği geçici ve iyi huylu değişiklikler.',
        category: 'Hücre Yapısı'
    },
    {
        word: 'Rezeksiyon',
        definition: 'Bir organın veya dokunun bir kısmının veya tamamının ameliyatla çıkarılması.',
        category: 'İşlem'
    },
    {
        word: 'Sitoloji',
        definition: 'Hücrelerin tek tek veya küçük gruplar halinde incelendiği bilim dalı (örneğin smear testi).',
        category: 'İşlem'
    }
].sort((a, b) => a.word.localeCompare(b.word, 'tr'));

export const FAQS: FAQ[] = [
    {
        question: "Patoloji raporumda 'Atipi' yazıyor, bu kanser mi demek?",
        answer: "Hayır, atipi doğrudan kanser demek değildir. Sadece hücrelerin normalden biraz farklı göründüğünü ifade eder. Bu değişim bir iltihaba bağlı olabileceği gibi, daha yakından takip edilmesi gereken bir durumun habercisi de olabilir. Mutlaka doktorunuza danışmalısınız."
    },
    {
        question: "Sonuçların çıkması neden uzun sürüyor?",
        answer: "Doku örnekleri alındıktan sonra birçok kimyasal işlemden geçer, ardından ince kesitler alınarak boyanır. Bazı durumlarda kesin tanı için 'immünhistokimya' denilen ek boyamalar veya genetik testler gerekebilir. Bu işlemler titizlikle yapıldığı için birkaç gün veya daha uzun sürebilir."
    },
    {
        question: "Biyopsi yaptırmak kanserin yayılmasına neden olur mu?",
        answer: "Tıbbi çalışmalar, standart biyopsi işlemlerinin birçok kanser türünde, kanserin yayılmasına neden olmadığını göstermektedir. Aksine, doğru tanı ve uygun tedavi planı için biyopsi hayati önem taşır."
    },
    {
        question: "Raporumu aldım ama hiçbir şey anlamıyorum, ne yapmalıyım?",
        answer: "Patoloji raporları doktorlar arası iletişim için teknik bir dille yazılır. Raporunuzu yorumlayacak en doğru kişi, biyopsiyi isteyen ve fiziksel muayenenizi yapan klinik doktorunuzdur."
    }
];
