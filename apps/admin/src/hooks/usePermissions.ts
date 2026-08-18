import { useState, useEffect } from 'react';
import { getUser, SessionUser } from '../lib/auth-session';

export function usePermissions() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const can = (permission: string): boolean => {
    if (!user || !user.permisos) return false;
    return user.permisos.includes('*') || user.permisos.includes(permission);
  };

  return { can, user };
}
