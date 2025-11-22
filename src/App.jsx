import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Blog from './pages/Blog';
import Contact from './pages/Contact';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hakkimda" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/iletisim" element={<Contact />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
