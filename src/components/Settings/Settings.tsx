import { useEffect, useState } from "react";
import { Settings as SettingsIcon, IndianRupee, Printer, Banknote, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useAuth } from "../Auth/AuthContext";
import { useBranch } from "../Branches/BranchContext";
import { useSettings, useUpdateSettings } from "../../hooks/useApi";
import type { OperatingHour } from "../../types";
import { toast } from "sonner@2.0.3";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const defaultHours: OperatingHour[] = DAYS.map((day) => ({
  day,
  enabled: true,
  openTime: "09:00",
  closeTime: "22:00",
}));

interface SettingsForm {
  shopName: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: OperatingHour[];
  acceptCash: boolean;
  acceptUpi: boolean;
  taxName: string;
  taxRate: number;
  taxNumber: string;
  applyTaxToAllItems: boolean;
  printerName: string;
  printerIp: string;
  printerPort: string;
}

export function Settings() {
  const { isSuperAdmin } = useAuth();
  const { selectedBranchId } = useBranch();
  const needsBranch = isSuperAdmin && !selectedBranchId;

  const { data, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const settings = data?.settings;

  const [form, setForm] = useState<SettingsForm | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setForm({
      shopName: settings.shopName ?? "Tea Spot",
      address: settings.address ?? "",
      phone: settings.phone ?? "",
      email: settings.email ?? "",
      operatingHours:
        settings.operatingHours && settings.operatingHours.length
          ? settings.operatingHours
          : defaultHours,
      acceptCash: settings.acceptCash ?? true,
      acceptUpi: settings.acceptUpi ?? true,
      taxName: settings.taxName ?? "GST",
      taxRate: settings.taxRate ?? 0,
      taxNumber: settings.taxNumber ?? "",
      applyTaxToAllItems: settings.applyTaxToAllItems ?? false,
      printerName: settings.printerName ?? "",
      printerIp: settings.printerIp ?? "",
      printerPort: settings.printerPort ?? "9100",
    });
  }, [settings]);

  const set = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const setHour = (idx: number, patch: Partial<OperatingHour>) =>
    setForm((prev) =>
      prev
        ? {
            ...prev,
            operatingHours: prev.operatingHours.map((h, i) =>
              i === idx ? { ...h, ...patch } : h
            ),
          }
        : prev
    );

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await updateSettings.mutateAsync(form);
      toast.success("Settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (needsBranch) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Settings</h1>
          <p className="text-muted-foreground">Configure your shop preferences</p>
        </div>
        <Card className="p-8 text-center text-muted-foreground">
          Select a branch in the top bar to view and edit its settings.
        </Card>
      </div>
    );
  }

  if (isLoading || !form) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Settings</h1>
          <p className="text-muted-foreground">Configure your shop preferences</p>
        </div>
        <div className="text-center py-12 text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Settings</h1>
          <p className="text-muted-foreground">Configure your shop preferences</p>
        </div>
        <Button
          className="bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="printer">Printer</TabsTrigger>
        </TabsList>

        {/* ---------------- GENERAL ---------------- */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Shop Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Shop Name</Label>
                <Input value={form.shopName} onChange={(e) => set("shopName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.operatingHours.map((h, i) => (
                <div
                  key={h.day}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={h.enabled}
                      onCheckedChange={(v) => setHour(i, { enabled: v })}
                    />
                    <span className="text-sm w-24">{h.day}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      className="w-32"
                      type="time"
                      value={h.openTime}
                      disabled={!h.enabled}
                      onChange={(e) => setHour(i, { openTime: e.target.value })}
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      className="w-32"
                      type="time"
                      value={h.closeTime}
                      disabled={!h.enabled}
                      onChange={(e) => setHour(i, { closeTime: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accepted Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Banknote className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className="text-sm">Accept Cash</div>
                    <div className="text-xs text-muted-foreground">
                      Show the Cash option on the POS
                    </div>
                  </div>
                </div>
                <Switch
                  checked={form.acceptCash}
                  onCheckedChange={(v) => set("acceptCash", v)}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-purple-500" />
                  <div>
                    <div className="text-sm">Accept UPI</div>
                    <div className="text-xs text-muted-foreground">
                      Show the UPI option on the POS
                    </div>
                  </div>
                </div>
                <Switch checked={form.acceptUpi} onCheckedChange={(v) => set("acceptUpi", v)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- TAX ---------------- */}
        <TabsContent value="tax" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5" />
                Tax Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tax Name</Label>
                <Input
                  value={form.taxName}
                  onChange={(e) => set("taxName", e.target.value)}
                  placeholder="GST"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.taxRate}
                    onChange={(e) => set("taxRate", Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax Number (optional)</Label>
                  <Input
                    value={form.taxNumber}
                    onChange={(e) => set("taxNumber", e.target.value)}
                    placeholder="GSTIN"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <div className="text-sm">Apply tax to all items</div>
                  <div className="text-xs text-muted-foreground">
                    Automatically include tax in all orders
                  </div>
                </div>
                <Switch
                  checked={form.applyTaxToAllItems}
                  onCheckedChange={(v) => set("applyTaxToAllItems", v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- PRINTER ---------------- */}
        <TabsContent value="printer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Thermal Printer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Printer Name</Label>
                <Input
                  value={form.printerName}
                  onChange={(e) => set("printerName", e.target.value)}
                  placeholder="Kitchen Printer #1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IP Address</Label>
                  <Input
                    value={form.printerIp}
                    onChange={(e) => set("printerIp", e.target.value)}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input
                    value={form.printerPort}
                    onChange={(e) => set("printerPort", e.target.value)}
                    placeholder="9100"
                  />
                </div>
              </div>
              <Button variant="outline" onClick={() => toast.info("Test print sent to printer")}>
                Test Print
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
