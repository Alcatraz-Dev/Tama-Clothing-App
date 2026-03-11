import { useContext, useState } from 'react'
import { LanguageContext, ThemeContext } from './Layout'
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react'

const FAQS = [
  {
    question: 'How do I track my order?',
    answer: 'You can track your order by logging into your Bey3a account and visiting the "Orders" section. You\'ll find real-time updates on your order status and tracking information. You can also track your order using the tracking number sent to your email.'
  },
  {
    question: 'What is your return policy?',
    answer: 'We offer a 30-day return policy for all unused items in their original packaging. Simply initiate a return through your account or contact our support team. Refunds are processed within 5-7 business days after we receive the returned item.'
  },
  {
    question: 'How long does delivery take?',
    answer: 'Standard delivery takes 2-4 business days. Express delivery is available for next-day delivery in major cities. Free shipping is available on orders over 200 TND.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, Amex), cash on delivery, and bank transfers. All payments are secure and encrypted.'
  },
  {
    question: 'How do I contact customer support?',
    answer: 'You can reach our customer support team through live chat (available 24/7), email at support@bey3a.tn, or by phone at +216 70 000 000 during business hours.'
  },
  {
    question: 'Can I change or cancel my order after placing it?',
    answer: 'Yes, you can change or cancel your order within 1 hour of placing it, as long as it hasn\'t been processed yet. Contact our support team immediately to make changes.'
  },
  {
    question: 'Do you ship internationally?',
    answer: 'Currently, we ship within Tunisia and to select North African countries. Contact our support team for more information about international shipping options.'
  },
  {
    question: 'How do I find my correct size?',
    answer: 'We provide a detailed size guide on each product page. You can also visit our Size Guide page for comprehensive measurements. If you\'re still unsure, our customer support is happy to help.'
  }
]

export function FAQ() {
  const { isRTL } = useContext(LanguageContext)!
  const { isDark } = useContext(ThemeContext)!
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredFaqs = FAQS.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>
            Find answers to common questions about Bey3a
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="section">
        <div className="container">
          {/* Search */}
          <div style={{
            maxWidth: '600px',
            margin: '0 auto var(--spacing-2xl)',
            position: 'relative'
          }}>
            <Search size={20} style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)'
            }} />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--card-bg)',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* FAQ List */}
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {filteredFaqs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                <HelpCircle size={48} color="var(--text-secondary)" style={{ marginBottom: 'var(--spacing-md)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>
                  No results found. Please contact our support team for assistance.
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-xl)',
                    backgroundColor: 'var(--card-bg)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    style={{
                      width: '100%',
                      padding: 'var(--spacing-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '1.0625rem' }}>
                      {faq.question}
                    </span>
                    {openIndex === index ? (
                      <ChevronUp size={20} color="var(--accent-color)" />
                    ) : (
                      <ChevronDown size={20} color="var(--text-secondary)" />
                    )}
                  </button>
                  
                  {openIndex === index && (
                    <div style={{
                      padding: '0 var(--spacing-lg) var(--spacing-lg)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.7
                    }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Contact Support */}
          <div style={{
            textAlign: 'center',
            marginTop: 'var(--spacing-2xl)',
            padding: 'var(--spacing-xl)',
            backgroundColor: 'var(--card-bg)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Still have questions?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <a
              href="/contact"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--accent-color)',
                color: 'white',
                borderRadius: 'var(--radius-lg)',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
