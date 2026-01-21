import React from 'react'
import { format } from 'date-fns'
import { 
  Calendar, 
  Phone, 
  User, 
  IndianRupee,
  FileText,
  CreditCard,
  Building,
  Smartphone,
  CheckCircle,
  HandCoins,
} from 'lucide-react'

const DonationList = ({ donations = [], loading = false }) => {
  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'CASH': return <FileText className="w-4 h-4" />
      case 'CARD': return <CreditCard className="w-4 h-4" />
      case 'BANK_TRANSFER': return <Building className="w-4 h-4" />
      case 'UPI': return <Smartphone className="w-4 h-4" />
      case 'CHEQUE': return <FileText className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading donations...</p>
        </div>
      </div>
    )
  }

  if (donations.length === 0) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <HandCoins className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No donations found</h3>
        <p className="text-gray-500">Start by recording your first donation</p>
      </div>
    )
  }

  return (
    <div className="card card-hover overflow-hidden animate-slide-up">
      {/* Mobile View */}
      <div className="block md:hidden">
        <div className="p-4 space-y-4">
          {donations.map((donation) => (
            <div key={donation.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <div>
                    <div className="font-medium text-sm">
                      {format(new Date(donation.date), 'dd MMM yyyy')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(donation.date), 'hh:mm a')}
                    </div>
                  </div>
                </div>
                <span className="badge badge-info text-xs">
                  {donation.purpose}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center text-gray-900 mb-1">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="font-medium">{donation.donorName}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 ml-6">
                    <Phone className="w-3 h-3 mr-1" />
                    {donation.donorPhone}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center font-bold text-gray-900">
                    {formatAmount(donation.amount)}
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    {getPaymentMethodIcon(donation.paymentMethod)}
                    <span className="ml-2">
                      {donation.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {donation.operator && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Operator:</span> {donation.operator.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date & Time</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Donor Details</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Purpose</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Payment</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Operator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {donations.map((donation) => (
              <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center text-gray-900">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <div className="font-medium">
                        {format(new Date(donation.date), 'dd MMM yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(donation.date), 'hh:mm a')}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <div className="flex items-center font-medium text-gray-900">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      {donation.donorName}
                    </div>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Phone className="w-3 h-3 mr-1" />
                      {donation.donorPhone}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center font-bold text-gray-900">
                    {formatAmount(donation.amount)}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="badge badge-info">
                    {donation.purpose}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    {getPaymentMethodIcon(donation.paymentMethod)}
                    <span className="ml-2 text-sm text-gray-700">
                      {donation.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {donation.operator ? (
                    <div className="text-sm text-gray-700">{donation.operator.name}</div>
                  ) : (
                    <span className="text-xs text-gray-500">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DonationList