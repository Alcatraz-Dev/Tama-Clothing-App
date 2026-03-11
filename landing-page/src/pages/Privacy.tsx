import { useContext } from 'react'
import { LanguageContext, ThemeContext } from './Layout'
import { Shield, Lock, Eye, User, Mail, Phone, Globe } from 'lucide-react'

export function Privacy() {
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
            Privacy Policy
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>
            Your privacy is important to us. Learn how we protect your data.
          </p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="section">
        <div className="container">
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
              Last updated: March 2024
            </p>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>1. Introduction</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                At Bey3a, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
              </p>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>2. Information We Collect</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--spacing-md)' }}>
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 'var(--spacing-lg)' }}>
                <li>Register on the Website or App</li>
                <li>Express an interest in obtaining information about us or our products and services</li>
                <li>Participate in activities on the Website or App</li>
                <li>Contact us</li>
              </ul>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginTop: 'var(--spacing-md)' }}>
                The personal information that we collect depends on the context of your interactions with us and the Website or App, the choices you make, and the products and features you use. The personal information we collect may include the following:
              </p>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 'var(--spacing-lg)' }}>
                <li>Personal Identity Information (name, phone number, email)</li>
                <li>Payment information (credit card details, billing address)</li>
                <li>Shopping history and preferences</li>
                <li>Device and usage information</li>
              </ul>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>3. How We Use Your Information</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--spacing-md)' }}>
                We use personal information collected via our Website or App for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
              </p>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 'var(--spacing-lg)' }}>
                <li>To facilitate account creation and logon process</li>
                <li>To send administrative information to you</li>
                <li>To fulfill and manage your orders</li>
                <li>To post testimonials</li>
                <li>To request feedback</li>
                <li>To protect our Services</li>
              </ul>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>4. Sharing Your Information</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                We only share information with the following third parties categories: Data Storage Services, Payment Processors, Order Fulfillment Services, and Marketing & Advertising Services. We may also share your information in the following situations: to comply with applicable laws, to respond to lawful requests, or to protect our rights.
              </p>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>5. Data Security</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information.
              </p>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>6. Your Rights</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                You have the right to access, update, or delete the personal information we have about you. You may also have the right to object to processing of your personal information, or to request restriction of processing your personal information. To exercise any of these rights, please contact us.
              </p>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h2 style={{ marginBottom: 'var(--spacing-md)' }}>7. Contact Us</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                If you have questions or comments about this policy, you may email us at support@bey3a.tn.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
