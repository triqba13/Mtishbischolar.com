"use client";

import React, { useState, useRef, useEffect } from "react";
import { NATIONALITIES, CountryNationality } from "@/lib/data/nationalities";
import { ChevronDown, Search, Check } from "lucide-react";

interface NationalitySelectProps {
  value: string;
  onChange: (nationality: string) => void;
  required?: boolean;
  error?: string;
}

export function NationalitySelect({ value, onChange, required = false, error }: NationalitySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = NATIONALITIES.find(
    (c) => c.name.toLowerCase() === (value || "").toLowerCase()
  );

  const filteredNationalities = NATIONALITIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (countryName: string) => {
    onChange(countryName);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button styled identically to existing input fields */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2.5 rounded-xl border bg-slate-50 text-left outline-none transition-colors flex items-center justify-between text-xs ${
          error
            ? "border-red-500 bg-red-50/20 ring-1 ring-red-200"
            : isOpen
              ? "border-blue-600 ring-2 ring-blue-100"
              : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedCountry ? (
            <span className="font-semibold text-slate-800">{selectedCountry.name}</span>
          ) : value ? (
            <span className="font-semibold text-slate-800">{value}</span>
          ) : (
            <span className="text-slate-400 font-normal">Select your nationality</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-blue-600" : ""}`} />
      </button>

      {error && (
        <p className="text-[11px] font-medium text-red-600 mt-1">{error}</p>
      )}

      {/* Hidden input for HTML form required attribute compatibility */}
      <input
        type="text"
        required={required}
        value={value}
        onChange={() => {}}
        tabIndex={-1}
        className="sr-only"
      />

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-2 space-y-2 max-h-64 flex flex-col">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
          </div>

          {/* Country List */}
          <div className="overflow-y-auto flex-1 space-y-0.5 pr-1 custom-scrollbar">
            {filteredNationalities.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">No country found</div>
            ) : (
              filteredNationalities.map((c) => {
                const isSelected = selectedCountry?.name === c.name;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c.name)}
                    className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-xs text-left transition-colors ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "hover:bg-slate-100 text-slate-700 font-medium"
                    }`}
                  >
                    <span className="truncate">
                      <span>{c.name}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
