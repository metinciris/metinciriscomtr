const Contact = () => {
    return (
        <div className="container mx-auto px-6 py-20">
            <div className="max-w-2xl mx-auto text-center">
                <h1 className="text-4xl font-bold mb-8">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        İletişim
                    </span>
                </h1>

                <div className="bg-dark-800 rounded-2xl p-10 border border-white/5 shadow-xl">
                    <p className="text-xl text-gray-300 mb-8">
                        Sorularınız veya görüşleriniz için bana ulaşabilirsiniz.
                    </p>

                    <a
                        href="mailto:info@metinciris.com.tr"
                        className="inline-flex items-center justify-center px-8 py-4 bg-primary hover:bg-primary-dark text-white rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-primary/25"
                    >
                        ✉️ E-posta Gönder
                    </a>

                    <div className="mt-12 pt-12 border-t border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">Adres</h3>
                        <p className="text-gray-400">
                            Süleyman Demirel Üniversitesi<br />
                            Tıp Fakültesi<br />
                            Tıbbi Patoloji Anabilim Dalı<br />
                            Isparta / Türkiye
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
