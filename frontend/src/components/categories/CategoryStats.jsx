import React from 'react'
import { Tag, CheckCircle, XCircle } from 'lucide-react'

const CategoryStats = ({ categories }) => {
  const totalCategories = categories.length || 0
  const activeCategories = categories.filter(c => c.isActive).length
  const inactiveCategories = categories.filter(c => !c.isActive).length

  const stats = [
    {
      label: 'Total Categories',
      value: totalCategories,
      icon: Tag,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Active',
      value: activeCategories,
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      label: 'Inactive',
      value: inactiveCategories,
      icon: XCircle,
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-600'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div 
            key={index} 
            className={`card p-3 md:p-4 ${index === 2 ? 'col-span-2 md:col-span-1' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-500">{stat.label}</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-2 md:p-3 ${stat.bgColor} rounded-full`}>
                <Icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default CategoryStats