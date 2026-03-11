import { useContext, useState, useEffect } from 'react'
import { LanguageContext, ThemeContext } from './Layout'
import { ShoppingBag, Search, Filter, Star, Heart, ShoppingCart } from 'lucide-react'
import axios from 'axios'

// API Base URL - use relative path to backend
const API_BASE = 'http://localhost:5001/api'

interface Product {
  id: string
  name: {
    fr?: string
    en?: string
    'ar-tn'?: string
    [key: string]: string | undefined
  }
  price: number
  originalPrice?: number
  rating?: number
  reviews?: number
  image?: string
  images?: string[]
  badge?: string
  categoryId?: string
  brandId?: string
}

interface Category {
  id: string
  name: {
    fr?: string
    en?: string
    'ar-tn'?: string
    [key: string]: string | undefined
  }
  icon?: string
}

export function Shop() {
  const { t, isRTL, language } = useContext(LanguageContext)!
  const { isDark } = useContext(ThemeContext)!
  
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch products and categories from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch products
        const productsRes = await axios.get(`${API_BASE}/products`, {
          params: { limit: 50 }
        })
        setProducts(productsRes.data)
        
        // Fetch categories
        const categoriesRes = await axios.get(`${API_BASE}/categories`)
        setCategories(categoriesRes.data)
      } catch (error) {
        console.error('Error fetching data:', error)
        // Fallback - keep empty or could add error state
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Filter products by category
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory
    const matchesSearch = searchQuery === '' || 
      (product.name?.fr?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.name?.en?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.name?.['ar-tn']?.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  // Get product name based on current language
  const getProductName = (product: Product): string => {
    if (!product.name) return 'Product'
    return product.name[language] || product.name.fr || product.name.en || product.name['ar-tn'] || 'Product'
  }

  // Get category name based on current language
  const getCategoryName = (category: Category): string => {
    if (!category.name) return 'Category'
    return category.name[language] || category.name.fr || category.name.en || category.name['ar-tn'] || 'Category'
  }

  // Get product image
  const getProductImage = (product: Product): string => {
    if (product.images && product.images.length > 0) {
      return product.images[0]
    }
    if (product.image) {
      return product.image
    }
    return '' // Will show placeholder emoji
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
            {t('nav.shop')}
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>
            {t('footer.flashSales')}
          </p>
        </div>
      </section>

      {/* Shop Content */}
      <section className="section">
        <div className="container">
          {/* Search and Filter */}
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-xl)',
            flexWrap: 'wrap'
          }}>
            <div style={{
              flex: 1,
              minWidth: '300px',
              position: 'relative'
            }}>
              <Search size={20} style={{
                position: 'absolute',
                left: isRTL ? 'auto' : '1rem',
                right: isRTL ? '1rem' : 'auto',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
              <input 
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 3rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--card-bg)',
                  fontSize: '1rem'
                }}
              />
            </div>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--card-bg)',
              cursor: 'pointer'
            }}>
              <Filter size={20} />
              Filters
            </button>
          </div>

          {/* Categories */}
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-xl)',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                border: selectedCategory === 'all' ? 'none' : '1px solid var(--border-color)',
                backgroundColor: selectedCategory === 'all' ? 'var(--accent-color)' : 'var(--card-bg)',
                color: selectedCategory === 'all' ? 'white' : 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all var(--transition-base)'
              }}
            >
              {t('footer.shop')}
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  border: selectedCategory === category.id ? 'none' : '1px solid var(--border-color)',
                  backgroundColor: selectedCategory === category.id ? 'var(--accent-color)' : 'var(--card-bg)',
                  color: selectedCategory === category.id ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all var(--transition-base)'
                }}
              >
                {category.icon || '👕'} {getCategoryName(category)}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: '4rem' 
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                border: '3px solid var(--border-color)',
                borderTopColor: 'var(--accent-color)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem',
              color: 'var(--text-secondary)'
            }}>
              <ShoppingBag size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No products found</p>
            </div>
          ) : (
            /* Products Grid */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 'var(--spacing-lg)'
            }}>
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: 'var(--radius-xl)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all var(--transition-base)',
                    cursor: 'pointer'
                  }}
                >
                  {/* Image Area */}
                  <div style={{
                    height: '240px',
                    backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '5rem',
                    position: 'relative',
                    backgroundImage: getProductImage(product) ? `url(${getProductImage(product)})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    {!getProductImage(product) && '👗'}
                    
                    {/* Badge */}
                    {product.badge && (
                      <span style={{
                        position: 'absolute',
                        top: '1rem',
                        left: isRTL ? 'auto' : '1rem',
                        right: isRTL ? '1rem' : 'auto',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: product.badge === 'Sale' ? '#ef4444' : product.badge === 'New' ? '#22c55e' : 'var(--accent-color)',
                        color: 'white',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {product.badge}
                      </span>
                    )}
                    
                    {/* Wishlist Button */}
                    <button style={{
                      position: 'absolute',
                      top: '1rem',
                      left: isRTL ? '1rem' : 'auto',
                      right: isRTL ? 'auto' : '1rem',
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      <Heart size={18} />
                    </button>
                  </div>
                  
                  {/* Content */}
                  <div style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                      <Star size={14} fill="var(--warning-color)" color="var(--warning-color)" />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{product.rating || '4.5'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({product.reviews || 0})</span>
                    </div>
                    
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {getProductName(product)}
                    </h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--accent-color)' }}>
                        {product.price} TND
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span style={{ fontSize: '0.875rem', textDecoration: 'line-through', color: 'var(--text-secondary)' }}>
                          {product.originalPrice} TND
                        </span>
                      )}
                    </div>
                    
                    <button style={{
                      width: '100%',
                      marginTop: 'var(--spacing-md)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-lg)',
                      border: 'none',
                      backgroundColor: 'var(--primary-color)',
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}>
                      <ShoppingCart size={18} />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {filteredProducts.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-2xl)' }}>
              <button style={{
                padding: '0.875rem 2.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--primary-color)',
                backgroundColor: 'transparent',
                color: 'var(--primary-color)',
                fontWeight: 600,
                cursor: 'pointer'
              }}>
                Load More Products
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
