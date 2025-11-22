import { useState } from 'react'
import './App.css'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">Metin Ciriş</div>
        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <a href="#home">Ana Sayfa</a>
          <a href="#about">Hakkımda</a>
          <a href="#portfolio">Portfolyo</a>
          <a href="#contact">İletişim</a>
        </div>
        <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </nav>

      <section id="home" className="hero">
        <div className="hero-content">
          <h1>Merhaba, Ben Metin Ciriş</h1>
          <p>Modern Web Tasarımı & Geliştirme</p>
          <a href="#contact" className="cta-button">İletişime Geç</a>
        </div>
      </section>

      <section id="about" className="section about">
        <div className="container">
          <h2>Hakkımda</h2>
          <p>
            Dijital dünyada iz bırakan, kullanıcı dostu ve estetik web deneyimleri tasarlıyorum. 
            Teknoloji ve sanatı birleştirerek markanızı en iyi şekilde temsil eden çözümler sunuyorum.
          </p>
        </div>
      </section>

      <section id="portfolio" className="section portfolio">
        <div className="container">
          <h2>Portfolyo</h2>
          <div className="grid">
            <div className="card">
              <h3>Proje 1</h3>
              <p>Modern bir e-ticaret arayüzü.</p>
            </div>
            <div className="card">
              <h3>Proje 2</h3>
              <p>Kurumsal kimlik çalışması.</p>
            </div>
            <div className="card">
              <h3>Proje 3</h3>
              <p>Kişisel blog tasarımı.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="section contact">
        <div className="container">
          <h2>İletişim</h2>
          <p>Projeleriniz için benimle iletişime geçin.</p>
          <a href="mailto:info@metinciris.com.tr" className="email-link">info@metinciris.com.tr</a>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2024 Metin Ciriş. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  )
}

export default App
