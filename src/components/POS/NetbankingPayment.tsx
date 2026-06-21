import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Building2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

const generateTransactionId = () =>
  `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

interface NetbankingPaymentProps {
  amount: number;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

const banks = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Bank of Baroda',
  'Punjab National Bank',
  'Canara Bank',
];

export function NetbankingPayment({ amount, onSuccess, onCancel }: NetbankingPaymentProps) {
  const [selectedBank, setSelectedBank] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'bank' | 'credentials' | 'otp'>('bank');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank) {
      toast.error('Please select a bank');
      return;
    }
    setStep('credentials');
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !password) {
      toast.error('Please enter user ID and password');
      return;
    }
    // Simulate sending OTP
    toast.success('OTP sent to your registered mobile number');
    setStep('otp');
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise((r) => setTimeout(r, 700));
      if (otp !== '123456') {
        toast.error('Invalid OTP');
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
    <div className="space-y-4">
      <div className="p-4 rounded-lg border border-green-500/30 mb-4" style={{ background: 'var(--payment-green-bg)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-green-500" />
          <span className="text-green-500">Net Banking</span>
        </div>
        <div className="text-2xl text-green-500">₹{amount.toFixed(2)}</div>
      </div>

      {step === 'bank' && (
        <form onSubmit={handleBankSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bank">Select Your Bank</Label>
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a bank" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    {bank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-blue-400 border border-blue-500/30" style={{ backgroundColor: 'var(--payment-neutral-bg)' }}>
            <ShieldCheck className="w-4 h-4" />
            <span>Secure connection to your bank</span>
          </div>

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              Continue to Bank Login
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="w-full">
              Cancel
            </Button>
          </div>
        </form>
      )}

      {step === 'credentials' && (
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          <div className="p-3 rounded-lg text-sm text-center border border-border" style={{ backgroundColor: 'var(--payment-neutral-bg)' }}>
            <p className="text-blue-400">{selectedBank}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-id">User ID</Label>
            <Input
              id="user-id"
              type="text"
              placeholder="Enter your user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              Login & Generate OTP
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('bank')}
              className="w-full"
            >
              Back
            </Button>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div className="p-3 rounded-lg text-sm text-center border border-green-500/30" style={{ background: 'var(--payment-green-bg)' }}>
            <p className="text-green-500">OTP sent to your registered mobile number</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
              required
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Test OTP: 123456
          </p>

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Verify & Pay ₹${amount.toFixed(2)}`
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('credentials')}
              className="w-full"
              disabled={isProcessing}
            >
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
