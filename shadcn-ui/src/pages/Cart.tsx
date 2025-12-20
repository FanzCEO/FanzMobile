import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Shield, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/sonner';

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  type: 'credits' | 'subscription' | 'addon';
}

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [ageVerified, setAgeVerified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wicked-cart');
    if (saved) {
      setCart(JSON.parse(saved));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('wicked-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`Added ${item.name} to cart`);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0; // No tax for digital goods
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (!ageVerified) {
      toast.error('Please verify you are 18+ years old');
      return;
    }
    if (!termsAccepted) {
      toast.error('Please accept the terms of service');
      return;
    }
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setProcessing(true);

    // Simulate checkout - in production this would call payment API
    setTimeout(() => {
      toast.success('Order placed successfully!');
      setCart([]);
      localStorage.removeItem('wicked-cart');
      navigate('/credits');
      setProcessing(false);
    }, 2000);
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
          {cart.length > 0 && (
            <Card className="glass-panel p-6">
              <h2 className="text-lg font-bold mb-4">Your Cart ({cart.length} items)</h2>
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, -1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="font-bold w-20 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(item.id)}>
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

            {/* Payment Method */}
            <div className="mb-4">
              <Label className="mb-2 block">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                <div className="flex items-center space-x-2 p-2 rounded bg-white/5">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                    <CreditCard className="h-4 w-4" /> Credit/Debit Card
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded bg-white/5">
                  <RadioGroupItem value="crypto" id="crypto" />
                  <Label htmlFor="crypto" className="cursor-pointer">Cryptocurrency</Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded bg-white/5">
                  <RadioGroupItem value="ccbill" id="ccbill" />
                  <Label htmlFor="ccbill" className="cursor-pointer">CCBill</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Age Verification */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start space-x-2">
                <Checkbox id="age" checked={ageVerified} onCheckedChange={(c) => setAgeVerified(c === true)} />
                <Label htmlFor="age" className="text-sm cursor-pointer">
                  I confirm I am 18 years of age or older
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(c === true)} />
                <Label htmlFor="terms" className="text-sm cursor-pointer">
                  I agree to the <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                </Label>
              </div>
            </div>

            <Button
              className="w-full gradient-primary"
              size="lg"
              onClick={handleCheckout}
              disabled={processing || cart.length === 0}
            >
              {processing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
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
