import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Smartphone, QrCode } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

const generateTransactionId = () =>
  `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

interface UPIPaymentProps {
  amount: number;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

export function UPIPayment({ amount, onSuccess, onCancel }: UPIPaymentProps) {
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!upiId.includes('@')) {
      toast.error('Invalid UPI ID format');
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise((r) => setTimeout(r, 700));
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
      <div className="p-4 rounded-lg border border-purple-500/30 mb-4" style={{ background: 'var(--payment-purple-bg)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Smartphone className="w-5 h-5 text-purple-500" />
          <span className="text-purple-500">UPI Payment</span>
        </div>
        <div className="text-2xl text-purple-500">₹{amount.toFixed(2)}</div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="upi-id">UPI ID</Label>
        <Input
          id="upi-id"
          type="text"
          placeholder="username@upi"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Enter your UPI ID (e.g., username@paytm, username@phonepe)
        </p>
      </div>

      <div className="p-4 rounded-lg border-2 border-dashed border-border" style={{ backgroundColor: 'var(--payment-qr-bg)' }}>
        <div className="flex flex-col items-center gap-2 text-center">
          <QrCode className="w-16 h-16 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Scan QR Code<br />or enter UPI ID manually
          </p>
        </div>
      </div>

      <div className="pt-2 space-y-2">
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
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
    </form>
  );
}
