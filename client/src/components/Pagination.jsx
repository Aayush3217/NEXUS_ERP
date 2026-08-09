import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './UI';

export const Pagination = ({
  page,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 sm:px-6 rounded-b-2xl">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-gray-500">
            Showing Page <span className="font-semibold text-gray-700">{page}</span> of{' '}
            <span className="font-semibold text-gray-700">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-xl shadow-sm border border-gray-200" aria-label="Pagination">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="relative inline-flex items-center rounded-l-xl px-2 py-2 text-gray-400 ring-1 ring-inset ring-transparent hover:bg-gray-50 focus:z-20 disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 h-5" aria-hidden="true" />
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              const isCurrent = p === page;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 transition-all duration-150 ${
                    isCurrent
                      ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                      : 'text-gray-900 ring-1 ring-inset ring-transparent hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="relative inline-flex items-center rounded-r-xl px-2 py-2 text-gray-400 ring-1 ring-inset ring-transparent hover:bg-gray-50 focus:z-20 disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 h-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
export default Pagination;
