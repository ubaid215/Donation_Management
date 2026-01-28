import React from 'react'
import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown } from 'lucide-react'

const MetricCard = ({ title, value, subValue, change, icon, color = 'primary', loading = false }) => {
  const colorClasses = {
    primary: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: 'text-blue-600'
    },
    success: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: 'text-green-600'
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      icon: 'text-amber-600'
    },
    danger: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: 'text-red-600'
    },
    gray: {
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      icon: 'text-gray-600'
    }
  }

  const getChangeIcon = () => {
    if (!change) return null
    if (change.startsWith('+')) return <TrendingUp className="w-4 h-4" />
    if (change.startsWith('-')) return <TrendingDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const getChangeColor = () => {
    if (!change) return 'text-gray-600'
    if (change.startsWith('+')) return 'text-green-600'
    if (change.startsWith('-')) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="card p-4 md:p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card card-hover p-4 md:p-6 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-gray-500 truncate">{title}</p>
          <div className="flex items-baseline mt-2">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
              {value}
            </h3>
            {subValue && (
              <span className="ml-2 text-xs md:text-sm text-gray-500 truncate">{subValue}</span>
            )}
          </div>
        </div>
        <div className={`p-2 md:p-3 rounded-full ${colorClasses[color].bg} flex-shrink-0 ml-2`}>
          <div className={colorClasses[color].icon}>
            {React.cloneElement(icon, { 
              className: `w-4 h-4 md:w-5 md:h-5 ${icon.props.className || ''}` 
            })}
          </div>
        </div>
      </div>
      
      {change && (
        <div className="flex items-center text-xs md:text-sm mt-2">
          <span className={`flex items-center ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="ml-1 font-medium">{change}</span>
          </span>
          <span className="text-gray-500 ml-2 truncate">vs last month</span>
        </div>
      )}
    </div>
  )
}

export default MetricCard