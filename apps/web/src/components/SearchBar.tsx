interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  isLoading: boolean;
}

import { Search } from "lucide-react";

export function SearchBar({
  query,
  onQueryChange,
  isLoading
}: SearchBarProps) {
  return (
    <div className="search-bar-wrapper" style={{ position: 'relative', width: '100%', maxWidth: '800px' }}>
      <Search 
        size={20} 
        style={{ 
          position: 'absolute', 
          left: '16px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          color: 'var(--text-muted)',
          pointerEvents: 'none'
        }} 
      />
      <input
        id="search-query"
        type="search"
        value={query}
        placeholder={isLoading ? "Searching..." : "Search for cat, dog, friends, vacation..."}
        onChange={(event) => onQueryChange(event.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px 12px 48px',
          fontSize: '1rem',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          color: 'var(--text-main)',
          outline: 'none',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.boxShadow = '0 0 0 3px rgba(141, 114, 204, 0.2)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border)';
          e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }}
      />
    </div>
  );
}

