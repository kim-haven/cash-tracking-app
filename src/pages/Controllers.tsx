import React from "react";
import { controllers } from "../data/mockData";

const Users: React.FC = () => {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-6">Users</h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Role</th>
            </tr>
          </thead>

          <tbody>
            {controllers.map((controllers) => (
              <tr key={controllers.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium">{controllers.name}</td>
                <td className="px-6 py-4 text-gray-500">{controllers.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;