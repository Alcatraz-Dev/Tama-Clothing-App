import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { LayoutProvider } from './pages/Layout'
import { Home, Shop, About, Contact, FAQ, Shipping, Returns, Privacy, Terms } from './pages'

function App() {
  return (
    <Router>
      <LayoutProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
      </LayoutProvider>
    </Router>
  )
}

export default App
