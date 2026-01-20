import { useDonations } from '../context/DonationContext.jsx'

const useDonationsHook = () => {
  const context = useDonations()
  
  
  return context
}

export default useDonationsHook