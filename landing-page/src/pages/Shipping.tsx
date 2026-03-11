import { useContext } from 'react'
import { LanguageContext, ThemeContext } from './Layout'
import { Truck, Package, Clock, MapPin, CheckCircle, DollarSign, Globe } from 'lucide-react'

const SHIPPING_OPTIONS = [
  {
    name: 'Standard Delivery',
    price: 'Free',
    duration: '2-4 Business Days',
    description: 'Free shipping on orders over 200 TND',
    icon: Truck
  },
  {
    name: 'Express Delivery',
    price: '15 TND',
    duration: '1-2 Business Days',
    description: 'Fast delivery for urgent orders',
    icon: Package
  },
  {
    name: 'Next Day Delivery',
    price: '25 TND',
    duration: 'Next Business Day',
    description: 'Order before 2PM for next day delivery',
    icon: Clock
  }
]

const DELIVERY_AREAS = [
  { area: 'Greater Tunis', time: '1-2 Business Days' },
  { area: 'Sfax', time: '2-3 Business Days' },
  { area: 'Sousse', time: '2-3 Business Days' },
  { area: 'Kairouan', time: '3-4 Business Days' },
  { area: 'Gabès', time: '3-4 Business Days' },
  { area: 'Other Regions', time: '4-7 Business Days' }
]

export function Shipping() {
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
            Shipping Information
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>
            Everything you need to know about delivery
          </p>
        </div>
      </section>

      {/* Shipping Options */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Delivery Options</h2>
            <p className="section-subtitle">
              Choose the delivery option that works best for you
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--spacing-xl)'
          }}>
            {SHIPPING_OPTIONS.map((option, index) => (
              <div
                key={index}
                style={{
                  padding: 'var(--spacing-xl)',
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-sm)',
                  border: index === 0 ? '2px solid var(--accent-color)' : 'none'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--spacing-md)'
                }}>
                  <option.icon size={28} color="var(--accent-color)" />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontWeight: 600 }}>{option.name}</h3>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-color)' }}>
                    {option.price}
                  </span>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
                  {option.duration}
                </p>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {option.description}
                </p>
                
                {index === 0 && (
                  <div style={{
                    marginTop: 'var(--spacing-md)',
                    padding: '0.5rem',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    color: 'var(--accent-color)',
                    fontWeight: 500,
                    textAlign: 'center'
                  }}>
                    Recommended
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Times */}
      <section className="section" style={{ backgroundColor: 'var(--section-bg)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Delivery Times by Region</h2>
            <p className="section-subtitle">
              Estimated delivery times for different areas
            </p>
          </div>
          
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {DELIVERY_AREAS.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--spacing-md) var(--spacing-lg)',
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: index === 0 ? 'var(--radius-xl) var(--radius-xl) 0 0' : 
                                 index === DELIVERY_AREAS.length - 1 ? '0 0 var(--radius-xl) var(--radius-xl)' : '0',
                  borderBottom: index < DELIVERY_AREAS.length - 1 ? '1px solid var(--border-color)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <MapPin size={18} color="var(--accent-color)" />
                  <span style={{ fontWeight: 500 }}>{item.area}</span>
                </div>
                <span style={{ color: 'var(--text-secondary)' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shipping Info */}
      <section className="section">
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
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--spacing-md)'
              }}>
                <CheckCircle size={24} color="var(--accent-color)" />
              </div>
              <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Order Tracking</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Track your order in real-time through your account. You'll receive SMS and email updates at every stage of delivery.
              </p>
            </div>
            
            <div style={{
              padding: 'var(--spacing-xl)',
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
                marginBottom: 'var(--spacing-md)'
              }}>
                <Globe size={24} color="var(--accent-color)" />
              </div>
              <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>International Shipping</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                We currently ship to select North African countries. Contact our support team for more information about international delivery.
              </p>
            </div>
            
            <div style={{
              padding: 'var(--spacing-xl)',
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
                marginBottom: 'var(--spacing-md)'
              }}>
                <Package size={24} color="var(--accent-color)" />
              </div>
              <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Packaging</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                All orders are carefully packaged to ensure your items arrive in perfect condition. Eco-friendly packaging options are available.
              </p>
            </div>
            
            <div style={{
              padding: 'var(--spacing-xl)',
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
                marginBottom: 'var(--spacing-md)'
              }}>
                <DollarSign size={24} color="var(--accent-color)" />
              </div>
              <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Cash on Delivery</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Pay for your order when it arrives at your doorstep. Cash on delivery is available for all orders within Tunisia.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
