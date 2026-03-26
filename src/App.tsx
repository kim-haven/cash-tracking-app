import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import UpdateChecker from "./components/UpdateChecker";
import Dashboard from "./pages/Dashboard";
import Controllers from "./pages/Controllers";
import Settings from "./pages/Settings";
import CashTrack from "./pages/CashTrack";

const App: React.FC = () => {
  return (
    <Router>
      {/* 🔥 AUTO UPDATE COMPONENT */}
      <UpdateChecker />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/cashtrack" element={<CashTrack />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Controllers />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default App;