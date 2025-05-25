import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from './queryClient';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  roleId: number;
  role?: {
    id: number;
    name: string;
    permissions: string[];
  };
}

/**
 * Hook to check if the user is authenticated
 * It will redirect to login page if not authenticated
 */
export function useAuthGuard(): boolean {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const { data: user, isLoading, isError } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      if (isError || !user) {
        // User is not authenticated, redirect to login
        setIsAuthenticated(false);
        
        // Don't redirect if already on login or register page
        const authPages = ['/login', '/register'];
        if (!authPages.includes(location)) {
          setLocation('/login');
        }
      } else {
        // User is authenticated
        setIsAuthenticated(true);
        
        // If on login page, redirect to home
        if (location === '/login' || location === '/register') {
          setLocation('/');
        }
      }
    }
  }, [isLoading, isError, user, location, setLocation]);

  return isAuthenticated === true;
}

/**
 * Hook to get the current user
 */
export function useUser() {
  const { data: user, isLoading, isError } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  return {
    user,
    isLoading,
    isError,
    isAuthenticated: !isLoading && !isError && !!user,
  };
}

/**
 * Check if the user has a specific permission
 */
export function useHasPermission(permission: string) {
  const { user, isLoading, isAuthenticated } = useUser();

  if (isLoading || !isAuthenticated || !user?.role) {
    return false;
  }

  // Check if the user has the specific permission
  return user.role.permissions.includes(permission);
}

/**
 * Log out the user
 */
export async function logout() {
  try {
    await apiRequest('POST', '/api/auth/logout', {});
    
    // Invalidar la consulta para forzar a recargar la información de usuario
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    
    // Forzar recarga completa para limpiar todo el estado
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout failed:', error);
    // Still redirect to login even if the API call fails
    window.location.href = '/login';
  }
}
