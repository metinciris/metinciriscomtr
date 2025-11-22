import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="w-full">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-dark-900 to-dark-900 z-0"></div>

                <div className="container relative z-10 text-center px-6">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Prof. Dr. İ. Metin Çiriş
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-fade-in delay-100">
                        SDÜ Tıp Fakültesi Tıbbi Patoloji Anabilim Dalı
                    </p>

                    <div className="flex flex-col md:flex-row justify-center gap-6 animate-fade-in delay-200">
                        <Link to="/hakkimda" className="px-8 py-3 bg-primary hover:bg-primary-dark text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-primary/25">
                            Hakkımda
                        </Link>
                        <Link to="/iletisim" className="px-8 py-3 bg-dark-800 hover:bg-dark-700 text-white border border-white/10 rounded-full font-semibold transition-all">
                            İletişime Geç
                        </Link>
                    </div>
                </div>
            </section>

            {/* Cards Section */}
            <section className="py-20 bg-dark-800/50">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Card
                            title="Hasta"
                            desc="Patoloji raporlarınız ve süreç hakkında bilgilendirme."
                            link="/iletisim"
                            icon="🏥"
                        />
                        <Card
                            title="Öğrenci"
                            desc="Ders notları, programlar ve akademik kaynaklar."
                            link="/blog" // Using blog as a placeholder for student resources
                            icon="🎓"
                        />
                        <Card
                            title="Akademik"
                            desc="Yayınlar, araştırmalar ve bilimsel çalışmalar."
                            link="/hakkimda"
                            icon="🔬"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

const Card = ({ title, desc, link, icon }) => (
    <Link to={link} className="group p-8 bg-dark-800 rounded-2xl border border-white/5 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-gray-400">{desc}</p>
    </Link>
);

export default Home;
