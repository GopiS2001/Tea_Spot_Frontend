import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Banknote, Calculator } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

const generateTransactionId = () =>
  `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

interface CashPaymentProps {
  amount: number;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

export function CashPayment({ amount, onSuccess, onCancel }: CashPaymentProps) {
  const [receivedAmount, setReceivedAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const received = parseFloat(receivedAmount) || 0;
  const change = received - amount;

  const quickAmounts = [
    Math.ceil(amount),
    Math.ceil(amount / 10) * 10,
    Math.ceil(amount / 20) * 20,
    Math.ceil(amount / 50) * 50,
  ].filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (received < amount) {
      toast.error('Received amount is less than total');
      return;
    }

    setIsProcessing(true);

    try {
      // Cash is settled at the till — no external processor. Brief delay just
      // for UX so the spinner is visible. The real order POST happens in the
      // parent's onPaymentSuccess handler.
      await new Promise((r) => setTimeout(r, 300));
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
      <div className="p-4 rounded-lg border border-amber-500/30 mb-4" style={{ background: 'var(--payment-amber-bg)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Banknote className="w-5 h-5 text-amber-500" />
          <span className="text-amber-500">Cash Payment</span>
        </div>
        <div className="text-2xl text-amber-500">₹{amount.toFixed(2)}</div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="received-amount">Amount Received</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
          <Input
            id="received-amount"
            type="number"
            step="0.01"
            min={amount}
            placeholder="0.00"
            value={receivedAmount}
            onChange={(e) => setReceivedAmount(e.target.value)}
            className="pl-8 text-lg"
            required
            autoFocus
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {quickAmounts.map((quickAmount) => (
          <Button
            key={quickAmount}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReceivedAmount(quickAmount.toString())}
            className="hover:bg-amber-50 hover:border-amber-300"
          >
            ₹{quickAmount}
          </Button>
        ))}
      </div>

      {received >= amount && (
        <div className="p-4 rounded-lg border border-green-500/30" style={{ background: 'var(--payment-green-bg)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Amount Received:</span>
            <span className="text-green-500">₹{received.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Amount:</span>
            <span>₹{amount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-green-500/30">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-green-500" />
              <span className="text-green-500">Change:</span>
            </div>
            <span className="text-xl text-green-500">
              ₹{change.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {received > 0 && received < amount && (
        <div className="p-3 rounded-lg border border-destructive/30 text-sm text-destructive" style={{ backgroundColor: 'var(--payment-neutral-bg)' }}>
          ⚠️ Insufficient amount. Need ₹{(amount - received).toFixed(2)} more.
        </div>
      )}

      <div className="pt-2 space-y-2">
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          disabled={isProcessing || received < amount}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
            </>
          ) : (
            'Confirm Cash Payment'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      </div>
    </form>
  );
}
