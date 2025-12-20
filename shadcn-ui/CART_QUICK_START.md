# Shopping Cart - Quick Start Guide

## 🚀 Getting Started (5 minutes)

### 1. Frontend Setup
The cart system is already integrated into your app. Just navigate to:
- **Cart Page**: `http://localhost:5173/cart`
- **Checkout Page**: `http://localhost:5173/checkout`

### 2. Using the Cart in Your Components

```typescript
// Import the cart store
import { useCartStore } from '@/lib/stores/cartStore';

function YourComponent() {
  // Get what you need from the store
  const { items, addItem, removeItem, getTotal } = useCartStore();

  // Add an item
  const handleAddToCart = () => {
    addItem({
      id: 'product-123',
      name: 'Premium Credits',
      description: '1000 AI credits',
      price: 10.00,
      type: 'credits',
    });
  };

  return (
    <div>
      <p>Cart Total: ${getTotal().toFixed(2)}</p>
      <p>Items: {items.length}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

### 3. Backend API Calls

```typescript
import { addToCart, processCheckout } from '@/lib/api/cart';

// Add to cart via API
await addToCart({
  product_type: 'credits',
  product_id: 'credits-100',
  quantity: 1,
  price_cents: 1000, // $10.00 in cents
});

// Process checkout
const result = await processCheckout({
  payment_method: 'card',
  billing_info: {
    full_name: 'John Doe',
    email: 'john@example.com',
    // ... other fields
  },
  age_verified: true,
  terms_accepted: true,
});
```

## 📝 Common Tasks

### Add a Product to Cart
```typescript
const { addItem } = useCartStore();

addItem({
  id: 'unique-product-id',
  name: 'Product Name',
  description: 'Product description',
  price: 29.99,
  type: 'credits', // or 'subscription', 'addon', 'product'
});
```

### Update Quantity
```typescript
const { updateQuantity } = useCartStore();

updateQuantity('product-id', 5); // Set quantity to 5
```

### Remove from Cart
```typescript
const { removeItem } = useCartStore();

removeItem('product-id');
```

### Clear Cart
```typescript
const { clearCart } = useCartStore();

clearCart();
```

### Get Cart Info
```typescript
const { items, getSubtotal, getTax, getTotal, getItemCount } = useCartStore();

console.log('Items:', items);
console.log('Subtotal:', getSubtotal());
console.log('Tax:', getTax());
console.log('Total:', getTotal());
console.log('Count:', getItemCount());
```

## 🔧 Configuration

### Payment Methods
Edit in `/src/pages/Checkout.tsx`:
```typescript
type PaymentMethod = 'card' | 'crypto' | 'ccbill' | 'paypal';
```

### Tax Rate
Edit in `/src/lib/stores/cartStore.ts`:
```typescript
getTax: () => {
  const state = get();
  return state.getSubtotal() * 0.08; // 8% tax
}
```

### Product Catalog
Edit in `/src/pages/Cart.tsx`:
```typescript
const CREDIT_PACKS = [
  {
    id: 'credits-100',
    name: '100 Credits',
    description: 'Basic pack',
    price: 1.00,
    credits: 100
  },
  // Add more...
];
```

## 🎨 Customization

### Change Cart Icon
In your navigation component:
```typescript
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cartStore';

function CartButton() {
  const itemCount = useCartStore((state) => state.getItemCount());

  return (
    <button onClick={() => navigate('/cart')}>
      <ShoppingCart />
      {itemCount > 0 && <span>{itemCount}</span>}
    </button>
  );
}
```

### Custom Checkout Flow
Modify `/src/pages/Checkout.tsx` to add:
- Discount codes
- Gift messages
- Shipping address (for physical goods)
- Save payment method option

## 🐛 Debugging

### Cart Not Persisting?
Check browser console for localStorage errors:
```javascript
// In browser console
localStorage.getItem('wicked-cart-storage');
```

### API Errors?
Check authentication token:
```javascript
// In browser console
localStorage.getItem('access_token');
```

### Backend Not Responding?
```bash
# SSH to server
ssh root@rent.fanz.website

# Check backend process
ps aux | grep uvicorn

# Check logs
tail -f /path/to/backend/logs
```

## 🔐 Security Checklist

Before going to production:

- [ ] Enable HTTPS (SSL certificate)
- [ ] Set up real payment processors (not mock)
- [ ] Implement proper authentication
- [ ] Add rate limiting
- [ ] Enable CSRF protection
- [ ] Sanitize all user inputs
- [ ] Log all transactions
- [ ] Set up monitoring/alerting
- [ ] Configure webhooks for payment confirmations
- [ ] Test age verification flow
- [ ] Review privacy policy and terms

## 📊 Testing

### Manual Testing Checklist
- [ ] Add items to cart
- [ ] Update quantities
- [ ] Remove items
- [ ] Clear cart
- [ ] Cart persists after refresh
- [ ] Navigate to checkout
- [ ] Select payment method
- [ ] Fill billing form
- [ ] Age verification checkbox works
- [ ] Terms acceptance checkbox works
- [ ] Checkout button enables/disables correctly
- [ ] Error messages display properly
- [ ] Success flow redirects correctly

### API Testing
```bash
# Get cart (replace TOKEN with your auth token)
curl -X GET http://localhost:8500/api/cart \
  -H "Authorization: Bearer TOKEN"

# Add to cart
curl -X POST http://localhost:8500/api/cart/add \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_type": "credits",
    "product_id": "test-123",
    "quantity": 1,
    "price_cents": 1000
  }'
```

## 📚 Documentation

Full documentation available in:
- `SHOPPING_CART_SYSTEM.md` - Complete system documentation
- `CART_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `CART_FEATURES.md` - Feature overview and architecture

## 🆘 Common Issues

### Issue: Cart items disappear
**Solution**: Check if localStorage is enabled in browser

### Issue: Checkout button disabled
**Solution**: Ensure age verification and terms are checked

### Issue: API returns 401
**Solution**: Check authentication token is valid and not expired

### Issue: Payment not processing
**Solution**: Implement actual payment processor integration (currently mock)

## 💡 Tips

1. **Use cents for prices** to avoid floating-point issues
2. **Validate on both frontend and backend** for security
3. **Log all cart actions** for debugging and analytics
4. **Clear cart after successful checkout** to prevent double-orders
5. **Show loading states** during API calls for better UX

## 🔗 Useful Links

- Zustand Docs: https://zustand-demo.pmnd.rs/
- FastAPI Docs: https://fastapi.tiangolo.com/
- Stripe API: https://stripe.com/docs/api
- CCBill Docs: https://ccbill.com/doc

---

**Need Help?**
- Check the documentation files
- Review browser console for errors
- Check backend logs
- Contact: wyatt@fanz.website
