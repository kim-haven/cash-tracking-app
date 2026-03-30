import React from "react";
import { Search } from "lucide-react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string; // optional additional styling
};

const SearchBar: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) => {
  return (
    <div
      className={`flex min-w-0 w-full max-w-sm items-center rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-300 sm:w-80 sm:max-w-none ${className}`}
    >
      <Search size={16} className="text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        className="bg-transparent outline-none ml-2 text-sm w-full placeholder-gray-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;