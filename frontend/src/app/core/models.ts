// Miroir des DTO exposes par le backend (package dto de Spring).

export type Role = 'ROLE_USER' | 'ROLE_ADMIN';

export const ROLES: readonly Role[] = ['ROLE_USER', 'ROLE_ADMIN'];

export interface ApiError {
  timestamp: string;
  status: number;
  message: string;
}

export interface AuthResponse {
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface Category {
  id: number;
  label: string;
  color: string | null;
}

export interface CategoryRequest {
  label: string;
  color: string | null;
}

export interface Task {
  id: number;
  description: string;
  createdAt: string;
  category: Category | null;
}

export interface TaskRequest {
  description: string;
  categoryId: number | null;
}

export interface User {
  id: number;
  username: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  roles: Role[];
}

export interface UserCreateRequest {
  username: string;
  password: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
}

/** Mise a jour partielle : un champ absent ou null n'est pas modifie. */
export interface UserUpdateRequest {
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
  password?: string | null;
  roles?: Role[] | null;
}
