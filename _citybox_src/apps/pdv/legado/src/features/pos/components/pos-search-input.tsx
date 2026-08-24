'use client';

import { SearchIcon, XIcon } from 'lucide-react';

type PosSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function PosSearchInput({
  value,
  onChange,
  placeholder = 'Buscar itens…',
}: PosSearchInputProps) {
  return (
    <div className="relative w-full max-w-sm shrink-0">
      <SearchIcon 
        className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" 
        aria-hidden 
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-9 bg-white border border-[#e5e5e5] rounded-xl text-sm font-medium placeholder-[#a3a3a3] outline-none focus:border-[#a3a3a3] focus:ring-1 focus:ring-primary transition-all text-[#171717]"
      />
      {value && (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#171717] size-5 flex items-center justify-center rounded-md hover:bg-[#f5f5f5] transition-colors"
          onClick={() => onChange('')}
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
