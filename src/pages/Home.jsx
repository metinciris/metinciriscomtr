import { Link } from 'react-router-dom';
import profileImage from '../assets/figma/profile.png';

const Home = () => {
    return (
        <div className="container py-20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-20">
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">
                        Prof. Dr. <br />
                        İ. Metin Çiriş
                    </h1>
                    <p className="text-xl text-gray mb-8 max-w-lg">
                        Süleyman Demirel Üniversitesi Tıp Fakültesi <br />
                        Tıbbi Patoloji Anabilim Dalı
                    </p>
                    <div className="flex gap-4 justify-center md:justify-start">
                        <Link to="/iletisim" className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors">
                            İletişime Geç
                        </Link>
                        <Link to="/hakkimda" className="bg-white text-black border border-gray-300 px-8 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors">
                            Hakkımda
                        </Link>
                    </div>
                </div>

                <div className="flex-1 flex justify-center md:justify-end">
                    <div className="relative w-64 h-64 md:w-96 md:h-96">
                        <div className="absolute inset-0 bg-gray-200 rounded-full blur-2xl opacity-50 transform translate-y-4"></div>
                        <img
                            src={profileImage}
                            alt="Prof. Dr. İ. Metin Çiriş"
                            className="relative w-full h-full object-cover rounded-full border-4 border-white shadow-xl"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card
                    title="Hasta"
                    desc="Patoloji raporlarınız, süreç bilgilendirmeleri ve randevu detayları."
                    link="/iletisim"
                />
                <Card
                    title="Öğrenci"
                    desc="Ders notları, akademik takvim ve eğitim materyalleri."
                    link="/blog"
                />
                <Card
                    title="Akademik"
                    desc="Bilimsel yayınlar, araştırmalar ve kongre sunumları."
                    link="/hakkimda"
                />
            </div>
        </div>
    );
};

const Card = ({ title, desc, link }) => (
    <Link to={link} className="bg-white p-8 rounded-2xl shadow hover:shadow-lg transition-shadow border border-gray-100 group">
        <div className="w-12 h-12 bg-gray-100 rounded-xl mb-6 flex items-center justify-center text-2xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
            {title === 'Hasta' && '🏥'}
            {title === 'Öğrenci' && '🎓'}
            {title === 'Akademik' && '🔬'}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </Link>
);

export default Home;
