import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 hidden md:block h-full">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Header stays fixed */}
        <div className="shrink-0">
          <Header />
        </div>

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;