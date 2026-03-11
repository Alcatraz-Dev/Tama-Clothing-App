import { useContext } from 'react'
import { LanguageContext, ThemeContext } from './Layout'

export function Terms() {
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
            Terms of Service
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>
            Please read our terms and conditions carefully.
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="section">
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
              Last updated: March 2024
            </p>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>1. Acceptance of Terms</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                By accessing and using the Bey3a mobile application and website, you accept and agree to be bound by the terms and provision of this agreement. Additionally, when using Bey3a's services, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>2. Description of Service</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--spacing-md)' }}>
                Bey3a provides users with access to a rich collection of resources, including various communications tools, forums, shopping services, personalized content, and branded programming through its network of properties. You also understand and agree that the service may include advertisements and that these advertisements are necessary for Bey3a to provide the service.
              </p>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>3. Registration Obligations</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--spacing-md)' }}>
                In consideration of your use of the Service, you agree to: (a) provide true, accurate, current, and complete information about yourself as prompted by the Service's registration form and (b) maintain and promptly update the registration data to keep it true, accurate, current, and complete.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                If you provide any information that is untrue, inaccurate, not current, or incomplete, or Bey3a has reasonable grounds to suspect that such information is untrue, inaccurate, not current, or incomplete, Bey3a has the right to suspend or terminate your account and refuse any and all current or future use of the Service.
              </p>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>4. Privacy Policy</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                Registration data and certain other information about you is subject to our Privacy Policy. You understand that through your use of the Service, you consent to the collection and use of this information, including the transfer of this information to other countries for storage, processing, and use.
              </p>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>5. User Conduct</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--spacing-md)' }}>
                You agree not to use the Service to:
              </p>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 'var(--spacing-lg)' }}>
                <li>Upload, post, email, transmit, or otherwise make available any content that is unlawful, harmful, threatening, abusive, harassing, tortious, defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically, or otherwise objectionable</li>
                <li>Harm minors in any way</li>
                <li>Forge headers or otherwise manipulate identifiers in order to disguise the origin of any content transmitted through the Service</li>
                <li>Upload, post, email, transmit, or otherwise make available any content that you do not have a right to make available under any law or under contractual or fiduciary relationships</li>
                <li>Upload, post, email, transmit, or otherwise make available any content that infringes any patent, trademark, trade secret, copyright, or other proprietary rights of any party</li>
              </ul>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>6. Shopping and Orders</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--spacing-md)' }}>
                When you place an order through Bey3a, you are making an offer to purchase products. All orders are subject to acceptance by Bey3a. We reserve the right to refuse or cancel any order for any reason, including but not limited to: product availability, pricing errors, or problems identified by our credit and fraud avoidance department.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                Prices for products are quoted on our website and are subject to change without notice. We reserve the right to modify prices at any time. All purchases are subject to our shipping and returns policies as stated on our website.
              </p>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>7. Limitation of Liability</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                In no event shall Bey3a be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from: (i) your access to or use of or inability to access or use the service; (ii) any conduct or content of any third party on the service.
              </p>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>8. Changes to Terms</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                Bey3a reserves the right, at its sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after any modifications become effective, you agree to be bound by the modified terms.
              </p>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>9. Contact Us</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                If you have any questions about these Terms, please contact us at support@bey3a.tn.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
