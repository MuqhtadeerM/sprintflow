"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFilters } from "@/hooks/use-filters";

export function SearchBox() {
  const { filters, setFilters } = useFilters();
  const [value, setValue] = useState(filters.search);
  // The last value the URL and the input agreed on.
  const synced = useRef(filters.search);

  // URL changed from outside (Clear all, back button, pasted link): pull it in.
  useEffect(() => {
    if (filters.search !== synced.current) {
      synced.current = filters.search;
      setValue(filters.search);
    }
  }, [filters.search]);

  // Typing: push to the URL after a short pause, not on every keystroke.
  useEffect(() => {
    if (value === synced.current) return;
    const timer = setTimeout(() => {
      synced.current = value;
      setFilters({ search: value });
    }, 250);
    return () => clearTimeout(timer);
  }, [value, setFilters]);

  return (
    <div className="relative min-w-[160px] flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id="global-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search tasks…"
        aria-label="Search tasks"
        className="h-8 pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
