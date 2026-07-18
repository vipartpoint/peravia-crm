'use client';

import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
}

export function Pagination({ currentPage, totalPages, totalItems, onPageChange, itemsPerPage = 50 }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card border-t border-border sm:px-6">
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            نمایش <span className="font-bold text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> تا <span className="font-bold text-foreground">{Math.min(currentPage * itemsPerPage, totalItems)}</span> از <span className="font-bold text-foreground">{totalItems}</span> رکورد
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm space-x-reverse" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-border hover:bg-slate-50 dark:bg-slate-800/50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">قبلی</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            
            <div className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-foreground ring-1 ring-inset ring-border focus:z-20 focus:outline-offset-0">
              {currentPage} / {totalPages}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-border hover:bg-slate-50 dark:bg-slate-800/50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">بعدی</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
      
      {/* Mobile Pagination */}
      <div className="flex flex-1 items-center justify-between sm:hidden">
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          قبلی
        </Button>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {currentPage} از {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          بعدی
        </Button>
      </div>
    </div>
  );
}
