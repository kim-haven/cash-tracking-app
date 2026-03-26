import React from "react";
import TotalSalesWidget from "../components/Widgets/TotalSalesWidget";
import RevenueWidget from "../components/Widgets/RevenueWidget";
import ExpenseWidget from "../components/Widgets/ExpensesWidget";
import GraphChart from "../components/Charts/GraphChart";

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <TotalSalesWidget />
        <ExpenseWidget />
        <RevenueWidget />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Analytics</h3>
        <GraphChart />
      </div>

      
    </div>
  );
};

export default Dashboard;