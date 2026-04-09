/** Human-readable role for UI (matches Header / User Management). */
export function formatUserRoleLabel(role: string): string {
  if (role === "superadmin") return "Super admin";
  if (role === "admin") return "Admin";
  if (role === "manager") return "Manager";
  if (role === "user") return "User";
  return role;
}
