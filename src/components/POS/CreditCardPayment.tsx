import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

const generateTransactionId = () =>
  `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

interface CreditCardPaymentProps {
  amount: number;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

export function CreditCardPayment({ amount, onSuccess, onCancel }: CreditCardPaymentProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // 16 digits + 3 spaces
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length !== 16) {
      toast.error('Invalid card number');
      return;
    }

    if (cvv.length !== 3) {
      toast.error('Invalid CVV');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate gateway latency; treat any 0000-suffixed card as a failure
      // so the failure path is still testable.
      await new Promise((r) => setTimeout(r, 700));
      if (cleanedCardNumber.endsWith('0000')) {
        toast.error('Card declined');
        return;
      }
      const txId = generateTransactionId();
      toast.success('Payment successful!');
      onSuccess(txId);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-lg border border-blue-500/30 mb-4" style={{ background: 'var(--payment-blue-bg)' }}>
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-5 h-5 text-blue-500" />
          <span className="text-blue-500">Credit/Debit Card</span>
        </div>
        <div className="text-2xl text-blue-500">₹{amount.toFixed(2)}</div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="card-number">Card Number</Label>
        <Input
          id="card-number"
          type="text"
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          required
          maxLength={19}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="card-name">Cardholder Name</Label>
        <Input
          id="card-name"
          type="text"
          placeholder="John Doe"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="expiry">Expiry Date</Label>
          <Input
            id="expiry"
            type="text"
            placeholder="MM/YY"
            value={expiryDate}
            onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
            required
            maxLength={5}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            type="text"
            placeholder="123"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
            required
            maxLength={3}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-muted-foreground border border-border" style={{ backgroundColor: 'var(--payment-neutral-bg)' }}>
        <Lock className="w-4 h-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      <div className="pt-2 space-y-2">
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
            </>
          ) : (
            `Pay ₹${amount.toFixed(2)}`
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Test: Use card ending in 0000 to simulate failure
      </p>
    </form>
  );
}
