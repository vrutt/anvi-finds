export const API_ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
    users: "/auth/users",
  },
  catalog: { collections: "/collections", products: "/products" },
} as const;
