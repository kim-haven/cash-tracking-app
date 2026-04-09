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
      className={`flex min-w-0 w-full max-w-sm items-center rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-300 dark:border-slate-600 dark:bg-slate-900 dark:focus-within:ring-blue-600/40 sm:w-80 sm:max-w-none ${className}`}
    >
      <Search size={16} className="text-gray-400 dark:text-gray-500" />
      <input
        type="search"
        autoComplete="off"
        enterKeyHint="search"
        placeholder={placeholder}
        className="ml-2 w-full bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400 dark:text-gray-100 dark:placeholder-gray-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
      />
    </div>
  );
};

export default SearchBar;