import { useContext, useState } from 'react'
import { LanguageContext, ThemeContext } from './Layout'
import { Mail, Phone, MapPin, MessageCircle, Send, Instagram, Facebook, Twitter } from 'lucide-react'

export function Contact() {
  const { isRTL } = useContext(LanguageContext)!
  const { isDark } = useContext(ThemeContext)!
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

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
            Contact Us
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>
            We're here to help! Get in touch with our team
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="section">
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--spacing-3xl)'
          }}>
            {/* Contact Form */}
            <div>
              <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Send us a Message</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                Fill out the form below and we'll get back to you as soon as possible.
              </p>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--card-bg)',
                        fontSize: '1rem'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--card-bg)',
                        fontSize: '1rem'
                      }}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--card-bg)',
                      fontSize: '1rem'
                    }}
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="order">Order Issue</option>
                    <option value="product">Product Question</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--card-bg)',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1rem 2rem',
                    borderRadius: 'var(--radius-lg)',
                    border: 'none',
                    backgroundColor: 'var(--accent-color)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  <Send size={20} />
                  Send Message
                </button>
              </form>
            </div>
            
            {/* Contact Info */}
            <div>
              <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Contact Information</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                Prefer to reach out directly? Here's how you can contact us.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--spacing-md)',
                  padding: 'var(--spacing-lg)',
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <MapPin size={24} color="var(--accent-color)" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Visit Us</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Avenue Habib Bourguiba<br />
                      Tunis, Tunisia 1000
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--spacing-md)',
                  padding: 'var(--spacing-lg)',
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Mail size={24} color="var(--accent-color)" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Email Us</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      hello@bey3a.tn<br />
                      support@bey3a.tn
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--spacing-md)',
                  padding: 'var(--spacing-lg)',
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Phone size={24} color="var(--accent-color)" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Call Us</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      +216 70 000 000<br />
                      Mon - Fri: 9AM - 6PM
                    </p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--spacing-md)',
                  padding: 'var(--spacing-lg)',
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <MessageCircle size={24} color="var(--accent-color)" />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Live Chat</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Available 24/7<br />
                      Click to start chatting
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Social Links */}
              <div style={{ marginTop: 'var(--spacing-xl)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Follow Us</h3>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <a href="#" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--card-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <Instagram size={24} />
                  </a>
                  <a href="#" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--card-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <Facebook size={24} />
                  </a>
                  <a href="#" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--card-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <Twitter size={24} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
