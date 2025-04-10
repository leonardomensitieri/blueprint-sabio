declare module 'react-router-dom' {
  import * as React from 'react';

  export interface NavigateProps {
    to: string;
    replace?: boolean;
  }

  export interface OutletProps {}

  export const Navigate: React.FC<NavigateProps>;
  export const Outlet: React.FC<OutletProps>;
  export const BrowserRouter: React.FC<{ children: React.ReactNode }>;
  export const Routes: React.FC<{ children: React.ReactNode }>;
  export const Route: React.FC<{
    path?: string;
    element?: React.ReactNode;
    index?: boolean;
    children?: React.ReactNode;
  }>;

  export function useNavigate(): (to: string, options?: { replace?: boolean }) => void;
  export function useParams<T extends Record<string, string | undefined>>(): T;
  export function useLocation(): { pathname: string; search: string; hash: string; state: unknown };
}