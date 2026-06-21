import { useState, useEffect } from "react";
import { Shield, Save, RotateCcw, Lock } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Switch } from "../ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../Auth/AuthContext";
import { apiFetch } from "../../utils/api";
import { toast } from "sonner@2.0.3";

interface Role {
  _id?: string;
  name: string;
  permissions: Record<string, boolean>;
  isEditable?: boolean;
}

// Screens shown in the permission editor, in display order.
const SCREENS: { key: string; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "pos", label: "POS (Billing)" },
  { key: "orders", label: "Orders" },
  { key: "menu", label: "Menu Management" },
  { key: "categories", label: "Categories" },
  { key: "inventory", label: "Inventory" },
  { key: "users", label: "Users" },
  { key: "roles", label: "Roles" },
  { key: "reports", label: "Reports" },
  { key: "specialOrders", label: "Special Orders" },
  { key: "branches", label: "Branches" },
  { key: "settings", label: "Settings" },
  { key: "profile", label: "My Account" },
  { key: "help", label: "Help" },
];

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  staff: "Staff",
};

export function RoleManagement() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [roles, setRoles] = useState<Role[]>([]);
  const [activeRole, setActiveRole] = useState<string>("admin");
  // Working copy of permissions being edited, keyed by role name.
  const [draft, setDraft] = useState<Record<string, Record<string, boolean>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch("/roles", accessToken);
      const fetched: Role[] = data.roles || [];
      setRoles(fetched);
      setDraft(
        Object.fromEntries(
          fetched.map((r) => [r.name, { ...r.permissions }])
        )
      );
      if (fetched.length && !fetched.some((r) => r.name === activeRole)) {
        setActiveRole(fetched[0].name);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  };

  const currentRole = roles.find((r) => r.name === activeRole);
  const isLocked = activeRole === "super_admin" || currentRole?.isEditable === false;

  const toggle = (key: string, value: boolean) => {
    if (isLocked) return;
    setDraft((prev) => ({
      ...prev,
      [activeRole]: { ...prev[activeRole], [key]: value },
    }));
  };

  const handleReset = () => {
    if (!currentRole) return;
    setDraft((prev) => ({
      ...prev,
      [activeRole]: { ...currentRole.permissions },
    }));
    toast.info("Reverted unsaved changes");
  };

  const handleSave = async () => {
    if (isLocked) return;
    setIsSaving(true);
    try {
      const data = await apiFetch(`/roles/${activeRole}`, accessToken, {
        method: "PUT",
        body: JSON.stringify({ permissions: draft[activeRole] }),
      });
      // Sync the saved permissions back into the source-of-truth list.
      setRoles((prev) =>
        prev.map((r) =>
          r.name === activeRole ? { ...r, permissions: data.role.permissions } : r
        )
      );
      // Refresh the shared roles cache so the sidebar/routing (which read the
      // same ['roles'] query via usePermissions) pick up the change live.
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Permissions saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save permissions");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading roles...</div>
    );
  }

  const current = draft[activeRole] || {};

  return (
    <div className="space-y-6">
      <div>
        <h1>Roles &amp; Permissions</h1>
        <p className="text-muted-foreground">
          Control which screens each role can access
        </p>
      </div>

      <Tabs value={activeRole} onValueChange={setActiveRole}>
        <TabsList>
          {roles.map((r) => (
            <TabsTrigger key={r.name} value={r.name} className="gap-2">
              <Shield className="w-4 h-4" />
              {roleLabels[r.name] || r.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {roles.map((r) => (
          <TabsContent key={r.name} value={r.name} className="mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    Currently editing: {roleLabels[r.name] || r.name}
                  </span>
                  {isLocked && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Lock className="w-3.5 h-3.5" /> Read-only
                    </span>
                  )}
                </div>
              </div>

              <div className="divide-y divide-border border border-border rounded-lg">
                {SCREENS.map((screen) => (
                  <div
                    key={screen.key}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-sm">{screen.label}</span>
                    <Switch
                      checked={!!current[screen.key]}
                      onCheckedChange={(v) => toggle(screen.key, v)}
                      disabled={isLocked}
                    />
                  </div>
                ))}
              </div>

              {isLocked ? (
                <p className="text-sm text-muted-foreground mt-4">
                  Super Admin permissions are fixed and cannot be changed.
                </p>
              ) : (
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" className="gap-2" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </Button>
                  <Button
                    className="gap-2 bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
