export const formatAmount = (amount) => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0
  }
  
  if (amount >= 10000000) {
    return `RS ${(amount / 10000000).toFixed(1)} Cr`
  } else if (amount >= 100000) {
    return `RS ${(amount / 100000).toFixed(1)} L`
  } else if (amount >= 1000) {
    return `RS ${(amount / 1000).toFixed(1)} K`
  }
  
  return `RS ${amount.toFixed(0)}`
}

export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}