import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Shield, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { useCartStore } from '@/lib/stores/cartStore';

const CREDIT_PACKS = [
  { id: 'credits-100', name: '100 Credits', description: 'Basic pack', price: 1.00, credits: 100 },
  { id: 'credits-550', name: '550 Credits', description: '10% bonus', price: 5.00, credits: 550 },
  { id: 'credits-1200', name: '1,200 Credits', description: '20% bonus', price: 10.00, credits: 1200 },
  { id: 'credits-3250', name: '3,250 Credits', description: '30% bonus - Popular', price: 25.00, credits: 3250 },
  { id: 'credits-7500', name: '7,500 Credits', description: '50% bonus', price: 50.00, credits: 7500 },
  { id: 'credits-17500', name: '17,500 Credits', description: '75% bonus - Best Value', price: 100.00, credits: 17500 },
];

const SUBSCRIPTIONS = [
  { id: 'sub-weekly', name: 'Starter Weekly', description: 'Perfect for getting started', price: 3.99, period: 'week' },
  { id: 'sub-monthly', name: 'Pro Monthly', description: 'Most popular for creators', price: 14.99, period: 'month' },
  { id: 'sub-yearly', name: 'Business Yearly', description: 'Best value - 2 months free', price: 149.99, period: 'year' },
];

export default function Cart() {
  const navigate = useNavigate();
  const { items, addItem, removeItem, updateQuantity, getSubtotal, getTax, getTotal } = useCartStore();

  const addToCart = (item: Omit<Parameters<typeof addItem>[0], 'quantity'>) => {
    addItem(item);
    toast.success(`Added ${item.name} to cart`);
  };

  const handleRemove = (id: string) => {
    removeItem(id);
    toast.success('Item removed from cart');
  };

  const handleQuantityChange = (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      updateQuantity(id, item.quantity + delta);
    }
  };

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient flex items-center gap-2">
          <ShoppingCart className="h-7 w-7" />
          Shopping Cart
        </h1>
        <p className="text-muted-foreground mt-1">
          Purchase credits and subscriptions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Credit Packs */}
          <Card className="glass-panel p-6">
            <h2 className="text-lg font-bold mb-4">AI Credit Packs</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CREDIT_PACKS.map(pack => (
                <div
                  key={pack.id}
                  className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-primary"
                  onClick={() => addToCart({ id: pack.id, name: pack.name, description: pack.description, price: pack.price, type: 'credits' })}
                >
                  <p className="font-bold text-lg">${pack.price.toFixed(2)}</p>
                  <p className="text-primary font-medium">{pack.credits.toLocaleString()} credits</p>
                  <p className="text-xs text-muted-foreground">{pack.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Subscriptions */}
          <Card className="glass-panel p-6">
            <h2 className="text-lg font-bold mb-4">Membership Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SUBSCRIPTIONS.map(sub => (
                <div
                  key={sub.id}
                  className={`p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border ${sub.id === 'sub-monthly' ? 'border-primary' : 'border-transparent hover:border-primary'}`}
                  onClick={() => addToCart({ id: sub.id, name: sub.name, description: sub.description, price: sub.price, type: 'subscription' })}
                >
                  {sub.id === 'sub-monthly' && (
                    <Badge className="mb-2 bg-primary">Most Popular</Badge>
                  )}
                  <p className="font-bold text-xl">${sub.price.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">per {sub.period}</p>
                  <p className="font-medium mt-2">{sub.name}</p>
                  <p className="text-xs text-muted-foreground">{sub.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Cart Items */}
          {items.length > 0 && (
            <Card className="glass-panel p-6">
              <h2 className="text-lg font-bold mb-4">Your Cart ({items.length} items)</h2>
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, -1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="font-bold w-20 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleRemove(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Checkout Panel */}
        <div className="space-y-4">
          <Card className="glass-panel p-6 sticky top-4">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full gradient-primary"
              size="lg"
              onClick={handleCheckout}
              disabled={items.length === 0}
            >
              Proceed to Checkout - ${total.toFixed(2)}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Secure checkout powered by industry-leading encryption</span>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Adult industry compliant billing</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
