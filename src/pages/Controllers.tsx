import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  ASSIGNABLE_USER_ROLES,
  deleteAdminUser,
  fetchUsers,
  updateUserRole,
  type AssignableUserRole,
} from "../api/usersApi";
import type { AuthUser } from "../api/authApi";
import { broadcastRoleMaybeChanged } from "../constants/authBroadcast";
import { dispatchNotificationsRefetch } from "../constants/notificationEvents";
import { formatUserRoleLabel } from "../utils/userRoleLabel";

const selectClass =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

/** Filter user list for admin / super admin monitoring (client-side). */
type UserListRoleFilter = "all" | "admin" | "manager" | "user";

const ROLE_FILTER_OPTIONS: readonly {
  value: UserListRoleFilter;
  label: string;
}[] = [
  { value: "all", label: "All users" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "user", label: "User" },
];

function isElevatedRole(role: string): boolean {
  return role === "admin" || role === "superadmin";
}

function canEditUserRole(
  actor: { id: number; role: string } | null,
  target: { role: string }
): boolean {
  if (!actor) return false;
  if (target.role === "superadmin") return false;
  if (isElevatedRole(target.role)) return actor.role === "superadmin";
  return actor.role === "admin" || actor.role === "superadmin";
}

function canDeleteUser(
  actor: { id: number; role: string } | null,
  target: { id: number; role: string }
): boolean {
  if (!actor) return false;
  if (actor.id === target.id) return false;
  if (isElevatedRole(target.role)) return actor.role === "superadmin";
  return actor.role === "admin" || actor.role === "superadmin";
}

const UserManagement: React.FC = () => {
  const { user: currentUser, applyRemoteUserUpdate } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<UserListRoleFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleEditUser, setRoleEditUser] = useState<AuthUser | null>(null);
  const [roleDraft, setRoleDraft] = useState<AssignableUserRole>("user");
  const [roleModalError, setRoleModalError] = useState<string | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);

  const [deleteUser, setDeleteUser] = useState<AuthUser | null>(null);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const roleSelectOptions = useMemo((): readonly AssignableUserRole[] => {
    return currentUser?.role === "superadmin"
      ? [...ASSIGNABLE_USER_ROLES]
      : (["manager", "user"] as const);
  }, [currentUser?.role]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchUsers();
      setUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredUsers = useMemo(() => {
    if (roleFilter === "all") return users;
    return users.filter((u) => u.role === roleFilter);
  }, [users, roleFilter]);

  const openRoleModal = useCallback(
    (u: AuthUser) => {
      setRoleModalError(null);
      setRoleEditUser(u);
      const preferred = ASSIGNABLE_USER_ROLES.includes(
        u.role as AssignableUserRole
      )
        ? (u.role as AssignableUserRole)
        : "user";
      const allowed = roleSelectOptions as readonly string[];
      setRoleDraft(
        allowed.includes(preferred)
          ? preferred
          : ("user" as AssignableUserRole)
      );
    },
    [roleSelectOptions]
  );

  const closeRoleModal = () => {
    if (roleSaving) return;
    setRoleEditUser(null);
    setRoleModalError(null);
  };

  const submitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleEditUser) return;
    setRoleModalError(null);
    setRoleSaving(true);
    try {
      const updated = await updateUserRole(roleEditUser.id, roleDraft);
      setUsers((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row))
      );
      if (Number(updated.id) === Number(currentUser?.id)) {
        applyRemoteUserUpdate(updated);
      } else {
        broadcastRoleMaybeChanged(updated.id);
      }
      dispatchNotificationsRefetch();
      setRoleEditUser(null);
    } catch (err) {
      setRoleModalError(
        err instanceof Error ? err.message : "Failed to update role."
      );
    } finally {
      setRoleSaving(false);
    }
  };

  const openDeleteModal = (u: AuthUser) => {
    setDeleteModalError(null);
    setDeleteUser(u);
  };

  const closeDeleteModal = () => {
    if (deleteSubmitting) return;
    setDeleteUser(null);
    setDeleteModalError(null);
  };

  const submitDelete = async () => {
    if (!deleteUser) return;
    setDeleteModalError(null);
    setDeleteSubmitting(true);
    try {
      await deleteAdminUser(deleteUser.id);
      setUsers((prev) => prev.filter((row) => row.id !== deleteUser.id));
      setDeleteUser(null);
    } catch (err) {
      setDeleteModalError(
        err instanceof Error ? err.message : "Failed to delete user."
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            User management
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Accounts registered in the system
          </p>
        </div>
        <div className="flex min-w-44 flex-col gap-1">
          <label
            htmlFor="user-list-role-filter"
            className="text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            View by role
          </label>
          <select
            id="user-list-role-filter"
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as UserListRoleFilter)
            }
            disabled={loading}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-200"
          >
            {ROLE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-600/80 dark:bg-slate-900/90 dark:shadow-black/30">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-slate-800/95 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3 text-left">Username</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/80">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="bg-white px-6 py-10 text-center text-gray-500 dark:bg-slate-900/40 dark:text-gray-400"
                  >
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="bg-white px-6 py-10 text-center text-gray-500 dark:bg-slate-900/40 dark:text-gray-400"
                  >
                    No users found.
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="bg-white px-6 py-10 text-center text-gray-500 dark:bg-slate-900/40 dark:text-gray-400"
                  >
                    No accounts with this role. Try &quot;All users&quot; to
                    see everyone (including super admins).
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const canEdit = canEditUserRole(currentUser ?? null, u);
                  const canDelete = canDeleteUser(currentUser ?? null, u);
                  return (
                    <tr
                      key={u.id}
                      className="bg-white transition hover:bg-gray-50 dark:bg-slate-900/40 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                        {u.name}
                        {isSelf ? (
                          <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
                            (you)
                          </span>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {formatUserRoleLabel(u.role)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={!canEdit}
                            title={
                              !canEdit
                                ? u.role === "superadmin"
                                  ? "Super admin role cannot be changed"
                                  : isElevatedRole(u.role)
                                    ? "Only the super admin can change roles for administrators"
                                    : "You cannot edit this role"
                                : "Edit role"
                            }
                            onClick={() => openRoleModal(u)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                            Edit role
                          </button>
                          <button
                            type="button"
                            disabled={!canDelete}
                            title={
                              isSelf
                                ? "You cannot delete your own account"
                                : !canDelete && isElevatedRole(u.role)
                                  ? "Only the super admin can delete administrator accounts"
                                  : "Delete user"
                            }
                            onClick={() => openDeleteModal(u)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/60 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {roleEditUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-role-edit-title"
        >
          <div className="light-form-modal w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="user-role-edit-title"
              className="text-lg font-semibold text-gray-900"
            >
              Edit role
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {roleEditUser.name} ({roleEditUser.email})
            </p>

            <form onSubmit={(e) => void submitRole(e)} className="mt-4 space-y-4">
              {roleModalError ? (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {roleModalError}
                </div>
              ) : null}

              <label className="block text-sm font-medium text-gray-700">
                Role
                <select
                  className={selectClass}
                  value={roleDraft}
                  onChange={(e) =>
                    setRoleDraft(e.target.value as AssignableUserRole)
                  }
                >
                  {roleSelectOptions.map((r) => (
                    <option key={r} value={r}>
                      {formatUserRoleLabel(r)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRoleModal}
                  disabled={roleSaving}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleSaving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {roleSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-delete-title"
        >
          <div className="light-form-modal w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2
              id="user-delete-title"
              className="text-lg font-semibold text-gray-900"
            >
              Delete user
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Permanently remove{" "}
              <span className="font-medium text-gray-900">
                {deleteUser.name}
              </span>{" "}
              ({deleteUser.email})? This cannot be undone.
            </p>

            {deleteModalError ? (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              >
                {deleteModalError}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteSubmitting}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitDelete()}
                disabled={deleteSubmitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteSubmitting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UserManagement;
