import React from 'react';

interface TopBarProps {
  onOpenApiDrawer: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenApiDrawer }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-[#0B0F19]/95">
      <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        <a
          href="#overview"
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 dark:text-slate-100"
        >
          SG HazeWatch
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          <a
            href="#overview"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-slate-950 hover:underline underline-offset-4 dark:hover:text-white"
          >
            Overview
          </a>
          <a
            href="#regional-map"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-slate-950 hover:underline underline-offset-4 dark:hover:text-white"
          >
            Regional Map
          </a>
          <a
            href="#trends"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-slate-950 hover:underline underline-offset-4 dark:hover:text-white"
          >
            24h Trends
          </a>
          <a
            href="#health-guide"
            className="whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-slate-950 hover:underline underline-offset-4 dark:hover:text-white"
          >
            Health Guide
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenApiDrawer}
            className="whitespace-nowrap shrink-0 rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors duration-150 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:focus-visible:outline-slate-100"
          >
            API Adapter
          </button>
        </div>
      </div>
    </header>
  );
};
