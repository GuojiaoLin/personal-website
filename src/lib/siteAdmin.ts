import { useCallback, useEffect, useState } from 'react';
import { type AdminUser, getCurrentAdmin, logoutAdmin } from './adminApi';

export const useSiteAdmin = () => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const refreshAdmin = useCallback(async () => {
    try {
      const currentAdmin = await getCurrentAdmin();
      setAdmin(currentAdmin);
    } catch {
      setAdmin(null);
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshAdmin();
  }, [refreshAdmin]);

  return {
    isAuthReady,
    isOwner: Boolean(admin),
    ownerEmail: admin?.email ?? '',
    admin,
    refreshAdmin,
  };
};

export const signOutSiteAdmin = logoutAdmin;
