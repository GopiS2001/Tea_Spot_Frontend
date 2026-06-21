import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Building2,
  IndianRupee,
  ShoppingCart,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Label } from "../ui/label";
import { useAuth } from "../Auth/AuthContext";
import { useBranch, Branch } from "./BranchContext";
import { apiFetch } from "../../utils/api";
import { toast } from "sonner@2.0.3";

interface BranchStats {
  branchId: string;
  ordersToday: number;
  revenueToday: number;
  staffCount: number;
}

const emptyForm = { name: "", city: "", address: "", phone: "" };

export function BranchManagement() {
  const { accessToken, isSuperAdmin } = useAuth();
  const { branches, refreshBranches, isLoading } = useBranch();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [selectedRow, setSelectedRow] = useState<Branch | null>(null);
  const [stats, setStats] = useState<BranchStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (b: Branch) => {
    setEditingId(b._id);
    setForm({
      name: b.name || "",
      city: b.city || "",
      address: b.address || "",
      phone: b.phone || "",
    });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Branch name is required");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await apiFetch(`/branches/${editingId}`, accessToken, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        toast.success("Branch updated");
      } else {
        await apiFetch(`/branches`, accessToken, {
          method: "POST",
          body: JSON.stringify(form),
        });
        toast.success("Branch created");
      }
      setDialogOpen(false);
      await refreshBranches();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save branch");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (b: Branch) => {
    try {
      if (b.active) {
        await apiFetch(`/branches/${b._id}`, accessToken, { method: "DELETE" });
        toast.success(`${b.name} deactivated`);
      } else {
        await apiFetch(`/branches/${b._id}`, accessToken, {
          method: "PUT",
          body: JSON.stringify({ active: true }),
        });
        toast.success(`${b.name} activated`);
      }
      await refreshBranches();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update branch");
    }
  };

  const loadStats = useCallback(
    async (branchId: string) => {
      setStatsLoading(true);
      setStats(null);
      try {
        const data = await apiFetch(
          `/branches/${branchId}/stats`,
          accessToken
        );
        setStats(data);
      } catch (err: any) {
        toast.error(err?.message || "Failed to load branch stats");
      } finally {
        setStatsLoading(false);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    if (selectedRow) loadStats(selectedRow._id);
  }, [selectedRow?._id, loadStats]);

  if (!isSuperAdmin) {
    return (
      <div className="text-muted-foreground">
        You do not have permission to manage branches.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Building2 className="w-6 h-6" /> Branches
          </h1>
          <p className="text-muted-foreground">
            Manage your outlets and view per-branch performance
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Add Branch
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && branches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Loading branches...
                    </TableCell>
                  </TableRow>
                ) : branches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No branches yet. Click "Add Branch" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  branches.map((b) => (
                    <TableRow
                      key={b._id}
                      className={`cursor-pointer ${
                        selectedRow?._id === b._id ? "bg-muted/30" : ""
                      }`}
                      onClick={() => setSelectedRow(b)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {b.name}
                          {!b.active && (
                            <Badge variant="outline" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{b.city || "—"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {b.address || "—"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={!!b.active}
                          onCheckedChange={() => toggleActive(b)}
                        />
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(b)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Stats panel */}
        <div>
          <Card className="p-6 h-full">
            {selectedRow ? (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3>{selectedRow.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedRow.city || "—"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedRow(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {statsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading stats…</div>
                ) : stats ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-5 h-5 text-[#7DD3FC]" />
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Orders today
                        </div>
                        <div className="text-lg">{stats.ordersToday}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <IndianRupee className="w-5 h-5 text-[#BBF7D0]" />
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Revenue today
                        </div>
                        <div className="text-lg">
                          ₹{stats.revenueToday.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <UsersIcon className="w-5 h-5 text-[#FBCFE8]" />
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Active staff
                        </div>
                        <div className="text-lg">{stats.staffCount}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No stats available
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground h-full flex items-center justify-center text-center">
                Select a branch on the left to view today's stats.
              </div>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Branch" : "Add Branch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tea Spot - RS Puram"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Coimbatore"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, area, landmarks"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 ..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? "Saving…" : editingId ? "Save Changes" : "Create Branch"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
