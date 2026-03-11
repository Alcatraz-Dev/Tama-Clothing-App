import { useContext } from 'react'
import { LanguageContext, ThemeContext, APP_NAME } from './Layout'
import { Award, Users, TrendingUp, Heart, MapPin, Mail, Phone, Star } from 'lucide-react'

const STATS = [
  { value: '50K+', label: 'Active Users', icon: Users },
  { value: '100K+', label: 'Orders Delivered', icon: TrendingUp },
  { value: '500+', label: 'Partner Brands', icon: Award },
  { value: '4.9', label: 'App Store Rating', icon: Star },
]

const TEAM = [
  { name: 'Ahmed Ben Ali', role: 'CEO & Founder', image: '👨‍💼' },
  { name: 'Sara Khelifi', role: 'Head of Design', image: '👩‍💼' },
  { name: 'Mohamed Trabelsi', role: 'Head of Operations', image: '👨‍💼' },
  { name: 'Leila Mseddi', role: 'Head of Marketing', image: '👩‍💼' },
]

export function About() {
  const { isDark } = useContext(ThemeContext)!

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Banner */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary-color) 0%, #2a2a2a 100%)',
        padding: '120px 0 80px',
        color: 'white'
      }}>
        <div className="container">
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: 'var(--spacing-md)' }}>
            About Us
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9, maxWidth: '600px' }}>
            We're on a mission to revolutionize fashion retail in Tunisia and beyond
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="section">
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--spacing-3xl)',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Our Story</h2>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.8, marginBottom: 'var(--spacing-md)' }}>
                Founded in 2023, Bey3a was born from a simple idea: make fashion accessible, enjoyable, and engaging for everyone in Tunisia. 
              </p>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.8, marginBottom: 'var(--spacing-md)' }}>
                We combine cutting-edge technology with local fashion expertise to bring you the ultimate shopping experience. From personalized recommendations to exclusive deals, we've got you covered.
              </p>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.8 }}>
                Our team is passionate about fashion and committed to providing the best service possible. Join us on this exciting journey!
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--spacing-md)'
            }}>
              <div style={{
                backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--spacing-xl)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '3rem' }}>👗</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>10K+</div>
                <div style={{ color: 'var(--text-secondary)' }}>Products</div>
              </div>
              <div style={{
                backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--spacing-xl)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '3rem' }}>📦</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>100K+</div>
                <div style={{ color: 'var(--text-secondary)' }}>Orders</div>
              </div>
              <div style={{
                backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--spacing-xl)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '3rem' }}>⭐</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>4.9</div>
                <div style={{ color: 'var(--text-secondary)' }}>Rating</div>
              </div>
              <div style={{
                backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--spacing-xl)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '3rem' }}>🎯</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>50K+</div>
                <div style={{ color: 'var(--text-secondary)' }}>Users</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section" style={{ backgroundColor: 'var(--section-bg)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--spacing-xl)'
          }}>
            <div style={{
              padding: 'var(--spacing-xl)',
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--spacing-md)'
              }}>
                <TrendingUp size={32} color="var(--accent-color)" />
              </div>
              <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Our Mission</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                To revolutionize fashion retail in Tunisia by combining innovative technology with personalized service, making high-quality fashion accessible to everyone.
              </p>
            </div>
            <div style={{
              padding: 'var(--spacing-xl)',
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--spacing-md)'
              }}>
                <Heart size={32} color="var(--accent-color)" />
              </div>
              <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Our Vision</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                To become the leading fashion platform in North Africa, empowering local designers and connecting them with fashion-forward customers worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Meet Our Team</h2>
            <p className="section-subtitle">
              The passionate people behind Bey3a
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--spacing-xl)'
          }}>
            {TEAM.map((member, index) => (
              <div
                key={index}
                style={{
                  padding: 'var(--spacing-xl)',
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-sm)',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  margin: '0 auto var(--spacing-md)'
                }}>
                  {member.image}
                </div>
                <h3 style={{ marginBottom: '0.25rem' }}>{member.name}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="section" style={{ backgroundColor: 'var(--section-alt-bg)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Get in Touch</h2>
            <p className="section-subtitle">
              We'd love to hear from you
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--spacing-xl)'
          }}>
            <div style={{
              padding: 'var(--spacing-xl)',
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'center'
            }}>
              <MapPin size={32} color="var(--accent-color)" style={{ marginBottom: 'var(--spacing-md)' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Visit Us</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Avenue Habib Bourguiba<br />
                Tunis, Tunisia 1000
              </p>
            </div>
            <div style={{
              padding: 'var(--spacing-xl)',
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'center'
            }}>
              <Mail size={32} color="var(--accent-color)" style={{ marginBottom: 'var(--spacing-md)' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Email Us</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                hello@bey3a.tn<br />
                support@bey3a.tn
              </p>
            </div>
            <div style={{
              padding: 'var(--spacing-xl)',
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'center'
            }}>
              <Phone size={32} color="var(--accent-color)" style={{ marginBottom: 'var(--spacing-md)' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Call Us</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                +216 70 000 000<br />
                Mon - Fri: 9AM - 6PM
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
