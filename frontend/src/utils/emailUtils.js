// utils/emailUtils.js
export const formatEmailPreview = (donation) => {
  return {
    subject: `JazakAllah Khair for Your Donation - Rs ${donation.amount} - Astana Foundation`,
    preview: `
      Dear ${donation.donorName},
      
      Thank you for your donation of Rs ${donation.amount} towards "${donation.purpose}".
      
      May Allah accept your contribution and multiply its reward for you. Ameen.
      
      Astana Foundation
      Khanqah Saifia & Jamia Abi Bakr
      Faisalabad, Pakistan
    `
  }
}

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const getEmailStatusColor = (status) => {
  if (!status.sent && status.error) {
    return 'bg-red-100 text-red-800 border-red-200'
  }
  if (status.sent) {
    return 'bg-green-100 text-green-800 border-green-200'
  }
  return 'bg-gray-100 text-gray-800 border-gray-200'
}

export const getEmailStatusText = (status) => {
  if (!status.sent && status.error) {
    return 'Failed'
  }
  if (status.sent) {
    return 'Sent'
  }
  return 'Pending'
}