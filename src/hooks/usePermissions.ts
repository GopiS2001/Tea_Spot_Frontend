import { useCallback, useMemo } from "react";
import { useRoles } from "./useApi";
import { canShowWithPermissions } from "../utils/permissions";

interface RoleDoc {
  name: string;
  permissions: Record<string, boolean>;
}

// Bridges the live per-role permissions (saved via the Roles screen) into a
// `canShow(view, role)` check used by the sidebar and view-routing. Until the
// roles load, callers transparently fall back to the static defaults baked
// into permissions.ts.
export function usePermissions() {
  const { data, isLoading } = useRoles();

  const permsByRole = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    for (const r of (data?.roles as RoleDoc[]) || []) {
      map[r.name] = r.permissions || {};
    }
    return map;
  }, [data]);

  const loaded = !!data?.roles;

  const canShow = useCallback(
    (view: string, role?: string | null) =>
      canShowWithPermissions(view, role, loaded ? permsByRole : null),
    [loaded, permsByRole]
  );

  return { canShow, loaded, isLoading, permsByRole };
}
