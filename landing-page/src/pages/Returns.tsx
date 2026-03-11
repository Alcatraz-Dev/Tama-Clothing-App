import { useContext } from 'react'
import { LanguageContext, ThemeContext } from './Layout'
import { RefreshCw, Package, Clock, CheckCircle, AlertCircle, DollarSign, Mail } from 'lucide-react'

const RETURN_PROCESS = [
  { step: 1, title: 'Initiate Return', description: 'Log into your account and go to Orders' },
  { step: 2, title: 'Print Label', description: 'We\'ll email you a return shipping label' },
  { step: 3, title: 'Ship Item', description: 'Drop off the package at any pickup point' },
  { step: 4, title: 'Get Refund', description: 'Receive your refund within 5-7 business days' }
]

const RETURN_CONDITIONS = [
  {
    icon: CheckCircle,
    title: 'Eligible for Return',
    items: [
      'Items in original condition with tags attached',
      'Unworn and unused items',
      'Items in original packaging',
      'Returns initiated within 30 days of delivery'
    ]
  },
  {
    icon: AlertCircle,
    title: 'Not Eligible for Return',
    items: [
      'Intimate apparel and swimwear',
      'Beauty and personal care products',
      'Items marked as final sale',
      'Items damaged due to misuse'
    ]
  }
]

export function Returns() {
  const { isRTL } = useContext(LanguageContext)!
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
            Returns & Refunds
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>
            Easy returns for a worry-free shopping experience
          </p>
        </div>
      </section>

      {/* Return Policy */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Return Policy</h2>
            <p className="section-subtitle">
              We want you to love your purchase. If you're not completely satisfied, we make it easy to return.
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-2xl)'
          }}>
            <div style={{
              padding: 'var(--spacing-lg)',
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'center'
            }}>
              <Clock size={32} color="var(--accent-color)" style={{ marginBottom: 'var(--spacing-sm)' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>30</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Days Return</div>
            </div>
            <div style={{
              padding: 'var(--spacing-lg)',
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'center'
            }}>
              <Package size={32} color="var(--accent-color)" style={{ marginBottom: 'var(--spacing-sm)' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>Free</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Return Shipping</div>
            </div>
            <div style={{
              padding: 'var(--spacing-lg)',
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'center'
            }}>
              <RefreshCw size={32} color="var(--accent-color)" style={{ marginBottom: 'var(--spacing-sm)' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>Easy</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Process</div>
            </div>
            <div style={{
              padding: 'var(--spacing-lg)',
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-sm)',
              textAlign: 'center'
            }}>
              <DollarSign size={32} color="var(--accent-color)" style={{ marginBottom: 'var(--spacing-sm)' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>5-7</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Days Refund</div>
            </div>
          </div>
        </div>
      </section>

      {/* Return Process */}
      <section className="section" style={{ backgroundColor: 'var(--section-bg)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How to Return</h2>
            <p className="section-subtitle">
              Follow these simple steps to return your item
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--spacing-lg)'
          }}>
            {RETURN_PROCESS.map((process, index) => (
              <div
                key={index}
                style={{
                  padding: 'var(--spacing-xl)',
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--accent-color)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  marginBottom: 'var(--spacing-md)'
                }}>
                  {process.step}
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>{process.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                  {process.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Return Conditions */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Return Conditions</h2>
            <p className="section-subtitle">
              Please review our return policy guidelines
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'var(--spacing-xl)'
          }}>
            {RETURN_CONDITIONS.map((condition, index) => (
              <div
                key={index}
                style={{
                  padding: 'var(--spacing-xl)',
                  backgroundColor: index === 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--radius-xl)',
                  border: `2px solid ${index === 0 ? '#22c55e' : '#ef4444'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                  <condition.icon size={24} color={index === 0 ? '#22c55e' : '#ef4444'} />
                  <h3 style={{ fontWeight: 600 }}>{condition.title}</h3>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {condition.items.map((item, i) => (
                    <li key={i} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <span style={{ color: index === 0 ? '#22c55e' : '#ef4444' }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Refund Info */}
      <section className="section" style={{ backgroundColor: 'var(--section-alt-bg)' }}>
        <div className="container">
          <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Refund Information</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', lineHeight: 1.7 }}>
              Refunds are processed within 5-7 business days after we receive your returned item. 
              The refund will be credited to your original payment method. 
              You'll receive an email confirmation once your refund has been processed.
            </p>
            <div style={{
              padding: 'var(--spacing-lg)',
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Questions about your return?</p>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                Contact our support team for assistance
              </p>
              <a
                href="mailto:support@bey3a.tn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--accent-color)',
                  color: 'white',
                  borderRadius: 'var(--radius-lg)',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                <Mail size={18} />
                Email Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
