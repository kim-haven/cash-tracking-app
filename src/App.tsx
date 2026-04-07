import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import UpdateChecker from "./components/UpdateChecker";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Controllers from "./pages/Controllers";
import Settings from "./pages/Settings";
import CashTrack from "./pages/cashmanagement/CashOnHand";
import RegisterDrops from "./pages/cashmanagement/RegisterDrops";
import DropSafe from "./pages/cashmanagement/DropSafe";
import ChangeBank from "./pages/cashmanagement/ChangeBank";
import POSReconcile from "./pages/sales/POSReconcile";
import BlazeSummary from "./pages/sales/BlazeSummary";
import CashlessATM from "./pages/atm/CashlessATM";
import ATMReconcile from "./pages/atm/ATMReconcile";
import Expenses from "./pages/expenses/Expenses";
import Tips from "./pages/staff/Tips";

const App: React.FC = () => {
  return (
    <Router>
      {/* 🔥 AUTO UPDATE COMPONENT */}
      <UpdateChecker />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/cash-on-hand" element={<CashTrack />} />
            <Route path="/register-drops" element={<RegisterDrops />} />
            <Route path="/drop-safe" element={<DropSafe />} />
            <Route path="/change-bank" element={<ChangeBank />} />

            <Route path="/pos-reconcile" element={<POSReconcile />} />
            <Route path="/blaze-summary" element={<BlazeSummary />} />

            <Route path="/cashless-atm" element={<CashlessATM />} />
            <Route path="/atm-reconcile" element={<ATMReconcile />} />

            <Route path="/expenses" element={<Expenses />} />

            <Route path="/tips" element={<Tips />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Controllers />} />
            <Route path="/settings" element={<Settings />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;