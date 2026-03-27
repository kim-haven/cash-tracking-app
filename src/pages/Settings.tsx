import React, { useState } from "react";

const Settings: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [username, setUsername] = useState("John Doe");

  const handleSave = () => {
    alert("Settings saved!");
    // Here you can add logic to save settings
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Settings</h2>

      {/* Profile Settings */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Profile</h3>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col">
            <span className="text-gray-700">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Preferences</h3>
        <div className="flex flex-col gap-4">
          <label className="flex items-center justify-between">
            <span className="text-gray-700">Enable Notifications</span>
            <input
              type="checkbox"
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
              className="w-5 h-5 accent-blue-500"
            />
          </label>

          <label className="flex items-center justify-between">
            <span className="text-gray-700">Dark Mode</span>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              className="w-5 h-5 accent-blue-500"
            />
          </label>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-xl hover:bg-blue-700 transition"
      >
        Save Settings
      </button>
    </div>
  );
};

export default Settings;