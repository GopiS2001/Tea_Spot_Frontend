import React, { useState } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { User, Shield, Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function MyAccount() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile(displayName, avatarUrl);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(user?.display_name || '');
    setAvatarUrl(user?.avatar || '');
    setIsEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
      case 'owner':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'admin':
      case 'manager':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'staff':
      case 'cashier':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">My Account</h1>
          <p className="text-muted-foreground">Manage your profile and account settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-border shadow-lg">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white text-2xl">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl text-foreground">{user.display_name}</h3>
                <Badge className={`${getRoleColor(user.role)} text-white border-0`}>
                  <Shield className="w-3 h-3" />
                  <span className="ml-1 capitalize">{user.role}</span>
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>@{user.username}</span>
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar URL</Label>
                <Input
                  id="avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Enter avatar image URL"
                />
                <p className="text-sm text-muted-foreground">
                  Paste a URL to your avatar image or leave empty for default
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button onClick={handleCancel} variant="outline" disabled={isLoading}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-border">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Username</Label>
                <p className="text-lg text-foreground">@{user.username}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Role</Label>
                <p className="text-lg capitalize text-foreground">{user.role}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Branch</Label>
                <p className="text-lg text-foreground">{user.branchName || '—'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Display Name</Label>
                <p className="text-lg text-foreground">{user.display_name}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-muted-foreground">User ID</Label>
                <p className="text-sm font-mono text-muted-foreground break-all">{user.id}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>Your role-based access permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(user.role === 'super_admin' || user.role === 'owner') && (
              <>
                <PermissionItem enabled text="Full system access" />
                <PermissionItem enabled text="Branch management" />
                <PermissionItem enabled text="User & role management" />
                <PermissionItem enabled text="Menu, inventory & categories" />
                <PermissionItem enabled text="All billing operations" />
                <PermissionItem enabled text="Analytics & reports" />
                <PermissionItem enabled text="Settings configuration" />
              </>
            )}
            {(user.role === 'admin' || user.role === 'manager') && (
              <>
                <PermissionItem enabled text="Branch-scoped data" />
                <PermissionItem enabled text="Manage staff users in own branch" />
                <PermissionItem enabled text="Menu, inventory & categories" />
                <PermissionItem enabled text="All billing operations" />
                <PermissionItem enabled text="Analytics & reports" />
                <PermissionItem enabled={false} text="Manage other branches" />
                <PermissionItem enabled={false} text="Create admin / super_admin users" />
              </>
            )}
            {(user.role === 'staff' || user.role === 'cashier') && (
              <>
                <PermissionItem enabled text="Create orders" />
                <PermissionItem enabled text="Apply discounts" />
                <PermissionItem enabled text="Split bills" />
                <PermissionItem enabled text="Process payments" />
                <PermissionItem enabled text="Park / resume orders" />
                <PermissionItem enabled={false} text="Inventory management" />
                <PermissionItem enabled={false} text="User management" />
                <PermissionItem enabled={false} text="Settings configuration" />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PermissionItem({ enabled, text }: { enabled: boolean; text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
      <div className={`w-2 h-2 rounded-full shrink-0 ${enabled ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
      <span className={enabled ? 'text-foreground' : 'text-muted-foreground line-through'}>{text}</span>
    </div>
  );
}
