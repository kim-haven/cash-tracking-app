import React from "react";
import { Bell } from "lucide-react";

const Header: React.FC = () => {
  return (
    <div className="w-full flex justify-between items-center bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
      
      {/* Right */}
      <div className="flex items-center gap-4 ml-auto">
        
        {/* Bell with notification */}
        <div className="relative cursor-pointer">
          <Bell className="text-gray-500" />

          {/* Red notification dot */}
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </div>

        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
          A
        </div>
      </div>
    </div>
  );
};

export default Header;