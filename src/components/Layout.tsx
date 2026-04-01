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

      {/* Main content area — min-w-0 lets wide tables scroll inside rather than clipping */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Header stays fixed */}
        <div className="shrink-0">
          <Header />
        </div>

        {/* Scrollable main content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;