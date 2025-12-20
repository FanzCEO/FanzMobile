import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, Shield, ChevronLeft, Wallet, Building2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/sonner';
import { useCartStore } from '@/lib/stores/cartStore';

type PaymentMethod = 'card' | 'crypto' | 'ccbill' | 'paypal';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getSubtotal, getTax, getTotal, clearCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [ageVerified, setAgeVerified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Billing form state
  const [billingInfo, setBillingInfo] = useState({
    fullName: '',
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    zipCode: '',
    address: '',
    city: '',
    state: '',
    country: '',
  });

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();

  const handleInputChange = (field: string, value: string) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!ageVerified) {
      toast.error('Please verify you are 18+ years old');
      return false;
    }
    if (!termsAccepted) {
      toast.error('Please accept the terms of service');
      return false;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return false;
    }

    // Validate billing info based on payment method
    if (paymentMethod === 'card') {
      if (!billingInfo.fullName || !billingInfo.email || !billingInfo.cardNumber || !billingInfo.expiryDate || !billingInfo.cvv) {
        toast.error('Please fill in all required card information');
        return false;
      }
    } else if (paymentMethod === 'crypto') {
      if (!billingInfo.email) {
        toast.error('Email is required for cryptocurrency payments');
        return false;
      }
    }

    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setProcessing(true);

    try {
      // TODO: Implement actual payment processing via backend API
      // This would call /api/checkout with payment method and billing info

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/credits');
    } catch (error) {
      toast.error('Payment failed. Please try again.');
      console.error('Checkout error:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Checkout</h1>
          <p className="text-muted-foreground mt-1">Complete your purchase</p>
        </div>
        <Card className="glass-panel p-12 text-center">
          <p className="text-lg text-muted-foreground mb-4">Your cart is empty</p>
          <Button onClick={() => navigate('/cart')}>Go to Cart</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cart')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Checkout</h1>
          <p className="text-muted-foreground mt-1">Complete your purchase</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment & Billing Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Method Selection */}
          <Card className="glass-panel p-6">
            <h2 className="text-lg font-bold mb-4">Payment Method</h2>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="space-y-3">
              <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                paymentMethod === 'card' ? 'border-primary bg-primary/10' : 'border-transparent bg-white/5'
              }`} onClick={() => setPaymentMethod('card')}>
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5" /> Credit/Debit Card
                </Label>
              </div>
              <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                paymentMethod === 'crypto' ? 'border-primary bg-primary/10' : 'border-transparent bg-white/5'
              }`} onClick={() => setPaymentMethod('crypto')}>
                <RadioGroupItem value="crypto" id="crypto" />
                <Label htmlFor="crypto" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Wallet className="h-5 w-5" /> Cryptocurrency
                </Label>
              </div>
              <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                paymentMethod === 'ccbill' ? 'border-primary bg-primary/10' : 'border-transparent bg-white/5'
              }`} onClick={() => setPaymentMethod('ccbill')}>
                <RadioGroupItem value="ccbill" id="ccbill" />
                <Label htmlFor="ccbill" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Building2 className="h-5 w-5" /> CCBill (Adult Industry Billing)
                </Label>
              </div>
              <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                paymentMethod === 'paypal' ? 'border-primary bg-primary/10' : 'border-transparent bg-white/5'
              }`} onClick={() => setPaymentMethod('paypal')}>
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Wallet className="h-5 w-5" /> PayPal
                </Label>
              </div>
            </RadioGroup>
          </Card>

          {/* Billing Information */}
          {paymentMethod === 'card' && (
            <Card className="glass-panel p-6">
              <h2 className="text-lg font-bold mb-4">Billing Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      value={billingInfo.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={billingInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number *</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={billingInfo.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date *</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={billingInfo.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={billingInfo.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label htmlFor="address">Billing Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St"
                    value={billingInfo.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="New York"
                      value={billingInfo.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      placeholder="10001"
                      value={billingInfo.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      placeholder="NY"
                      value={billingInfo.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="USA"
                      value={billingInfo.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {paymentMethod === 'crypto' && (
            <Card className="glass-panel p-6">
              <h2 className="text-lg font-bold mb-4">Cryptocurrency Payment</h2>
              <p className="text-muted-foreground mb-4">
                After clicking "Complete Purchase", you'll be redirected to our crypto payment processor to complete the transaction.
              </p>
              <div className="space-y-2">
                <Label htmlFor="crypto-email">Email for Receipt *</Label>
                <Input
                  id="crypto-email"
                  type="email"
                  placeholder="your@email.com"
                  value={billingInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </Card>
          )}

          {paymentMethod === 'ccbill' && (
            <Card className="glass-panel p-6">
              <h2 className="text-lg font-bold mb-4">CCBill Payment</h2>
              <p className="text-muted-foreground">
                You will be redirected to CCBill's secure payment page to complete your purchase. CCBill is a trusted payment processor for adult content and services.
              </p>
            </Card>
          )}

          {paymentMethod === 'paypal' && (
            <Card className="glass-panel p-6">
              <h2 className="text-lg font-bold mb-4">PayPal Payment</h2>
              <p className="text-muted-foreground">
                You will be redirected to PayPal to complete your purchase securely.
              </p>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <Card className="glass-panel p-6 sticky top-4">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-3 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            {/* Price Summary */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Age Verification & Terms */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="age-checkout"
                  checked={ageVerified}
                  onCheckedChange={(c) => setAgeVerified(c === true)}
                />
                <Label htmlFor="age-checkout" className="text-sm cursor-pointer leading-tight">
                  I confirm I am 18 years of age or older
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms-checkout"
                  checked={termsAccepted}
                  onCheckedChange={(c) => setTermsAccepted(c === true)}
                />
                <Label htmlFor="terms-checkout" className="text-sm cursor-pointer leading-tight">
                  I agree to the <a href="/terms" className="text-primary hover:underline">Terms of Service</a> and <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                </Label>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              className="w-full gradient-primary"
              size="lg"
              onClick={handleCheckout}
              disabled={processing}
            >
              {processing ? 'Processing...' : `Complete Purchase - $${total.toFixed(2)}`}
            </Button>

            {/* Security Badges */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>256-bit SSL encryption</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>PCI DSS compliant</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
