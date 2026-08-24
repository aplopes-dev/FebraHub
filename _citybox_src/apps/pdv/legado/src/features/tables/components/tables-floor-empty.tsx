'use client';

type TablesFloorEmptyProps = {
  title?: string;
  description?: string;
};

export function TablesFloorEmpty({
  title = 'Nenhuma mesa definida',
  description = 'Comece a personalizar o layout das mesas tocando no botão "Editar Layout"',
}: TablesFloorEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 text-center select-none">
      <div className="relative mb-6 flex size-24 items-center justify-center rounded-full border border-[#e5e5e5] bg-[#EAEAEA]/40 shadow-inner">
        <div className="relative flex size-14 items-center justify-center rounded-xl border border-[#e5e5e5] bg-white shadow-xs">
          <svg
            className="size-7 text-[#A3A3A3]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
          <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#404040] text-white shadow-xs">
            <span className="text-[10px] font-bold">?</span>
          </div>
        </div>
      </div>

      <h3 className="mb-1 text-lg font-bold text-[#171717]">{title}</h3>
      <p className="max-w-[340px] text-sm font-medium leading-relaxed text-[#737373]">
        {description}
      </p>
    </div>
  );
}
