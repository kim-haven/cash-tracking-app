import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { SummaryScopeProvider } from "../context/SummaryScopeContext";
import { StoreProvider } from "../context/StoreContext";
import { UserPreferencesProvider } from "../context/UserPreferencesContext";

const Layout: React.FC = () => {
  return (
    <SummaryScopeProvider>
      <StoreProvider>
        <UserPreferencesProvider>
          <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-slate-950">
            {/* Sidebar */}
            <div className="hidden h-full w-64 md:block">
              <Sidebar />
            </div>

            {/* Main content area — min-w-0 lets wide tables scroll inside rather than clipping */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="shrink-0">
                <Header />
              </div>

              <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 p-6 dark:bg-slate-950 dark:text-gray-100">
                <Outlet />
              </main>
            </div>
          </div>
        </UserPreferencesProvider>
      </StoreProvider>
    </SummaryScopeProvider>
  );
};

export default Layout;