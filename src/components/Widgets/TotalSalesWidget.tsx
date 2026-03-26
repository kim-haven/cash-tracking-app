import React from "react";
import { stats } from "../../data/mockData";

const UserWidget: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-sm text-gray-500">Total Sales</h3>
      <p className="text-3xl font-bold mt-2">{stats.users}</p>
      <p className="text-xs text-green-500 mt-2">
        +12% from last month
      </p>
    </div>
  );
};

export default UserWidget;