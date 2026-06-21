import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Smartphone, Banknote } from 'lucide-react';
import { motion } from 'motion/react';
import { UPIPayment } from './UPIPayment';
import { CashPayment } from './CashPayment';
import { useSettings } from '../../hooks/useApi';

type PaymentMethod = 'upi' | 'cash' | null;

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onPaymentSuccess: (method: string, transactionId: string) => void;
}

export function PaymentModal({ open, onClose, total, onPaymentSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);

  // Which methods to show is driven by the branch's Settings (Accept Cash / UPI).
  // Default to showing both until settings load so payment is never blocked.
  const { data: settingsData } = useSettings();
  const s = settingsData?.settings;
  const acceptCash = s ? s.acceptCash : true;
  const acceptUpi = s ? s.acceptUpi : true;

  const paymentMethods = [
    ...(acceptUpi
      ? [{ id: 'upi', name: 'UPI', icon: Smartphone, color: 'from-purple-400 to-purple-600' }]
      : []),
    ...(acceptCash
      ? [{ id: 'cash', name: 'Cash', icon: Banknote, color: 'from-amber-400 to-amber-600' }]
      : []),
  ];

  const handleBack = () => {
    setSelectedMethod(null);
  };

  const handleSuccess = (transactionId: string) => {
    onPaymentSuccess(selectedMethod!, transactionId);
    setSelectedMethod(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="backdrop-blur-xl border-border/40 max-w-md" style={{ backgroundColor: 'var(--glass-bg)' }}>
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            {selectedMethod ? 'Complete your payment' : 'Choose a payment method'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!selectedMethod ? (
            <>
              <div className="mb-6 p-4 rounded-lg border border-border" style={{ background: 'var(--payment-total-bg)' }}>
                <div className="text-sm text-muted-foreground mb-1">Total Amount</div>
                <div className="text-3xl text-sky-600">₹{total.toFixed(2)}</div>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-6">
                  No payment methods are enabled. Turn on Cash or UPI in Settings.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <motion.button
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMethod(method.id as PaymentMethod)}
                      className="p-4 rounded-lg border-2 border-border hover:border-sky-300 transition-all group"
                    >
                      <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${method.color} flex items-center justify-center`}>
                        <method.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-sm text-center group-hover:text-sky-600 transition-colors">
                        {method.name}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleBack} className="mb-4">
                ← Back to payment methods
              </Button>

              {selectedMethod === 'upi' && (
                <UPIPayment amount={total} onSuccess={handleSuccess} onCancel={handleBack} />
              )}
              {selectedMethod === 'cash' && (
                <CashPayment amount={total} onSuccess={handleSuccess} onCancel={handleBack} />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
