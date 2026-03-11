import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import { 
  Sun, 
  Moon, 
  Globe, 
  ChevronDown,
  Twitter as XIcon,
  Instagram,
  Facebook
} from 'lucide-react'

// Types
export type Language = 'en' | 'fr' | 'ar' | 'darija' | 'es'

interface Translations {
  [key: string]: {
    [lang in Language]?: string
  }
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isRTL: boolean
}

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// App Data
// App Data
const APP_NAME = 'Bey3a'

// Translations
const translations: Translations = {
  // Navigation
  'nav.features': { en: 'Features', fr: 'Fonctionnalités', ar: 'المميزات', darija: 'الميزات', es: 'Funciones' },
  'nav.app': { en: 'The App', fr: 'L\'Application', ar: 'التطبيق', darija: 'الأبليكاسيون', es: 'La App' },
  'nav.contact': { en: 'Contact', fr: 'Contact', ar: 'اتصل بنا', darija: 'اتصل بينا', es: 'Contacto' },
  'nav.download': { en: 'Get Bey3a', fr: 'Obtenir Bey3a', ar: 'تحميل بيعة', darija: 'شارجي بيعة', es: 'Descargar' },
  'nav.collabs': { en: 'Collabs', fr: 'Collabs', ar: 'تعاونات', darija: 'كولابس', es: 'Colaboraciones' },
  'nav.feed': { en: 'Feed', fr: 'Fil', ar: 'التغذية', darija: 'الفيل', es: 'Feed' },
  'nav.shop': { en: 'Shop', fr: 'Boutique', ar: 'المتجر', darija: 'الحانوت', es: 'Tienda' },
  
  // Hero
  'hero.badge': { en: '#1 Fashion Social App', fr: 'L\'app mode sociale N°1', ar: 'تطبيق الموضة والارتباط الاجتماعي الأول', darija: 'أحسن أبليكاسيون مود وسوشيال', es: '#1 App de Moda' },
  'hero.title': { en: 'The Future of', fr: 'L\'Avenir de la', ar: 'مستقبل', darija: 'مستقبل الـ', es: 'El Futuro de' },
  'hero.titleAccent': { en: 'Bey3a is Here.', fr: 'Bey3a est Ici.', ar: 'بيعة هنا.', darija: 'بيعة هنا.', es: 'Bey3a.' },
  'hero.desc': { en: 'Experience the ultimate social shopping destination. Collabs, exclusive drops, and instant delivery.', fr: 'Découvrez la destination de shopping social ultime. Collabs, drops exclusifs et livraison immédiate.', ar: 'اكتشف وجهة التسوق الاجتماعي النهائية. تعاونات، قطع حصرية، وتوصيل فوري.', darija: 'اكتشف أحسن بلاصة تبيّع الحوايج والسوشيال ميديا. كولابس، قطايع حصرية، وتوصيل فيسع.', es: 'Vive la experiencia de compra social definitiva.' },
  
  // Collabs
  'collabs.title': { en: 'Bey3a Collabs', fr: 'Bey3a Collabs', ar: 'بيعة للتعاونات', darija: 'بيعة كولابس', es: 'Bey3a Colabs' },
  'collabs.desc': { en: 'Explore unique collections and exclusive launches from our collaborators.', fr: 'Explorez des collections uniques et des lancements exclusifs de nos collaborateurs.', ar: 'استكشف مجموعات فريدة وإصدارات حصرية من شركائنا.', darija: 'اكتشف كوليكشنات هبال وقطايع حصرية من الجماعة اللي معاهم.', es: 'Explora colecciones únicas.' },
  'collabs.btn': { en: 'Become a Partner', fr: 'Devenir partenaire', ar: 'كن شريكاً', darija: 'ولي بارتنار', es: 'Hazte socio' },

  // Feed/Social
  'feed.title': { en: 'The Social Feed', fr: 'Le Fil Social', ar: 'التغذية الاجتماعية', darija: 'ديما الجديد', es: 'Feed Social' },
  'feed.desc': { en: 'Shop directly from the feed. React with ❤️ or 🔥 and see what is trending.', fr: 'Achetez directement depuis le fil. Réagissez avec ❤️ ou 🔥 et voyez ce qui est tendance.', ar: 'تسوق مباشرة من التغذية. تفاعل بـ ❤️ أو 🔥 وشاهد الصيحات الجديدة.', darija: 'اشري ديريكت من الفيل. ابعث ❤️ وإلا 🔥 وشوف شنوة اللي طالع ترند.', es: 'Compra desde el feed.' },
  'feed.reactions': { en: 'Express, Reaction, Trending', fr: 'Expression, Réaction, Tendance', ar: 'تعبير، تفاعل، صرعات', darija: 'عبر، تفاعل، وتصدر', es: 'Expresa, Reacciona, Tendencia' },

  // Shop
  'shop.title': { en: 'The Full Shop', fr: 'La Boutique', ar: 'المتجر الكامل', darija: 'الحانوت الرسمي', es: 'La Tienda' },
  'shop.categories': { en: 'All, Women, Men, Kids', fr: 'Tout, Femmes, Homme, Enfant', ar: 'الكل، نساء، رجال، أطفال', darija: 'الكل، نساء، رجال، صغار', es: 'Todo, Mujeres, Hombres, Niños' },
  'shop.discover': { en: 'Discover', fr: 'Découvrir', ar: 'اكتشف', darija: 'أعمل طلة', es: 'Descubrir' },

  // Features Showcase
  'features.title': { en: 'Revolutionary Features', fr: 'Fonctions Révolutionnaires', ar: 'ميزات ثورية', darija: 'حاجات طيارة', es: 'Funciones Revolucionarias' },
  'features.live': { en: 'Live Shopping', fr: 'Shopping en Direct', ar: 'تسوق مباشر', darija: 'لايف شوبينق', es: 'Venta en Vivo' },
  'features.liveDesc': { en: 'Interact with influencers and shop your favorite looks in real-time.', fr: 'Interagissez avec des influenceurs et achetez vos looks préférés en direct.', ar: 'تفاعل مع المؤثرين وتسوق إطلالاتك المفضلة مباشرة.', darija: 'تفاعل مع الأنفليونسرز واشري حوايجك في المباشر.', es: 'Compra en vivo.' },
  'features.treasure': { en: 'Treasure Hunt', fr: 'Chasse au Trésor', ar: 'صيد الكنز', darija: 'قنص الكنوز', es: 'Búsqueda del Tesoro' },
  'features.treasureDesc': { en: 'Discover hidden gems and win exclusive discount vouchers every day.', fr: 'Découvrez des pépites cachées et gagnez des bons de réduction exclusifs.', ar: 'اكتشف قطعاً فريدة واربح قسائم خصم حصرية يومياً.', darija: 'لوّج على قطايع طيارة واربح بوات قوية كل يوم.', es: 'Descubre tesoros.' },
  'features.flash': { en: 'Flash Drops', fr: 'Drops Flash', ar: 'تخفيضات سريعة', darija: 'تخفيضات طيارة', es: 'Drops Flash' },
  'features.flashDesc': { en: 'Limited edition releases and time-sensitive deals you can\'t miss.', fr: 'Éditions limitées et offres à durée restreinte à ne pas manquer.', ar: 'إصدارات محدودة وعروض لا يمكن تفويتها لفترة وجيزة.', darija: 'قطايع ليميتد وبروموات قوية ما تفلتهاش.', es: 'Ofertas flash.' },
  
  // App Showcase
  'app.title': { en: 'Designed for the Bold.', fr: 'Conçu pour les Audacieux.', ar: 'مصمم للجريئين.', darija: 'مخدوم للي يعشق المود.', es: 'Diseñado para Valientes.' },
  'app.desc': { en: 'Our app brings the runway directly to your pocket. Fast, secure, and purely Tunisian.', fr: 'Notre application apporte le défilé directement dans votre poche. Rapide et sécurisé.', ar: 'تطبيقنا يجلب منصة العرض إلى جيبك مباشرة. سريع، آمن، وتونسي بامتياز.', darija: 'الأبليكاسيون تجيبلك المود بين يديك. خفيفة، آمنة وتونسية 100%.', es: 'La pasarela en tu bolsillo.' },
  
  // Download Section
  'download.title': { en: 'Join the Bey3a Movement', fr: 'Rejoignez le Mouvement Bey3a', ar: 'انضم إلى حركة بيعة', darija: 'ادخل لعالم بيعة', es: 'Únete a Bey3a' },
  'download.desc': { en: 'Download now and get 20% off your first order.', fr: 'Téléchargez maintenant et obtenez 20% de réduction sur votre première commande.', ar: 'حمل التطبيق الآن واحصل على خصم 20% على طلبك الأول.', darija: 'شارجي الأبليكوسيون وافرح بـ 20% ريميز في أول قضية.', es: '20% en tu primera compra.' },
  
  // Footer
  'footer.rights': { en: 'All rights reserved.', fr: 'Tous droits réservés.', ar: 'جميع الحقوق محفوظة.', darija: 'كل الحقوق محفوظة.', es: 'Todos los derechos reservados.' },
  
  // Testimonials
  'testimonial.role1': { en: 'Fashion Blogger', fr: 'Blogueuse Mode', ar: 'مدونة موضة', darija: 'بلوقر مود', es: 'Blogger de Moda' },
  'testimonial.role2': { en: 'Frequent Shopper', fr: 'Acheteuse Fidèle', ar: 'متسوقة دائمة', darija: 'كليانة فيدال', es: 'Compradora Frecuente' },
  'testimonial.role3': { en: 'Style Enthusiast', fr: 'Passionnée de Style', ar: 'عاشقة للأناقة', darija: 'عاشقة ستيل', es: 'Entusiasta del Estilo' },
  'testimonial.verified': { en: 'Verified Bey3a User', fr: 'Utilisateur Bey3a Vérifié', ar: 'مستخدم بيعة موثق', darija: 'كليان بيعة فيدال', es: 'Usuario Verificado' },
  'testimonial.content1': { 
    en: 'Bey3a has completely transformed how I shop for modest fashion. The live sessions are so interactive!', 
    fr: 'Bey3a a complètement transformé ma façon d\'acheter de la mode. Les sessions en direct sont tellement interactives !',
    ar: 'لقد غيرت بيعة طريقتي في تسوق الأزياء المحتشمة تماماً. جلسات البث المباشر تفاعلية للغاية!',
    darija: 'بيعة بدلتلي حياتي في الشوبينق. اللايفات متاعهم طيارة علخر !',
    es: 'Bey3a ha transformado mi forma de comprar moda.'
  },
  'testimonial.content2': { 
    en: 'Best app for finding unique Tunisian designer pieces. The delivery is surprisingly fast.', 
    fr: 'Meilleure application pour trouver des pièces de créateurs tunisiens uniques. La livraison est étonnamment rapide.',
    ar: 'أفضل تطبيق للعثور على قطع مصممين تونسيين فريدة. التوصيل سريع بشكل مفاجئ.',
    darija: 'أحسن أبليكاسيون تشري منها قطايع تونسية مزيانة. والتوصيل فيسع يوصلك.',
    es: 'La mejor app para diseño tunecino.'
  },
  'testimonial.content3': { 
    en: 'The treasure hunt feature is addictive! I love winning those exclusive vouchers every morning.', 
    fr: 'La fonction chasse au trésor est addictive ! J\'adore gagner ces bons de réduction exclusifs chaque matin.',
    ar: 'ميزة صيد الكنز مسببة للإدمان! أحب الفوز بقسائم الخصم الحصرية كل صباح.',
    darija: 'لعبة قنص الكنوز هبلتني! كل صباح نربح بوات جدد.',
    es: '¡La búsqueda del tesoro es adictiva!'
  },
  
  // Stats & Other
  'stats.users': { en: 'Active Users', fr: 'Utilisateurs Actifs', ar: 'مستخدم نشط', darija: 'مستخدمين', es: 'Usuarios Activos' },
  'stats.rating': { en: 'App Rating', fr: 'Note de l\'App', ar: 'تقييم التطبيق', darija: 'تقييم طيارة', es: 'Calificación' },
  
  // Showcase Points
  'live.p1': { en: 'Real-time interaction', fr: 'Interaction en temps réel', ar: 'تفاعل فوري', darija: 'تفاعل في المباشر', es: 'Interacción real' },
  'live.p2': { en: 'Exclusive live-only drops', fr: 'Drops exclusifs en direct', ar: 'قطع حصرية في البث', darija: 'قطايع حصرية في اللايف', es: 'Drops exclusivos' },
  'live.p3': { en: 'Secure one-tap checkout', fr: 'Paiement sécurisé en un clic', ar: 'دفع آمن بلمسة واحدة', darija: 'خلاص آمن بضربة وحدة', es: 'Pago seguro' },
  
  'treasure.p1': { en: 'Gamified shopping experience', fr: 'Expérience de shopping ludique', ar: 'تجربة تسوق ممتعة', darija: 'تجربة شوبينق ممتعة', es: 'Experiencia gamificada' },
  'treasure.p2': { en: 'Daily rewards and vouchers', fr: 'Récompenses et bons quotidiens', ar: 'مكافآت وقسائم يومية', darija: 'كادوات وبوات كل يوم', es: 'Premios diarios' },
  'treasure.p3': { en: 'Discover hidden designer collections', fr: 'Découvrez des collections cachées', ar: 'اكتشف مجموعات مخفية', darija: 'اكتشف كوليكشنات مخبية', es: 'Colecciones ocultas' },
  
  // Contact
  'contact.chat': { en: 'Live Chat', fr: 'Chat en Direct', ar: 'دردشة مباشرة', darija: 'دردشة مباشرة', es: 'Chat en Vivo' },
  'contact.chatDesc': { en: 'Available 24/7 in App', fr: 'Disponible 24/7 dans l\'App', ar: 'متوفر 24/7 في التطبيق', darija: 'موجودين 24/7 في الأبليكاسيون', es: 'Disponible 24/7' },
  'contact.email': { en: 'Email Us', fr: 'Nous Contacter par Email', ar: 'راسلنا بريدياً', darija: 'أبعثلنا إيميل', es: 'Correo electrónico' },
  'contact.location': { en: 'Location', fr: 'Emplacement', ar: 'الموقع', darija: 'البلاصة', es: 'Ubicación' },
  'download.appStoreSmall': { en: 'Download on the', fr: 'Télécharger sur l\'', ar: 'حمل من', darija: 'شارجي من', es: 'Descargar en' },
  'download.appStoreLarge': { en: 'App Store', fr: 'App Store', ar: 'آب ستور', darija: 'آب ستور', es: 'App Store' },
  'download.googlePlaySmall': { en: 'Get it on', fr: 'Disponible sur', ar: 'حمل من', darija: 'شارجي من', es: 'Disponible en' },
  'download.googlePlayLarge': { en: 'Google Play', fr: 'Google Play', ar: 'قوقل بلاي', darija: 'قوقل بلاي', es: 'Google Play' },
}

// Navbar Component
export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const { isDark, toggleTheme } = useContext(ThemeContext)!
  const { language, setLanguage, t } = useContext(LanguageContext)!
  const [showLangDropdown, setShowLangDropdown] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'darija', label: 'الداريجة' },
    { code: 'ar', label: 'العربية' }
  ]

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: scrolled ? '0.75rem 0' : '1.5rem 0',
      backgroundColor: isDark ? 'rgba(2, 6, 23, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--glass-border)',
      transition: 'all 0.4s cubic-bezier(0.2, 0, 0.2, 1)'
    }}>
      <div className="container flex items-center justify-between">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>
            {APP_NAME}
          </span>
        </Link>
        
        <div className="flex gap-lg" style={{ alignItems: 'center' }}>
          <div className="flex gap-md" style={{ display: window.innerWidth > 768 ? 'flex' : 'none' }}>
            <Link to="/" style={{ fontWeight: 500, opacity: 0.8 }}>{t('nav.features')}</Link>
            <Link to="/" style={{ fontWeight: 500, opacity: 0.8 }}>{t('nav.app')}</Link>
            <Link to="/contact" style={{ fontWeight: 500, opacity: 0.8 }}>{t('nav.contact')}</Link>
          </div>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }} />
          
          {/* Theme Toggle */}
          <button className="theme-toggle-modern" onClick={toggleTheme}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {/* Language Selector */}
          <div className="language-selector">
            <button className="language-btn" onClick={() => setShowLangDropdown(!showLangDropdown)}>
              <Globe size={18} />
              <span style={{ fontWeight: 600 }}>{language.toUpperCase()}</span>
            </button>
            
            {showLangDropdown && (
              <div className="language-dropdown glass-card" style={{ marginTop: '0.5rem', minWidth: '120px' }}>
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    className={`language-option ${language === lang.code ? 'active' : ''}`}
                    onClick={() => {
                      setLanguage(lang.code)
                      setShowLangDropdown(false)
                    }}
                    style={{ padding: '0.75rem 1rem' }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <Link to="/" className="btn btn-primary" style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}>
            {t('nav.download')}
          </Link>
        </div>
      </div>
    </nav>
  )
}

// Footer Component
export function Footer() {
  const { t } = useContext(LanguageContext)!
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer-premium">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
               <img src="/logo.png" alt="Bey3a Logo" style={{ height: '32px', width: 'auto', borderRadius: '6px' }} />
               <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{APP_NAME}</span>
            </div>
            <p style={{ opacity: 0.6, fontSize: '0.9375rem' }}>
              Redefining fashion for the modern Tunisian generation. Minimalist, bold, and forward-thinking.
            </p>
          </div>
          
          <div>
            <h4 style={{ color: 'white', marginBottom: '1.5rem' }}>Platform</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 0.6 }}>
              <li><Link to="/">Flash Drops</Link></li>
              <li><Link to="/">Live Shopping</Link></li>
              <li><Link to="/">Treasure Hunt</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: 'white', marginBottom: '1.5rem' }}>Company</h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 0.6 }}>
              <li><Link to="/about">Our Story</Link></li>
              <li><Link to="/privacy">Privacy</Link></li>
              <li><Link to="/terms">Terms</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: 'white', marginBottom: '1.5rem' }}>Connect</h4>
            <div className="flex gap-md">
              <a href="#" className="theme-toggle-modern"><Instagram size={20} /></a>
              <a href="#" className="theme-toggle-modern"><Facebook size={20} /></a>
              <a href="#" className="theme-toggle-modern"><XIcon size={20} /></a>
            </div>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', opacity: 0.5, fontSize: '0.875rem' }}>
          <p>© {currentYear} {APP_NAME}. {t('footer.rights')}</p>
          <div className="flex gap-lg">
            <span>Made with ❤️ in Tunis</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Layout Provider
export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('darija')
  const [isDark, setIsDark] = useState(true)
  const isRTL = language === 'ar' || language === 'darija'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    document.documentElement.setAttribute('lang', language)
  }, [isDark, language])

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr')
  }, [isRTL])

  const toggleTheme = () => setIsDark(!isDark)
  const t = (key: string): string => translations[key]?.[language] || translations[key]?.en || key

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  )
}


export { LanguageContext, ThemeContext, APP_NAME }
