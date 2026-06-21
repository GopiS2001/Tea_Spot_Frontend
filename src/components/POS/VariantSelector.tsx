import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

export interface Variant {
  _id: string;
  name: string;
  price: number;
}

interface VariantSelectorItem {
  id: string;
  name: string;
  variants: Variant[];
}

interface VariantSelectorProps {
  open: boolean;
  item: VariantSelectorItem | null;
  onSelect: (variant: Variant) => void;
  onClose: () => void;
}

export function VariantSelector({ open, item, onSelect, onClose }: VariantSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Select Size{item ? ` — ${item.name}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {item?.variants.map((variant) => (
            <Button
              key={variant._id}
              variant="outline"
              className="w-full justify-between h-12 text-base"
              onClick={() => onSelect(variant)}
            >
              <span>{variant.name}</span>
              <span className="text-sky-600">₹{variant.price.toFixed(2)}</span>
            </Button>
          ))}
        </div>
        <Button variant="ghost" className="w-full" onClick={onClose}>
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
