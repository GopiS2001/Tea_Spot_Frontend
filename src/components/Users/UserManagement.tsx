import { useState, useEffect } from "react";
import { Plus, Search, Edit, UserX, UserCheck, Users as UsersIcon } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Label } from "../ui/label";
import { useAuth } from "../Auth/AuthContext";
import { useBranch } from "../Branches/BranchContext";
import { toast } from "sonner@2.0.3";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "../../hooks/useApi";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  active?: boolean;
  lastLogin?: string;
  createdAt?: string;
  branchId?: { _id: string; name: string; city?: string } | string | null;
}

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  staff: "Staff",
  user: "User",
};

const roleColors: Record<string, string> = {
  super_admin: "#C4B5FD",
  admin: "#7DD3FC",
  staff: "#BBF7D0",
  user: "#FDE68A",
};

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const { branches } = useBranch();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const isAdminOnly = currentUser?.role === "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [branchId, setBranchId] = useState("");
  const [active, setActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);

  // Debounce the search box before hitting the API.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data, isLoading } = useUsers({
    search: debouncedSearch.trim() || undefined,
    role: roleFilter,
    branchId: isSuperAdmin ? branchFilter : undefined,
  });
  const users: User[] = data?.users || [];

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const assignableRoles = isSuperAdmin
    ? ["super_admin", "admin", "staff"]
    : ["staff"];

  const openAddDialog = () => {
    setEditing(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("staff");
    setBranchId(isAdminOnly ? currentUser?.branchId || "" : "");
    setActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (u: User) => {
    setEditing(u);
    setName(u.name);
    setEmail(u.email);
    setPassword("");
    setRole(u.role);
    const existingBranchId =
      typeof u.branchId === "string" ? u.branchId : u.branchId?._id;
    setBranchId(isAdminOnly ? currentUser?.branchId || "" : existingBranchId || "");
    setActive(u.active !== false);
    setDialogOpen(true);
  };

  const branchRequired = isSuperAdmin && role !== "super_admin";

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (!editing && !password.trim()) {
      toast.error("Password is required for new users");
      return;
    }
    if (branchRequired && !branchId) {
      toast.error("Please select a branch");
      return;
    }

    setIsSaving(true);
    try {
      if (editing) {
        const body: any = { name: name.trim(), email: email.trim(), role, active };
        if (password.trim()) body.password = password.trim();
        // admin can't change branch — backend forces it anyway
        if (isSuperAdmin) body.branchId = role === "super_admin" ? null : branchId;
        await updateUser.mutateAsync({ id: editing._id, data: body });
        toast.success("User updated");
      } else {
        const body: any = {
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
        };
        // admin doesn't send branchId — backend forces it to their own branch
        if (isSuperAdmin && role !== "super_admin") body.branchId = branchId;
        await createUser.mutateAsync(body);
        toast.success("User added");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deleteUser.mutateAsync(deactivateTarget._id);
      toast.success("User deactivated");
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate user");
    } finally {
      setDeactivateTarget(null);
    }
  };

  const handleReactivate = async (u: User) => {
    try {
      await updateUser.mutateAsync({ id: u._id, data: { active: true } });
      toast.success("User reactivated");
    } catch (err: any) {
      toast.error(err.message || "Failed to reactivate user");
    }
  };

  const roleBadge = (r: string) => (
    <Badge style={{ backgroundColor: roleColors[r] || "#E5E7EB", color: "#000" }}>
      {roleLabels[r] || r}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Users</h1>
          <p className="text-muted-foreground">
            Add, edit, and deactivate people on your team
          </p>
        </div>
        <Button
          className="gap-2 bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black"
          onClick={openAddDialog}
        >
          <Plus className="w-4 h-4" />
          {isSuperAdmin ? "Add User" : "Add Staff"}
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input-background border-0"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
          {isSuperAdmin && (
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b._id} value={b._id}>
                    {b.name}
                    {b.city ? ` (${b.city})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
            <UsersIcon className="w-8 h-8 opacity-50" />
            No users found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {isSuperAdmin && <TableHead>Branch</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isActive = u.active !== false;
                return (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{roleBadge(u.role)}</TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        {u.role === "super_admin" ? (
                          <Badge style={{ backgroundColor: "#C4B5FD", color: "#000" }}>
                            All Branches
                          </Badge>
                        ) : (
                          (typeof u.branchId === "object" && u.branchId?.name) || "—"
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {isActive ? (
                        <Badge className="bg-[#BBF7D0] text-[#047857]">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                          onClick={() => openEditDialog(u)}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        {isActive ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-destructive"
                            onClick={() => setDeactivateTarget(u)}
                            disabled={u._id === currentUser?.id}
                          >
                            <UserX className="w-4 h-4" />
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-[#047857]"
                            onClick={() => handleReactivate(u)}
                          >
                            <UserCheck className="w-4 h-4" />
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{editing ? "New Password (leave blank to keep)" : "Password"}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={setRole}
                disabled={!isSuperAdmin}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabels[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div
              className="overflow-hidden transition-all duration-200"
              style={{ maxHeight: role === "super_admin" ? "0" : "200px" }}
            >
              {role !== "super_admin" && (
                <div className="space-y-2">
                  <Label>Branch</Label>
                  {isSuperAdmin ? (
                    <Select value={branchId} onValueChange={setBranchId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b._id} value={b._id}>
                            {b.name}
                            {b.city ? ` (${b.city})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={currentUser?.branchName || ""} disabled readOnly />
                  )}
                </div>
              )}
            </div>
            {role === "super_admin" && (
              <p className="text-sm text-muted-foreground">
                ℹ️ Super Admin has access to all branches
              </p>
            )}
            {editing && (
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={active} onCheckedChange={setActive} />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black"
                onClick={handleSave}
                disabled={isSaving || (branchRequired && !branchId)}
              >
                {editing ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate user?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deactivateTarget?.name}" will no longer be able to sign in. You can
              reactivate them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeactivate}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
