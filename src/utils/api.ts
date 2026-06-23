export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

export function resolveImageUrl(image?: string) {
  if (!image) return "";
  if (image.startsWith("http") || image.startsWith("data:")) return image;
  if (image.startsWith("/uploads")) return `${SERVER_URL}${image}`;
  return image;
}

// For super_admin only: when a specific branch is picked in the Topbar, attach
// it as a query param so the backend's branchFilter scopes the response.
// Reads from localStorage to stay decoupled from the React tree, so existing
// callsites don't have to change signatures.
function appendBranchScope(path: string): string {
  try {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return path;
    const user = JSON.parse(rawUser);
    if (user?.role !== "super_admin") return path;

    const branchId = localStorage.getItem("selectedBranchId");
    if (!branchId) return path; // null = "All Branches"

    // Don't overwrite an explicit branchId already in the path.
    if (/[?&]branchId=/.test(path)) return path;
    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}branchId=${encodeURIComponent(branchId)}`;
  } catch {
    return path;
  }
}

export async function uploadFile(path: string, token: string | null | undefined, file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${appendBranchScope(path)}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      // ignore json parse errors
    }
    throw new Error(message);
  }

  return response.json();
}

// Downloads a CSV (or other file) response and triggers a browser save,
// reusing the same auth + branch-scoping rules as apiFetch.
export async function downloadFile(path: string, token: string | null | undefined, filename: string) {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${appendBranchScope(path)}`, { headers });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      // ignore json parse errors
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// `scopeBranch` controls whether the Topbar-selected branch is auto-attached
// as ?branchId= for super_admin. Cross-branch admin screens (e.g. Users, which
// has its own branch filter) pass `false` so the Topbar selection doesn't
// override their view.
export async function apiFetch(
  path: string,
  token?: string | null,
  options: RequestInit = {},
  scopeBranch: boolean = true
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const finalPath = scopeBranch ? appendBranchScope(path) : path;
  const response = await fetch(`${API_URL}${finalPath}`, { ...options, headers });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      // ignore json parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}
