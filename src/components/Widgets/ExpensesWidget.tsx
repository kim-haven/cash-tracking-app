import React from "react";
import { stats } from "../../data/mockData";

const ExpenseWidget: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-sm text-gray-500">Expenses</h3>
      <p className="text-3xl font-bold text-red-600 mt-2">
        ${stats.expense}
      </p>
      <p className="text-xs text-red-500 mt-2">
        % growth
      </p>
    </div>
  );
};

export default ExpenseWidget;