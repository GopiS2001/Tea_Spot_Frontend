import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Percent, IndianRupee } from 'lucide-react';

interface DiscountModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (discountType: 'percentage' | 'fixed', discountValue: number) => void;
  currentSubtotal: number;
}

export function DiscountModal({ open, onClose, onApply, currentSubtotal }: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');

  const handleApply = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) {
      return;
    }

    // Validate percentage doesn't exceed 100%
    if (discountType === 'percentage' && value > 100) {
      return;
    }

    // Validate fixed amount doesn't exceed subtotal
    if (discountType === 'fixed' && value > currentSubtotal) {
      return;
    }

    onApply(discountType, value);
    setDiscountValue('');
    onClose();
  };

  const previewDiscount = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) return 0;

    if (discountType === 'percentage') {
      return (currentSubtotal * value) / 100;
    }
    return Math.min(value, currentSubtotal);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="backdrop-blur-xl bg-white/90 border-white/40">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
          <DialogDescription>
            Choose discount type and enter the amount
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-gray-200 hover:border-sky-300 cursor-pointer transition-colors">
              <RadioGroupItem value="percentage" id="percentage" />
              <Label htmlFor="percentage" className="flex items-center gap-2 cursor-pointer flex-1">
                <Percent className="w-4 h-4 text-sky-500" />
                <span>Percentage Discount</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-gray-200 hover:border-sky-300 cursor-pointer transition-colors">
              <RadioGroupItem value="fixed" id="fixed" />
              <Label htmlFor="fixed" className="flex items-center gap-2 cursor-pointer flex-1">
                <IndianRupee className="w-4 h-4 text-green-500" />
                <span>Fixed Amount</span>
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="discount-value">
              {discountType === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {discountType === 'percentage' ? '%' : '₹'}
              </span>
              <Input
                id="discount-value"
                type="number"
                min="0"
                max={discountType === 'percentage' ? '100' : currentSubtotal.toString()}
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="pl-8"
                placeholder="Enter discount"
                autoFocus
              />
            </div>
          </div>

          {discountValue && !isNaN(parseFloat(discountValue)) && parseFloat(discountValue) > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm">₹{currentSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Discount:</span>
                <span className="text-sm text-green-600">-₹{previewDiscount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-green-200">
                <span className="text-gray-900">New Subtotal:</span>
                <span className="text-lg text-green-600">
                  ₹{(currentSubtotal - previewDiscount()).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={!discountValue || parseFloat(discountValue) <= 0}
            className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600"
          >
            Apply Discount
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
