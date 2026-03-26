import React from "react";
import { stats } from "../../data/mockData";

const RevenueWidget: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-sm text-gray-500">Revenue</h3>
      <p className="text-3xl font-bold text-green-600 mt-2">
        ${stats.revenue}
      </p>
      <p className="text-xs text-green-500 mt-2">
        +8% growth
      </p>
    </div>
  );
};

export default RevenueWidget;