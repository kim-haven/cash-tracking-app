import React from "react";
import { useAuth } from "../context/AuthContext";
import { useUserPreferences } from "../context/UserPreferencesContext";
import { formatUserRoleLabel } from "../utils/userRoleLabel";

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { notificationsEnabled, setNotificationsEnabled } =
    useUserPreferences();

  const handleSave = () => {
    // Preferences persist immediately on toggle; Save confirms for the user.
    alert("Settings saved.");
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
        Settings
      </h2>

      {/* Profile Settings */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
          Profile
        </h3>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col text-sm text-gray-700 dark:text-gray-300">
            Username
            <input
              type="text"
              value={user?.name ?? ""}
              disabled
              readOnly
              autoComplete="off"
              className="mt-1 cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200"
            />
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Name is managed by your account. Role:{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {user?.role ? formatUserRoleLabel(user.role) : "—"}
            </span>
          </p>
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-gray-100">
          Preferences
        </h3>
        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between gap-4 text-gray-700 dark:text-gray-200">
            <span>Enable notifications</span>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={() => setNotificationsEnabled(!notificationsEnabled)}
              className="h-5 w-5 accent-blue-500"
            />
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            When off, the header does not load or show notifications. Theme
            (light / dark) is toggled with the switch next to the bell in the
            header.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="rounded-xl bg-blue-600 px-6 py-2 font-semibold text-white transition hover:bg-blue-700"
      >
        Save settings
      </button>
    </div>
  );
};

export default Settings;
