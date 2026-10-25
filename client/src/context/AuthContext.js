import { createContext } from 'react'

// Holds { user, restoring, login, register, logout }. The provider fills it in.
export const AuthContext = createContext(null)
