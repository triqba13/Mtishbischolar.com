"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";

// ─── Complete world calling-code dataset ─────────────────────────────────────
// [flag emoji, country name, dial code]
export const COUNTRY_CODES: [string, string, string][] = [
  ["🇦🇫", "Afghanistan", "+93"],
  ["🇦🇱", "Albania", "+355"],
  ["🇩🇿", "Algeria", "+213"],
  ["🇦🇩", "Andorra", "+376"],
  ["🇦🇴", "Angola", "+244"],
  ["🇦🇬", "Antigua & Barbuda", "+1268"],
  ["🇦🇷", "Argentina", "+54"],
  ["🇦🇲", "Armenia", "+374"],
  ["🇦🇺", "Australia", "+61"],
  ["🇦🇹", "Austria", "+43"],
  ["🇦🇿", "Azerbaijan", "+994"],
  ["🇧🇸", "Bahamas", "+1242"],
  ["🇧🇭", "Bahrain", "+973"],
  ["🇧🇩", "Bangladesh", "+880"],
  ["🇧🇧", "Barbados", "+1246"],
  ["🇧🇾", "Belarus", "+375"],
  ["🇧🇪", "Belgium", "+32"],
  ["🇧🇿", "Belize", "+501"],
  ["🇧🇯", "Benin", "+229"],
  ["🇧🇹", "Bhutan", "+975"],
  ["🇧🇴", "Bolivia", "+591"],
  ["🇧🇦", "Bosnia & Herzegovina", "+387"],
  ["🇧🇼", "Botswana", "+267"],
  ["🇧🇷", "Brazil", "+55"],
  ["🇧🇳", "Brunei", "+673"],
  ["🇧🇬", "Bulgaria", "+359"],
  ["🇧🇫", "Burkina Faso", "+226"],
  ["🇧🇮", "Burundi", "+257"],
  ["🇨🇻", "Cabo Verde", "+238"],
  ["🇰🇭", "Cambodia", "+855"],
  ["🇨🇲", "Cameroon", "+237"],
  ["🇨🇦", "Canada", "+1"],
  ["🇨🇫", "Central African Republic", "+236"],
  ["🇹🇩", "Chad", "+235"],
  ["🇨🇱", "Chile", "+56"],
  ["🇨🇳", "China", "+86"],
  ["🇨🇴", "Colombia", "+57"],
  ["🇰🇲", "Comoros", "+269"],
  ["🇨🇬", "Congo (Brazzaville)", "+242"],
  ["🇨🇩", "Congo (DRC)", "+243"],
  ["🇨🇷", "Costa Rica", "+506"],
  ["🇨🇮", "Côte d'Ivoire", "+225"],
  ["🇭🇷", "Croatia", "+385"],
  ["🇨🇺", "Cuba", "+53"],
  ["🇨🇾", "Cyprus", "+357"],
  ["🇨🇿", "Czech Republic", "+420"],
  ["🇩🇰", "Denmark", "+45"],
  ["🇩🇯", "Djibouti", "+253"],
  ["🇩🇲", "Dominica", "+1767"],
  ["🇩🇴", "Dominican Republic", "+1809"],
  ["🇪🇨", "Ecuador", "+593"],
  ["🇪🇬", "Egypt", "+20"],
  ["🇸🇻", "El Salvador", "+503"],
  ["🇬🇶", "Equatorial Guinea", "+240"],
  ["🇪🇷", "Eritrea", "+291"],
  ["🇪🇪", "Estonia", "+372"],
  ["🇸🇿", "Eswatini", "+268"],
  ["🇪🇹", "Ethiopia", "+251"],
  ["🇫🇯", "Fiji", "+679"],
  ["🇫🇮", "Finland", "+358"],
  ["🇫🇷", "France", "+33"],
  ["🇬🇦", "Gabon", "+241"],
  ["🇬🇲", "Gambia", "+220"],
  ["🇬🇪", "Georgia", "+995"],
  ["🇩🇪", "Germany", "+49"],
  ["🇬🇭", "Ghana", "+233"],
  ["🇬🇷", "Greece", "+30"],
  ["🇬🇩", "Grenada", "+1473"],
  ["🇬🇹", "Guatemala", "+502"],
  ["🇬🇳", "Guinea", "+224"],
  ["🇬🇼", "Guinea-Bissau", "+245"],
  ["🇬🇾", "Guyana", "+592"],
  ["🇭🇹", "Haiti", "+509"],
  ["🇭🇳", "Honduras", "+504"],
  ["🇭🇺", "Hungary", "+36"],
  ["🇮🇸", "Iceland", "+354"],
  ["🇮🇳", "India", "+91"],
  ["🇮🇩", "Indonesia", "+62"],
  ["🇮🇷", "Iran", "+98"],
  ["🇮🇶", "Iraq", "+964"],
  ["🇮🇪", "Ireland", "+353"],
  ["🇮🇱", "Israel", "+972"],
  ["🇮🇹", "Italy", "+39"],
  ["🇯🇲", "Jamaica", "+1876"],
  ["🇯🇵", "Japan", "+81"],
  ["🇯🇴", "Jordan", "+962"],
  ["🇰🇿", "Kazakhstan", "+7"],
  ["🇰🇪", "Kenya", "+254"],
  ["🇰🇮", "Kiribati", "+686"],
  ["🇰🇼", "Kuwait", "+965"],
  ["🇰🇬", "Kyrgyzstan", "+996"],
  ["🇱🇦", "Laos", "+856"],
  ["🇱🇻", "Latvia", "+371"],
  ["🇱🇧", "Lebanon", "+961"],
  ["🇱🇸", "Lesotho", "+266"],
  ["🇱🇷", "Liberia", "+231"],
  ["🇱🇾", "Libya", "+218"],
  ["🇱🇮", "Liechtenstein", "+423"],
  ["🇱🇹", "Lithuania", "+370"],
  ["🇱🇺", "Luxembourg", "+352"],
  ["🇲🇬", "Madagascar", "+261"],
  ["🇲🇼", "Malawi", "+265"],
  ["🇲🇾", "Malaysia", "+60"],
  ["🇲🇻", "Maldives", "+960"],
  ["🇲🇱", "Mali", "+223"],
  ["🇲🇹", "Malta", "+356"],
  ["🇲🇭", "Marshall Islands", "+692"],
  ["🇲🇷", "Mauritania", "+222"],
  ["🇲🇺", "Mauritius", "+230"],
  ["🇲🇽", "Mexico", "+52"],
  ["🇫🇲", "Micronesia", "+691"],
  ["🇲🇩", "Moldova", "+373"],
  ["🇲🇨", "Monaco", "+377"],
  ["🇲🇳", "Mongolia", "+976"],
  ["🇲🇪", "Montenegro", "+382"],
  ["🇲🇦", "Morocco", "+212"],
  ["🇲🇿", "Mozambique", "+258"],
  ["🇲🇲", "Myanmar", "+95"],
  ["🇳🇦", "Namibia", "+264"],
  ["🇳🇷", "Nauru", "+674"],
  ["🇳🇵", "Nepal", "+977"],
  ["🇳🇱", "Netherlands", "+31"],
  ["🇳🇿", "New Zealand", "+64"],
  ["🇳🇮", "Nicaragua", "+505"],
  ["🇳🇪", "Niger", "+227"],
  ["🇳🇬", "Nigeria", "+234"],
  ["🇳🇴", "Norway", "+47"],
  ["🇴🇲", "Oman", "+968"],
  ["🇵🇰", "Pakistan", "+92"],
  ["🇵🇼", "Palau", "+680"],
  ["🇵🇦", "Panama", "+507"],
  ["🇵🇬", "Papua New Guinea", "+675"],
  ["🇵🇾", "Paraguay", "+595"],
  ["🇵🇪", "Peru", "+51"],
  ["🇵🇭", "Philippines", "+63"],
  ["🇵🇱", "Poland", "+48"],
  ["🇵🇹", "Portugal", "+351"],
  ["🇶🇦", "Qatar", "+974"],
  ["🇷🇴", "Romania", "+40"],
  ["🇷🇺", "Russia", "+7"],
  ["🇷🇼", "Rwanda", "+250"],
  ["🇰🇳", "Saint Kitts & Nevis", "+1869"],
  ["🇱🇨", "Saint Lucia", "+1758"],
  ["🇻🇨", "Saint Vincent & Grenadines", "+1784"],
  ["🇼🇸", "Samoa", "+685"],
  ["🇸🇲", "San Marino", "+378"],
  ["🇸🇹", "São Tomé & Príncipe", "+239"],
  ["🇸🇦", "Saudi Arabia", "+966"],
  ["🇸🇳", "Senegal", "+221"],
  ["🇷🇸", "Serbia", "+381"],
  ["🇸🇨", "Seychelles", "+248"],
  ["🇸🇱", "Sierra Leone", "+232"],
  ["🇸🇬", "Singapore", "+65"],
  ["🇸🇰", "Slovakia", "+421"],
  ["🇸🇮", "Slovenia", "+386"],
  ["🇸🇧", "Solomon Islands", "+677"],
  ["🇸🇴", "Somalia", "+252"],
  ["🇿🇦", "South Africa", "+27"],
  ["🇸🇸", "South Sudan", "+211"],
  ["🇪🇸", "Spain", "+34"],
  ["🇱🇰", "Sri Lanka", "+94"],
  ["🇸🇩", "Sudan", "+249"],
  ["🇸🇷", "Suriname", "+597"],
  ["🇸🇪", "Sweden", "+46"],
  ["🇨🇭", "Switzerland", "+41"],
  ["🇸🇾", "Syria", "+963"],
  ["🇹🇼", "Taiwan", "+886"],
  ["🇹🇯", "Tajikistan", "+992"],
  ["🇹🇿", "Tanzania", "+255"],
  ["🇹🇭", "Thailand", "+66"],
  ["🇹🇱", "Timor-Leste", "+670"],
  ["🇹🇬", "Togo", "+228"],
  ["🇹🇴", "Tonga", "+676"],
  ["🇹🇹", "Trinidad & Tobago", "+1868"],
  ["🇹🇳", "Tunisia", "+216"],
  ["🇹🇷", "Turkey", "+90"],
  ["🇹🇲", "Turkmenistan", "+993"],
  ["🇹🇻", "Tuvalu", "+688"],
  ["🇺🇬", "Uganda", "+256"],
  ["🇺🇦", "Ukraine", "+380"],
  ["🇦🇪", "United Arab Emirates", "+971"],
  ["🇬🇧", "United Kingdom", "+44"],
  ["🇺🇸", "United States", "+1"],
  ["🇺🇾", "Uruguay", "+598"],
  ["🇺🇿", "Uzbekistan", "+998"],
  ["🇻🇺", "Vanuatu", "+678"],
  ["🇻🇦", "Vatican City", "+3906698"],
  ["🇻🇪", "Venezuela", "+58"],
  ["🇻🇳", "Vietnam", "+84"],
  ["🇾🇪", "Yemen", "+967"],
  ["🇿🇲", "Zambia", "+260"],
  ["🇿🇼", "Zimbabwe", "+263"],
];

const DEFAULT_CODE = "+255";
const DEFAULT_ENTRY = COUNTRY_CODES.find(([, , c]) => c === DEFAULT_CODE)!;

/**
 * Parse a full E.164-style number like "+255712345678" into [dialCode, localNumber].
 * Tries longest code first so +1868 is matched before +1.
 */
export function parsePhoneNumber(full: string): [string, string] {
  if (!full) return [DEFAULT_CODE, ""];
  const stripped = full.replace(/\s+/g, "");
  if (!stripped.startsWith("+")) return [DEFAULT_CODE, stripped];

  const sorted = [...COUNTRY_CODES].sort((a, b) => b[2].length - a[2].length);
  for (const [, , code] of sorted) {
    if (stripped.startsWith(code)) {
      return [code, stripped.slice(code.length)];
    }
  }
  return [DEFAULT_CODE, stripped];
}

interface PhoneInputProps {
  /** Full E.164 number, e.g. "+255712345678". Will be parsed into code + local. */
  value: string;
  onChange: (fullPhone: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  const [dialCode, setDialCode] = useState<string>(DEFAULT_CODE);
  const [localNumber, setLocalNumber] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync internal state when prop value changes
  useEffect(() => {
    const [code, local] = parsePhoneNumber(value);
    setDialCode(code);
    setLocalNumber(local);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Auto-focus search box when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 40);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRY_CODES;
    const q = search.toLowerCase();
    return COUNTRY_CODES.filter(
      ([, name, code]) => name.toLowerCase().includes(q) || code.includes(q)
    );
  }, [search]);

  const selected = COUNTRY_CODES.find(([, , c]) => c === dialCode) ?? DEFAULT_ENTRY;

  function handleCodeSelect(code: string) {
    setDialCode(code);
    setOpen(false);
    setSearch("");
    onChange(code + localNumber);
  }

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "");
    setLocalNumber(val);
    onChange(dialCode + val);
  }

  const borderClass = error
    ? "border-red-500 ring-1 ring-red-200"
    : "border-slate-200 focus-within:border-blue-600";

  return (
    <div>
      <div
        ref={wrapperRef}
        className={`flex rounded-xl border bg-slate-50 transition-colors relative ${borderClass}`}
      >
        {/* ── Country code button ── */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 pl-2.5 pr-2 py-2.5 border-r border-slate-200 rounded-l-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shrink-0 whitespace-nowrap"
          style={{ minWidth: "86px" }}
        >
          <span className="text-base leading-none">{selected[0]}</span>
          <span className="font-mono">{selected[2]}</span>
          <ChevronDown
            className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* ── Dropdown ── */}
        {open && (
          <div
            className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
            style={{ width: "268px" }}
          >
            {/* Search */}
            <div className="p-2 border-b border-slate-100">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country or code…"
                  className="flex-1 bg-transparent text-xs outline-none text-slate-700 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Options */}
            <div className="overflow-y-auto" style={{ maxHeight: "216px" }}>
              {filtered.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-5">No results</p>
              ) : (
                filtered.map(([flag, name, code]) => (
                  <button
                    key={`${code}-${name}`}
                    type="button"
                    onClick={() => handleCodeSelect(code)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left ${
                      code === dialCode
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-base leading-none shrink-0">{flag}</span>
                    <span className="flex-1 truncate">{name}</span>
                    <span className="font-mono text-slate-400 shrink-0">{code}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Local number input ── */}
        <input
          type="tel"
          inputMode="numeric"
          value={localNumber}
          onChange={handleLocalChange}
          placeholder="Enter your phone number"
          className="flex-1 px-3 py-2.5 text-xs bg-transparent outline-none text-slate-700 placeholder-slate-400 min-w-0"
        />
      </div>
      {error && (
        <p className="text-[11px] font-medium text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
