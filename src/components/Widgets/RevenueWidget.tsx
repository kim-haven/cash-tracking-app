import React from "react";
import { stats } from "../../data/mockData";

const RevenueWidget: React.FC = () => {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/20">
      <h3 className="text-sm text-gray-500 dark:text-gray-400">Revenue</h3>
      <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
        ${stats.revenue}
      </p>
      <p className="mt-2 text-xs text-green-500 dark:text-green-500/90">
        +8% growth
      </p>
    </div>
  );
};

export default RevenueWidget;