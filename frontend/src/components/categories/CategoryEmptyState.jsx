import React from 'react'
import { Tag } from 'lucide-react'

const CategoryEmptyState = ({ hasFilters }) => {
  return (
    <div className="text-center py-12 animate-fade-in">
      <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Tag className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
      </div>
      <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
        No categories found
      </h3>
      <p className="text-sm md:text-base text-gray-500">
        {hasFilters 
          ? 'Try adjusting your filters' 
          : 'Create your first category to get started'
        }
      </p>
    </div>
  )
}

export default CategoryEmptyState