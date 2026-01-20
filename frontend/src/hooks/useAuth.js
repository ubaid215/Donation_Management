import { useAuth } from '../context/AuthContext.jsx'

const useAuthHook = () => {
  const auth = useAuth()
  
  return {
    ...auth,
    isAuthenticated: !!auth.user,
    userRole: auth.user?.role,
    userName: auth.user?.name
  }
}

export default useAuthHook