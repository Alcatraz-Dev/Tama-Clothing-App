import { useContext } from 'react'
import { LanguageContext, ThemeContext } from './Layout'
import { 
  ShoppingBag, 
  Smartphone, 
  Zap, 
  Star, 
  Users, 
  Truck, 
  Shield, 
  Headphones,
  ArrowRight,
  Check,
  Mail,
  MapPin,
  MessageCircle,
  Play
} from 'lucide-react'

export function Home() {
  const { t, isRTL, language } = useContext(LanguageContext)!

  return (
    <div className={`page-wrapper ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Hero Section - Refined for Premium Showcase */}
      <section className="hero-premium">
        <div className="container">
          <div className="hero-content-premium">
            <div className={`hero-text animate-fade-in ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="hero-badge animate-float">
                <span className="badge-dot"></span>
                {t('hero.badge')}
              </div>
              
              <h1 className="hero-title">
                {t('hero.title')} <br />
                <span className="text-gradient-premium">{t('hero.titleAccent')}</span>
              </h1>
              
              <p className="hero-description">
                {t('hero.desc')}
              </p>
              
              <div className="hero-actions">
                <a href="#download" className="btn btn-premium">
                  <Smartphone size={20} />
                  <span>{t('nav.download')}</span>
                </a>
                <a href="#features" className="btn btn-glass">
                  <span>{t('nav.features')}</span>
                </a>
              </div>

              <div className="hero-stats">
                <div className="stat-item">
                  <div className="stat-value">120K+</div>
                  <div className="stat-label">{t('stats.users')}</div>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <div className="stat-value">4.9/5</div>
                  <div className="stat-label">{t('stats.rating')}</div>
                </div>
              </div>
            </div>

            <div className="hero-visual animate-up">
              <div className="mockup-container">
                <div className="mockup-bg-glow"></div>
                <div className="iphone-wrapper">
                  <div className="iphone-inner">
                    <img src="/hero-mockup.png" alt="Bey3a App Hero" className="app-mockup-main" />
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="floating-card card-1 animate-float">
                  <Zap size={18} className="text-accent" />
                  <span>Flash Drops Live</span>
                </div>
                <div className="floating-card card-2 animate-float" style={{ animationDelay: '1s' }}>
                  <Star size={18} className="text-warning" />
                  <span>#1 Fashion App</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Sections - Match Figma Template */}
      <section id="features" className="section-premium bg-soft">
        <div className="container">
          <div className="section-header-premium">
            <h2 className="section-title-premium">{t('features.title')}</h2>
            <p className="section-subtitle-premium">{t('features.subtitle')}</p>
          </div>

          {/* Showcase 1: Personalization / Baby Gear */}
          <div className="showcase-grid animate-up">
            <div className={`showcase-content ${isRTL ? 'order-2' : ''}`}>
              <div className="feature-tag">PERSONALIZED</div>
              <h3 className="showcase-title">{t('features.live')}</h3>
              <p className="showcase-description">{t('features.liveDesc')}</p>
              <div className="feature-card-premium" style={{ border: 'none', padding: '1.5rem 0' }}>
                <ul className="showcase-list">
                  <li><Check size={18} /> {t('live.p1')}</li>
                  <li><Check size={18} /> {t('live.p2')}</li>
                  <li><Check size={18} /> {t('live.p3')}</li>
                </ul>
              </div>
            </div>
            <div className={`showcase-visual ${isRTL ? 'order-1' : ''} glass-card`}>
               <div className="glow-effect"></div>
               <img src="/live-shopping.png" alt="Live Shopping" className="showcase-mockup" />
            </div>
          </div>

          {/* Showcase 2: Process / Rental Flow */}
          <div className="showcase-grid reverse mt-xl animate-up">
             <div className="showcase-visual glass-card">
                <div className="glow-effect variant-2"></div>
                <img src="/treasure-hunt.png" alt="Treasure Hunt" className="showcase-mockup" />
             </div>
             <div className="showcase-content">
                <div className="feature-tag tag-warning">GAMIFIED</div>
                <h3 className="showcase-title">{t('features.treasure')}</h3>
                <p className="showcase-description">
                  {t('features.treasureDesc')}
                </p>
                <div className="feature-card-premium" style={{ border: 'none', padding: '1.5rem 0' }}>
                  <ul className="showcase-list">
                    <li><Check size={18} /> {t('treasure.p1')}</li>
                    <li><Check size={18} /> {t('treasure.p2')}</li>
                    <li><Check size={18} /> {t('treasure.p3')}</li>
                  </ul>
                </div>
                <div className="flex gap-md mt-lg">
                   <button className="btn btn-premium">{t('shop.discover')}</button>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-premium">
        <div className="container">
          <div className="testimonial-card-premium">
             <div className="author-avatar" style={{ marginBottom: '1.5rem' }}>A</div>
             <p className="testimonial-content">
                {t('testimonial.content1')}
             </p>
             <div className="testimonial-author">
                <div className="author-info">
                   <div className="author-name">Anis Jbali</div>
                   <div className="author-role">{t('testimonial.verified')}</div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="download-cta-section">
        <div className="container">
          <div className="download-card-premium">
            <div className="download-content">
              <h2 className="download-title">{t('download.title')}</h2>
              <p className="download-text">{t('download.desc')}</p>
              
              <div className="store-buttons">
                <a href="#" className="store-btn">
                  <div className="store-icon">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/67/App_Store_%28iOS%29.svg" alt="App Store" width="24" height="24" />
                  </div>
                  <div className="store-text">
                    <span className="store-small">{t('download.appStoreSmall')}</span>
                    <span className="store-large">{t('download.appStoreLarge')}</span>
                  </div>
                </a>
                
                <a href="#" className="store-btn">
                  <div className="store-icon">
                    <Play size={24} fill="white" />
                  </div>
                  <div className="store-text">
                    <span className="store-small">{t('download.googlePlaySmall')}</span>
                    <span className="store-large">{t('download.googlePlayLarge')}</span>
                  </div>
                </a>
              </div>
            </div>
            
            <div className="download-visual">
              <img src="/logo.png" alt="Bey3a Logo" className="floating-phone" style={{ opacity: 0.15 }} />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="section-premium pb-0">
        <div className="container">
          <div className="contact-grid-premium">
            <div className="contact-info-card">
              <div className="contact-icon"><MessageCircle size={28} /></div>
              <h3>{t('contact.chat')}</h3>
              <p>{t('contact.chatDesc')}</p>
            </div>
            <div className="contact-info-card">
              <div className="contact-icon"><Mail size={28} /></div>
              <h3>{t('contact.email')}</h3>
              <p>support@bey3a.tn</p>
            </div>
            <div className="contact-info-card">
              <div className="contact-icon"><MapPin size={28} /></div>
              <h3>{t('contact.location')}</h3>
              <p>Lac 2, Tunis, Tunisia</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
