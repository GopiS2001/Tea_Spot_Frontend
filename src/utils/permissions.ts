// View access map — mirrors the backend Role defaults.
// Used as a fallback for sidebar visibility when the Roles API isn't loaded.

export const defaultPermissions: Record<string, string[]> = {
  dashboard: ["super_admin", "admin"],
  pos: ["super_admin", "admin", "staff"],
  orders: ["super_admin", "admin", "staff"],
  menu: ["super_admin", "admin"],
  categories: ["super_admin", "admin"],
  inventory: ["super_admin", "admin"],
  users: ["super_admin", "admin"],
  roles: ["super_admin"],
  reports: ["super_admin", "admin"],
  specialOrders: ["super_admin", "admin"],
  branches: ["super_admin"],
  settings: ["super_admin", "admin"],
  profile: ["super_admin", "admin", "staff"],
  help: ["super_admin", "admin", "staff"],
};

const KNOWN_ROLES = ["super_admin", "admin", "staff"];

// Check if a user can access a view.
export const canAccess = (view: string, role: string): boolean => {
  return defaultPermissions[view]?.includes(role) ?? false;
};

// Sidebar visibility helper (static fallback).
// - Legacy/unknown roles (e.g. the seeded "user") see everything so they
//   aren't locked out before migration.
// - Views with no permission rule (e.g. the Admin/SaaS console) always show.
export const canShowMenu = (view: string, role?: string | null): boolean => {
  if (!role || !KNOWN_ROLES.includes(role)) return true;
  if (!(view in defaultPermissions)) return true;
  return canAccess(view, role);
};

// Live visibility helper — consults the per-role permissions saved via the
// Roles screen (GET /api/roles), and only falls back to the static map above
// when those haven't loaded yet or don't cover the view.
// `permsByRole` is keyed by role name → { [view]: boolean }.
export const canShowWithPermissions = (
  view: string,
  role: string | null | undefined,
  permsByRole: Record<string, Record<string, boolean>> | null | undefined
): boolean => {
  // Legacy/unknown roles see everything (pre-migration safety).
  if (!role || !KNOWN_ROLES.includes(role)) return true;
  // Super Admin always sees every screen; its role is non-editable.
  if (role === "super_admin") return true;

  const live = permsByRole?.[role];
  if (live && view in live) return !!live[view];

  // Not loaded yet, or a screen with no saved rule (e.g. the Admin/SaaS
  // console, which has no toggle) → fall back to the static defaults.
  return canShowMenu(view, role);
};

// Default landing view per role. Staff go straight to POS; everyone else
// lands on the dashboard.
export const getLandingView = (role?: string | null): string => {
  if (role === "staff") return "pos";
  return "dashboard";
};
