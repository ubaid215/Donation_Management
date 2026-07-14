import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  pageSize,
  onPageSizeChange,
  totalItems 
}) => {
  const pageNumbers = []
  const maxVisiblePages = 5
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i)
  }

  if (totalPages === 0 || totalItems === 0) return null

  return (
    <div className="card animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 md:px-6 md:py-4">
        {/* Page size selector and info */}
        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-4 w-full sm:w-auto">
          <div className="flex items-center">
            <span className="text-xs md:text-sm text-gray-700 mr-2">Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="input py-1.5 px-2 text-xs md:text-sm max-w-[80px]"
            >
              {[10, 20, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="ml-2 text-xs md:text-sm text-gray-700 whitespace-nowrap">
              per page
            </span>
          </div>
          
          <div className="text-xs md:text-sm text-gray-600">
            Showing <span className="font-medium">{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</span>
            -
            <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of 
            <span className="font-medium ml-1">{totalItems.toLocaleString()}</span> items
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center space-x-1 md:space-x-2">
          {/* First Page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="btn btn-outline p-1.5 md:p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="First page"
          >
            <ChevronsLeft className="h-3 w-3 md:h-4 md:w-4" />
          </button>
          
          {/* Previous Page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-outline p-1.5 md:p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
          </button>

          {/* Page Numbers - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {startPage > 1 && (
              <>
                <button
                  onClick={() => onPageChange(1)}
                  className="btn btn-outline px-3 py-1.5 text-sm"
                >
                  1
                </button>
                {startPage > 2 && (
                  <span className="px-2 py-1.5 text-gray-500">...</span>
                )}
              </>
            )}

            {pageNumbers.map(number => (
              <button
                key={number}
                onClick={() => onPageChange(number)}
                className={`btn px-3 py-1.5 text-sm ${
                  currentPage === number
                    ? 'btn-primary text-white'
                    : 'btn-outline'
                }`}
              >
                {number}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span className="px-2 py-1.5 text-gray-500">...</span>
                )}
                <button
                  onClick={() => onPageChange(totalPages)}
                  className="btn btn-outline px-3 py-1.5 text-sm"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          {/* Page Info - Mobile */}
          <div className="md:hidden flex items-center">
            <span className="text-sm text-gray-700 mx-2">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </span>
          </div>

          {/* Next Page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn btn-outline p-1.5 md:p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
          </button>
          
          {/* Last Page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="btn btn-outline p-1.5 md:p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Last page"
          >
            <ChevronsRight className="h-3 w-3 md:h-4 md:w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Page Numbers (below) */}
      <div className="md:hidden border-t border-gray-200 px-4 py-3">
        <div className="flex items-center justify-center space-x-1">
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => onPageChange(number)}
              className={`btn px-3 py-1.5 text-xs ${
                currentPage === number
                  ? 'btn-primary text-white'
                  : 'btn-outline'
              }`}
            >
              {number}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="px-2 text-gray-500">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="btn btn-outline px-3 py-1.5 text-xs"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Pagination