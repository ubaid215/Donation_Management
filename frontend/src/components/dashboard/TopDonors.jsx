import React from 'react'
import { Award, Phone, TrendingUp, User } from 'lucide-react'

const TopDonors = ({ donors = [], loading = false }) => {
  if (loading) {
    return (
      <div className="card p-4 md:p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center p-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="ml-4 space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="ml-4 space-y-1 text-right">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (donors.length === 0) {
    return (
      <div className="card p-6 animate-fade-in">
        <div className="text-center py-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <Award className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">No donors yet</h3>
          <p className="text-sm text-gray-500">Donations will appear here once recorded</p>
        </div>
      </div>
    )
  }

  // Calculate total and average safely
  const totalAmount = donors.reduce((sum, donor) => {
    const amount = Number(donor.totalAmount) || 0;
    return sum + amount;
  }, 0);
  
  const averageAmount = donors.length > 0 ? totalAmount / donors.length : 0;

  return (
    <div className="card card-hover p-4 md:p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Top Donors</h3>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Highest contributors this month</p>
        </div>
      </div>
      
      <div className="space-y-3">
        {donors.map((donor, index) => {
          // Safely parse amounts
          const totalAmount = Number(donor.totalAmount) || 0;
          const donationCount = Number(donor.donationCount) || 1;
          
          return (
            <div 
              key={donor.phone || donor.id || index} 
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors animate-fade-in"
            >
              {/* Rank/Avatar */}
              <div className="flex-shrink-0">
                {index < 3 ? (
                  <div className={`
                    w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center
                    ${index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                      index === 1 ? 'bg-gray-100 border border-gray-200' :
                      'bg-orange-50 border border-orange-200'}
                  `}>
                    <Award className={`
                      w-4 h-4 md:w-5 md:h-5
                      ${index === 0 ? 'text-yellow-600' :
                        index === 1 ? 'text-gray-600' :
                        'text-orange-600'}
                    `} />
                  </div>
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <span className={`
                      text-sm md:text-base font-semibold
                      ${index === 0 ? 'text-yellow-600' :
                        index === 1 ? 'text-gray-600' :
                        index === 2 ? 'text-orange-600' :
                        'text-blue-600'}
                    `}>
                      {index + 1}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Donor Info */}
              <div className="ml-3 md:ml-4 flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center">
                      <User className="w-3 h-3 md:w-4 md:h-4 text-gray-400 mr-2 flex-shrink-0" />
                      <h4 className="text-sm md:text-base font-semibold text-gray-900 truncate">
                        {donor.name || 'Anonymous'}
                      </h4>
                    </div>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{donor.phone || 'No phone'}</span>
                    </div>
                  </div>
                  
                  {/* Amount & Stats */}
                  <div className="mt-2 sm:mt-0 sm:text-right">
                    <div className="flex items-center sm:justify-end">
                      <p className="text-base md:text-lg font-bold text-gray-900">
                        Rs {totalAmount.toLocaleString('en-PK')}
                      </p>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1 sm:justify-end">
                      <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span>{donationCount} donation{donationCount > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Summary Footer */}
      {donors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs md:text-sm">
            <div className="text-gray-600">
              <span className="font-medium">{donors.length}</span> top donors this month
            </div>
            <div className="mt-2 sm:mt-0 text-gray-900">
              <span className="font-semibold">
                Average: Rs {Math.round(averageAmount).toLocaleString('en-PK')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TopDonors