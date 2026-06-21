import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { CheckCircle2, Download, Printer, ShoppingCart, X } from "lucide-react";
import { jsPDF } from "jspdf";
import { useAuth } from "../Auth/AuthContext";
import { useBranch } from "../Branches/BranchContext";

// Brand shown on every receipt/invoice. (Settings has no persisted store
// config yet, so this is the single source of the company name.)
const COMPANY_NAME = "Tea Spot";
// Accent used for the PDF header band + logo (matches the app's #0284C7).
const ACCENT: [number, number, number] = [2, 132, 199];

interface ReceiptItem {
  name: string;
  qty?: number;
  quantity?: number;
  price?: number;
  unit_price?: number;
  subtotal?: number;
  variantName?: string | null;
}

interface ReceiptData {
  orderId: string;
  items: ReceiptItem[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  paymentMethod?: string;
  transactionId?: string;
  timestamp?: string;
  orderType?: 'dine-in' | 'takeaway';
}

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

export function ReceiptModal({ open, onClose, receipt }: ReceiptModalProps) {
  const { user } = useAuth();
  const { branches, selectedBranchId } = useBranch();

  // Resolve the branch this receipt belongs to: the selected branch for
  // super_admin, or the user's own branch for admin/staff (BranchContext
  // pins selectedBranchId to user.branchId for them).
  const branchId = selectedBranchId || user?.branchId || null;
  const branch = branches.find((b) => b._id === branchId) || null;
  // The address field is usually the full postal address (often already
  // includes the city), so prefer it and only fall back to city.
  const addressLine = branch?.address?.trim() || branch?.city?.trim() || "";

  if (!receipt) return null;

  const handlePrint = () => window.print();

  const handleDownload = () => {
    // jsPDF's built-in fonts don't include the ₹ glyph, so amounts use "Rs.".
    const money = (n?: number) => `Rs. ${(Number(n) || 0).toFixed(2)}`;

    const doc = new jsPDF({ unit: "pt", format: "a5" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 36;
    const left = margin;
    const right = pageW - margin;

    // --- Header band with logo + company name ---
    doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.rect(0, 0, pageW, 96, "F");
    // logo badge (white circle + "TS" monogram)
    doc.setFillColor(255, 255, 255);
    doc.circle(pageW / 2, 32, 15, "F");
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TS", pageW / 2, 37, { align: "center" });
    // company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(COMPANY_NAME, pageW / 2, 70, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Tax Invoice / Bill of Supply", pageW / 2, 86, { align: "center" });

    // --- Branch details ---
    let y = 120;
    if (branch?.name) {
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(branch.name, pageW / 2, y, { align: "center" });
      y += 14;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    if (addressLine) {
      doc.text(addressLine, pageW / 2, y, { align: "center" });
      y += 12;
    }
    if (branch?.phone) {
      doc.text(`Ph: ${branch.phone}`, pageW / 2, y, { align: "center" });
      y += 12;
    }
    if (receipt.timestamp) {
      doc.text(new Date(receipt.timestamp).toLocaleString(), pageW / 2, y, {
        align: "center",
      });
      y += 12;
    }
    if (receipt.orderType) {
      doc.text(
        `Type: ${receipt.orderType === "dine-in" ? "Dine-in" : "Takeaway"}`,
        pageW / 2,
        y,
        { align: "center" }
      );
      y += 12;
    }
    y += 8;

    const rule = () => {
      doc.setDrawColor(210);
      doc.setLineWidth(0.5);
      doc.line(left, y, right, y);
      y += 16;
    };
    const ensureSpace = (needed = 16) => {
      if (y + needed > pageH - 40) {
        doc.addPage();
        y = 50;
      }
    };
    const row = (label: string, value: string, bold = false) => {
      ensureSpace();
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.text(label, left, y);
      doc.text(value, right, y, { align: "right" });
      y += 14;
    };

    rule();

    // --- Meta ---
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    row("Order ID:", receipt.orderId ?? "");
    if (receipt.paymentMethod) row("Payment:", receipt.paymentMethod.replace("_", " "));
    if (receipt.transactionId) {
      row("Transaction ID:", `${receipt.transactionId.substring(0, 12)}...`);
    }
    rule();

    // --- Items ---
    doc.setTextColor(40, 40, 40);
    row("Item", "Amount", true);
    receipt.items?.forEach((item) => {
      const price = Number(item.price ?? item.unit_price ?? 0) || 0;
      const qty = Number(item.qty ?? item.quantity ?? 1);
      const subtotal = Number(item.subtotal ?? price * qty) || 0;
      let name = item.name || "Unnamed Item";
      if (item.variantName) name += ` (${item.variantName})`;
      if (qty > 1) name += ` x${qty}`;

      const wrapped = doc.splitTextToSize(name, right - left - 80) as string[];
      ensureSpace(14 * wrapped.length);
      doc.setFont("helvetica", "normal");
      doc.text(wrapped, left, y);
      doc.text(money(subtotal), right, y, { align: "right" });
      y += 14 * wrapped.length;
    });
    rule();

    // --- Totals ---
    row("Subtotal:", money(receipt.subtotal));
    row("Tax:", money(receipt.tax));
    if (receipt.discount && receipt.discount > 0) {
      row("Discount:", `-${money(receipt.discount)}`);
    }
    y += 4;
    ensureSpace(30);
    // highlighted total bar
    doc.setFillColor(240, 249, 255);
    doc.rect(left, y - 12, right - left, 24, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.text("Total:", left + 6, y + 4);
    doc.text(money(receipt.total), right - 6, y + 4, { align: "right" });
    y += 32;

    // --- Footer ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text("Thank you for your business!", pageW / 2, y, { align: "center" });
    y += 12;
    doc.text("Please visit again", pageW / 2, y, { align: "center" });

    doc.save(`receipt-${receipt.orderId}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="backdrop-blur-xl bg-white/90 border-white/40 text-gray-900 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col items-center mb-1">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-xl">Payment Successful!</DialogTitle>
            <DialogDescription>Your order has been confirmed</DialogDescription>
          </div>
        </DialogHeader>

        <div className="receipt-content bg-white text-gray-900 p-4 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center mb-3">
            {/* Logo badge */}
            <div
              className="receipt-logo mx-auto mb-1 rounded-full bg-gradient-to-br from-[#7DD3FC] to-[#0284C7] flex items-center justify-center shrink-0"
              style={{ width: "3rem", height: "3rem" }}
            >
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg mb-0.5 font-semibold">{COMPANY_NAME}</h3>
            {branch?.name && (
              <p className="text-sm text-gray-700">{branch.name}</p>
            )}
            {addressLine && (
              <p className="text-xs text-gray-500">{addressLine}</p>
            )}
            {branch?.phone && (
              <p className="text-xs text-gray-500">Ph: {branch.phone}</p>
            )}
            <p className="text-sm text-gray-600 mt-1">Tax Invoice / Bill of Supply</p>
            <p className="text-xs text-gray-500">
              {receipt.timestamp
                ? new Date(receipt.timestamp).toLocaleString()
                : ""}
              {receipt.orderType
                ? ` · ${receipt.orderType === 'dine-in' ? '🍵 Dine-in' : '🥡 Takeaway'}`
                : ""}
            </p>
          </div>

          <Separator className="my-2" />

          <div className="space-y-1 mb-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID:</span>
              <span className="font-mono">{receipt.orderId}</span>
            </div>
            {receipt.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-gray-600">Payment:</span>
                <span className="capitalize">
                  {receipt.paymentMethod.replace("_", " ")}
                </span>
              </div>
            )}
            {receipt.transactionId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-xs">
                  {receipt.transactionId.substring(0, 12)}...
                </span>
              </div>
            )}
          </div>

          <Separator className="my-2" />

          {/* ✅ Items list - safe */}
          <div className="space-y-2 mb-3 text-sm">
            <div className="flex justify-between font-medium border-b pb-1">
              <span>Item</span>
              <span>Amount</span>
            </div>
            {receipt.items?.map((item, i) => {
              const price =
                Number(item.price ?? item.unit_price ?? 0) || 0;
              const qty = Number(item.qty ?? item.quantity ?? 1);
              const subtotal =
                Number(item.subtotal ?? price * qty) || 0;

              return (
                <div key={i} className="flex justify-between py-1">
                  <span>
                    {item.name || "Unnamed Item"}
                    {item.variantName ? ` (${item.variantName})` : ""}
                    {qty > 1 ? ` ×${qty}` : ""}
                  </span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <Separator className="my-2" />

          {/* ✅ Totals Section */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>₹{(receipt.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span>₹{(receipt.tax || 0).toFixed(2)}</span>
            </div>
            {(receipt.discount ?? 0) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-₹{(receipt.discount ?? 0).toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-medium pt-1">
              <span>Total:</span>
              <span className="text-green-600">
                ₹{(receipt.total || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-3 text-center text-xs text-gray-500">
            <p>Thank you for your business!</p>
            <p>Please visit again</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-3">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>

        <div className="flex gap-3 mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600"
          >
            New Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ✅ Print styles (auto-applied globally)
if (typeof window !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @media print {
      body * {
        visibility: hidden;
      }
      .receipt-content, .receipt-content * {
        visibility: visible;
      }
      .receipt-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      /* Ensure the logo badge's gradient prints */
      .receipt-logo {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `;
  document.head.appendChild(style);
}
