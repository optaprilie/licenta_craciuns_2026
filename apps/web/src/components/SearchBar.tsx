interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  isLoading: boolean;
}

export function SearchBar({
  query,
  onQueryChange,
  isLoading
}: SearchBarProps) {
  return (
    <section className="panel search-panel">
      <div className="section-heading">
        <p className="eyebrow">Type the content of the image/video...</p>
        <h3>Search bar</h3>
      </div>

      <label
        className="field"
        htmlFor="search-query"
      >
        <input
          id="search-query"
          type="search"
          value={query}
          placeholder="Try: cat, dog, camel"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      <p className="muted-text">
        {isLoading
          ? "Searching the indexed gallery..."
          : "This ranks title, description, manual tags, and AI tags."}
      </p>
    </section>
  );
}

