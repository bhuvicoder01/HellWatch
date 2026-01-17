'use client'
import { api, authAPI } from "@/services/api";
import { AxiosError } from "axios";
import { createContext, useContext, useEffect, useState } from "react";

export interface User {
    _id: string,
    username: string,
    avatar: {
        url: string
    },
    name: string,
    email: string,
    password: string,
    createdAt: string,
    updatedAt: string,
    __v: number
};

const AuthContext = createContext<{
    user: User | null,
    isAuthenticated?: boolean,
    isAuthExpired: boolean,
    setUser: any, logout: () => void,
    login: (credentials: any) => Promise<void>,
    update: (credentials: any) => Promise<void>
}>
    ({
        user: null,
        isAuthenticated: false,
        isAuthExpired: false,
        setUser: () => { },
        logout: () => { },
        login: async ({ }) => { return Promise.resolve() },
        update: async ({ }) => { return Promise.resolve() }
    })

export const useAuth = () => {
    return useContext(AuthContext)
}

if (!useAuth) {
    throw new Error('useAuth must be used within an AuthProvider')
}
export function AuthProvider({ children }: any) {
    const [user, setUser] = useState<User | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isAuthExpired, setIsAuthExpired] = useState(false)

    const checkAuth = async () => {
        try {
            const res = await api.get('/auth/me')

            const data = await res.data
            if (data.user) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('user', JSON.stringify(data.user))
                    localStorage.setItem('isAuthExpired','false')
                }
                setUser(data.user)
                setIsAuthenticated(true)
            }
        }
        catch (error: any) {
            console.log(error)
            // alert(error?.response.data.message)
            if (error?.response?.status === 401) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('user')
                    setIsAuthExpired(true);
                    localStorage.setItem('isAuthExpired', 'true')
                    console.log(isAuthExpired)
                    setUser(null)
                    setIsAuthenticated(false)
                }

            }
        }

    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            checkAuth()
            const storedUser = localStorage.getItem('user')
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser)
                setUser(parsedUser)
                setIsAuthenticated(true)
            }
        }
    }, [user?._id,isAuthExpired])

    const login = async (credentials: any) => {
        try {
            const res = await authAPI.login(credentials)
            const data = res.data
            if (data.user) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('user', JSON.stringify(data.user))
                }
                const token = JSON.parse(res.data.token);
                if (token) {
                    localStorage.setItem('token', token);
                }
                setUser(data.user)
                setIsAuthenticated(true)
            }

        } catch (error) {
            console.log(error)
            alert(error)
        }
    }
    const logout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user')
            localStorage.removeItem('token')
            localStorage.setItem('isAuthExpired','true')
            setIsAuthExpired(false);

        }
        setUser(null)
        setIsAuthenticated(false)
    }

    const update = async (formData: any) => {
        try {
            console.log(formData.get('Avatar'))
            const res = await authAPI.updateUser(formData)
            const data = res.data
            if (data.user) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('user', JSON.stringify(data.user))
                }
                setUser(data.user)
            }

        } catch (error) {
            console.error(error)
            alert(error)

        }
    }


    const value = {
        user,
        setUser,
        logout,
        isAuthenticated,
        login,
        update,
        isAuthExpired
    }
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}