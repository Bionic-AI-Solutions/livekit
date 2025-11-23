/**
 * Authentication utilities
 */
import apiClient from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  language_preference: string;
}

export async function login(credentials: LoginCredentials): Promise<string> {
  const formData = new FormData();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);
  
  const response = await apiClient.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  const { access_token } = response.data;
  localStorage.setItem('access_token', access_token);
  return access_token;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get('/auth/me');
  return response.data;
}

export function logout(): void {
  localStorage.removeItem('access_token');
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}

