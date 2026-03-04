import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Apple, Play } from 'lucide-react';

const App = () => {
  const [scrolled, setScrolled] = useState(false);
  const [currentImage, setCurrentImage] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((curr) => (curr % 4) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container" style={{ background: '#ffffff', color: '#1e3a8a', minHeight: '100vh', fontFamily: '"Outfit", sans-serif' }}>

      {/* Navigation */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <a href="#" className="nav-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Bey3a" style={{ height: '32px', filter: 'brightness(0) invert(0) sepia(1)' }} />
        </a>

        <div className="nav-links">
          <a href="#" className="nav-link">The Shop</a>
          <a href="#" className="nav-link active">Get The App</a>
          <a href="#" className="nav-link">About</a>
        </div>

        <button className="btn" style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem', borderRadius: '50px', fontWeight: 600, color: '#000', backgroundColor: 'transparent', border: '1px solid #000' }}>
          SEE IF I PREQUALIFY
        </button>
      </nav>

      {/* Hero Section (Phones + Text) */}
      <section style={{ paddingTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', overflow: 'hidden' }}>

        {/* Phones appearing at the top */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', height: '400px', display: 'flex', justifyContent: 'center', marginTop: '-150px' }}>
          {/* Left Phone */}
          <motion.div
            style={{ position: 'absolute', left: '10%', top: '50px', zIndex: 1, scale: 0.85, rotate: -3 }}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="phone-mockup" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 5px #f1f5f9, 0 0 0 7px #e2e8f0' }}>
              <div className="phone-screen" style={{ padding: 0 }}>
                <img src="/screen2.png" alt="Screen 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </motion.div>

          {/* Right Phone */}
          <motion.div
            style={{ position: 'absolute', right: '10%', top: '50px', zIndex: 1, scale: 0.85, rotate: 3 }}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="phone-mockup" style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 5px #f1f5f9, 0 0 0 7px #e2e8f0' }}>
              <div className="phone-screen" style={{ padding: 0 }}>
                <img src="/screen3.png" alt="Screen 3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </motion.div>

          {/* Center Phone */}
          <motion.div
            style={{ position: 'relative', zIndex: 10, scale: 1.1, top: '20px' }}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="phone-mockup" style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.15), 0 0 0 5px #f1f5f9, 0 0 0 7px #e2e8f0' }}>
              <div className="phone-screen" style={{ padding: 0 }}>
                <motion.img
                  key={currentImage}
                  src={`/screen${currentImage}.png`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                  alt="App Screen"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute' }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Hero Text Content */}
        <div style={{ padding: '0 5%', marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.h1
            className="title-lg"
            style={{ maxWidth: '1000px', margin: '0 auto 2rem auto', color: '#1e3a8a', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Step up your credit game. Designed to support you and your goals. Download the app to log in to your account.
          </motion.h1>

          <motion.div
            style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <button className="btn" style={{ background: '#000', color: '#fff', borderRadius: '8px', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={24} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                <span style={{ fontSize: '0.65rem' }}>GET IT ON</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Google Play</span>
              </div>
            </button>

            <button className="btn" style={{ background: '#000', color: '#fff', borderRadius: '8px', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Apple size={24} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                <span style={{ fontSize: '0.65rem' }}>Download on the</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>App Store</span>
              </div>
            </button>
          </motion.div>

          <motion.div
            style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* Simulated QR Code */}
            <div style={{ width: '60px', height: '60px', background: 'repeating-linear-gradient(45deg, #000 0, #000 5px, #fff 5px, #fff 10px)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
              <div style={{ background: '#000' }} /><div style={{ background: '#fff' }} />
              <div style={{ background: '#fff' }} /><div style={{ background: '#000' }} />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666', maxWidth: '200px', textAlign: 'left', lineHeight: 1.4 }}>
              Hold your device camera up to the QR code to download the app.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Massive Typography Section */}
      <section style={{ padding: '6rem 0 3rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5vw', width: '100%' }}>
          <h2 style={{ fontSize: '14vw', fontWeight: 500, color: '#1e3a8a', lineHeight: 0.8, margin: 0, letterSpacing: '-0.05em' }}>THE</h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: '#1e3a8a' }}>
            <span style={{ fontSize: '1rem', fontWeight: 500 }}>Features you need.</span>
            <span style={{ fontSize: '1rem', fontWeight: 500 }}>Nothing you don't.</span>
          </div>
          <h2 style={{ fontSize: '14vw', fontWeight: 500, color: '#1e3a8a', lineHeight: 0.8, margin: 0, letterSpacing: '-0.05em' }}>APP</h2>
        </div>
      </section>

      <div style={{ width: '80%', height: '1px', background: '#e5e7eb', margin: '0 auto 6rem auto' }} />

      {/* "Looking out for you" Section */}
      <section style={{ padding: '4rem 5%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: '#fafafa', position: 'relative', overflow: 'hidden' }}>
        <div style={{ marginBottom: '4rem', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#1e3a8a' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <h2 style={{ fontSize: '4rem', fontWeight: 500, color: '#1e3a8a', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Looking out <span style={{ color: '#c4b5fd' }}>for you</span>
          </h2>
          <p style={{ color: '#6b7280', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            A personalized dashboard to help you reach your goals. Apply and get an instant decision in as little as 2 minutes.
          </p>
          <button className="btn" style={{ background: '#ddd6fe', color: '#4c1d95', borderRadius: '50px', padding: '1rem 2rem', fontWeight: 600, border: 'none', letterSpacing: '0.05em', fontSize: '0.9rem' }}>
            GET STARTED
          </button>
        </div>

        {/* Floating Cards Graphic Setup */}
        <div style={{ position: 'relative', height: '400px', width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

          <motion.div
            style={{ position: 'absolute', left: '5%', bottom: '-50px', zIndex: 3, rotate: -10 }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
          >
            <div style={{ width: '280px', height: '280px', background: '#1e293b', borderRadius: '32px', overflow: 'hidden', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }}>
              <img src="/screen4.png" alt="Card 1" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', padding: '2rem', display: 'flex', alignItems: 'flex-end' }}>
                <h3 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 600 }}>Let's activate your new card</h3>
              </div>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#fff' }}>✕</div>
            </div>
          </motion.div>

          <motion.div
            style={{ position: 'absolute', left: '30%', top: '0', zIndex: 2, rotate: -5 }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ delay: 0.1 }}
          >
            <div style={{ width: '260px', height: '300px', background: '#d8b4fe', borderRadius: '32px', padding: '2rem', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0,0,0,0.1)' }}>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#000' }}>✕</div>
              <div style={{ background: '#fff', width: '80px', height: '80px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'auto' }}>
                <div style={{ width: '40px', height: '20px', borderBottom: '6px solid #1e3a8a', borderLeft: '6px solid #1e3a8a', borderRight: '6px solid #1e3a8a', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }} />
              </div>
              <h3 style={{ color: '#000', fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.2 }}>Swipe, Spend,<br />Build Credit</h3>
            </div>
          </motion.div>

          <motion.div
            style={{ position: 'absolute', right: '15%', top: '50px', zIndex: 4, rotate: -15 }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ delay: 0.2 }}
          >
            <div style={{ width: '450px', height: '250px', background: '#3f3f46', borderRadius: '32px', overflow: 'hidden', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}>
              <img src="/screen1.png" alt="Card 3" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
              <div style={{ position: 'absolute', inset: 0, padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', textAlign: 'right' }}>
                <h3 style={{ color: '#fff', fontSize: '2rem', fontWeight: 600, lineHeight: 1.1, marginBottom: '0.5rem' }}>Set up<br />automatic<br />payments</h3>
                <p style={{ color: '#fff', fontSize: '1rem', maxWidth: '200px' }}>Free up time for what truly matters.</p>
              </div>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#fff' }}>✕</div>
            </div>
          </motion.div>

        </div>
      </section>

      <div style={{ width: '80%', height: '1px', background: '#e5e7eb', margin: '4rem auto' }} />

      {/* Build credit securely Section */}
      <section style={{ padding: '4rem 5% 8rem 5%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: '#1e3a8a' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-7 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM17 11V7A5 5 0 0 0 7 7v4h2V7a3 3 0 0 1 6 0v4h2z"></path>
          </svg>
        </div>
        <h2 style={{ fontSize: '4rem', fontWeight: 500, color: '#1e3a8a', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
          Build credit <span style={{ color: '#2563eb' }}>securely</span>
        </h2>
        <p style={{ color: '#6b7280', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
          We safeguard your data with end-to-end encryption and security features designed to protect your privacy.
        </p>
        <button className="btn" style={{ background: '#dbeafe', color: '#1e3a8a', borderRadius: '50px', padding: '1rem 2rem', fontWeight: 600, border: 'none', letterSpacing: '0.05em', fontSize: '0.9rem' }}>
          DOWNLOAD THE APP
        </button>
      </section>

      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '3rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6b7280', background: '#fff' }}>
        <img src="/logo.png" alt="Bey3a" style={{ height: '32px', filter: 'brightness(0) invert(0)', opacity: 0.5 }} />
        <span style={{ fontSize: '0.9rem' }}>© 2026 Bey3a Inc.</span>
      </footer>
    </div>
  );
}

export default App;
