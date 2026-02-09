# Tama Clothing - Firestore Data Models

## 1. Overview
The database is structured to minimize reads and maximize performance for a retail environment.

## 2. Collections

### `users` (Collection)
```json
{
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "phoneNumber": "string",
  "role": "customer" | "admin",
  "defaultAddress": {
    "city": "string",
    "street": "string",
    "postalCode": "string",
    "governorate": "string"
  },
  "addresses": [
    { "id": "uuid", "street": "...", "isDefault": true }
  ],
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "preferences": {
    "language": "fr" | "ar-tn",
    "notificationsEnabled": true
  }
}
```

### `categories` (Collection)
```json
{
  "id": "string",
  "name": {
    "fr": "Femmes",
    "ar-tn": "نساء"
  },
  "slug": "women",
  "imageUrl": "string",
  "parentCategoryId": "string | null",
  "order": 1
}
```

### `products` (Collection)
```json
{
  "id": "string",
  "name": {
    "fr": "Robe d'été Minimaliste",
    "ar-tn": "روبة سيف سمبل"
  },
  "description": {
    "fr": "Une robe élégante...",
    "ar-tn": "روبة مزيانة برشا..."
  },
  "price": 89.000, // TND
  "discountPrice": 69.000,
  "categoryId": "string",
  "tags": ["new", "summer"],
  "mainImage": "url",
  "gallery": ["url1", "url2"],
  "variants": [
    {
      "sku": "TAMA-001-S-BLK",
      "size": "S",
      "color": "Black",
      "stock": 10
    }
  ],
  "isPublished": true,
  "createdAt": "timestamp"
}
```

### `orders` (Collection)
```json
{
  "id": "string",
  "userId": "string",
  "status": "pending" | "confirmed" | "shipped" | "delivered" | "cancelled",
  "payment": {
    "method": "cod" | "card",
    "status": "unpaid" | "paid",
    "transactionId": "string"
  },
  "items": [
    {
      "productId": "string",
      "variantSku": "string",
      "quantity": 1,
      "priceAtPurchase": 89.000
    }
  ],
  "shippingAddress": { ... },
  "totalAmount": 96.000, // Total + Shipping
  "shippingFee": 7.000,
  "createdAt": "timestamp"
}
```

### `carts` (Collection - Optional, can be Local)
*We will store carts in Firestore for persistent multi-device sync.*
```json
{
  "userId": "string",
  "items": [...],
  "updatedAt": "timestamp"
}
```

### `translations` (Collection)
*For dynamic UI labels not in hardcoded files.*
```json
{
  "key": "home_welcome",
  "fr": "Bienvenue chez Tama",
  "ar-tn": "مرحبا بيكم في تاما"
}
```
