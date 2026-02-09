# Tama Clothing - UX Flow & Screen Map

## 1. Brand Aesthetics
- **Core Principles**: High contrast (B&W), generous whitespace, ultra-smooth transitions, large high-quality typography.
- **Animations**: Parallax scrolling on headers, fade-in for product cards, "swipe to add" gestures.

---

## 2. Customer App Flow

### Phase 1: Onboarding & Auth
- **Welcome Screen**: Video background (looping fashion reel) + "Shop Now" / "Login".
- **Authentication**: Minimalist form for Login/Register + Google Social Login.
- **Language Selection**: Integrated during the first launch (French / Derja).

### Phase 2: Discovery
- **Home**: Banner slider (New Arrivals) → Featured Collections → Category Grid.
- **Category Browsing**: Visual category tiles (Women, Men, Kids).
- **Product Listing**: 2-column grid, clean price display, visual color swatches.
- **Filters (Slide-up Drawer)**: Size, Color, Price Range.

### Phase 3: Product Detail
- **Detail Page**: Full-screen image gallery (horizontal swipe) → Info section (collapsible) → Size selector → Sticky "Add to Bag" button.

### Phase 4: Checkout
- **Cart**: List of items → Edit quantity → Estimated total.
- **Shipping**: Address entry (Pre-filled if exists).
- **Payment Selection**: Toggle between "Paiement à la livraison" (COD) and "Carte Bancaire".
- **Success Screen**: Order tracking animation.

---

## 3. Admin Dashboard Structure

### Dashboard Home
- Key Metrics: Daily Sales (TND), Orders Pending, Active Users.
- Real-time order ticker.

### Catalog Management
- **Product List**: Search/Filter by category.
- **Add Product Wizard**: Image upload to Firebase Storage → Multi-variant generation (Sizes/Colors).

### Order Fulfillment
- Kanban view: Pending → Confirmed → Shipped → Delivered.
- PDF Invoice generation.

### Settings
- Store status (Online/Offline).
- Translation editor for dynamic content.
