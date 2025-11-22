const About = () => {
    return (
        <div className="container mx-auto px-6 py-20">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-center">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        Hakkımda
                    </span>
                </h1>

                <div className="bg-dark-800 rounded-2xl p-8 md:p-12 border border-white/5 shadow-xl">
                    <div className="prose prose-invert max-w-none text-gray-300 space-y-6 text-lg">
                        <p>
                            Merhaba, Ben <strong>Prof. Dr. İ. Metin Çiriş</strong>.
                        </p>
                        <p>
                            Süleyman Demirel Üniversitesi Tıp Fakültesi, Tıbbi Patoloji Anabilim Dalı'nda öğretim üyesi olarak görev yapmaktayım.
                        </p>
                        <p>
                            Mesleki hayatım boyunca tıp eğitimi, patoloji alanındaki bilimsel araştırmalar ve hasta tanı süreçlerinde aktif rol aldım.
                            Web sitem üzerinden öğrencilerim için ders materyalleri, hastalarım için bilgilendirmeler ve akademik çalışmalarımı paylaşmayı hedefliyorum.
                        </p>

                        <h3 className="text-2xl font-bold text-white mt-8 mb-4">İlgi Alanları</h3>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Cerrahi Patoloji</li>
                            <li>Sitopatoloji</li>
                            <li>Moleküler Patoloji</li>
                            <li>Tıp Eğitimi</li>
                        </ul>

                        <div className="mt-12 p-6 bg-dark-900/50 rounded-xl border border-white/5">
                            <h4 className="text-xl font-bold text-white mb-2">İletişim</h4>
                            <p>SDÜ Tıp Fakültesi, Tıbbi Patoloji Anabilim Dalı, Isparta</p>
                            <p className="mt-2 text-primary">info@metinciris.com.tr</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
