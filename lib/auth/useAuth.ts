import { useAuthStore } from '@/lib/store/authStore';
import { authEngine } from './authEngine';
import { ROLE_HOME, ROLE_LABEL } from './permissions';

export function useAuth() {
  const { role, account, loaded } = useAuthStore();
  return {
    role, account, loaded,
    isAuthenticated: !!role,
    home: role ? ROLE_HOME[role] : null,
    roleLabel: role ? ROLE_LABEL[role] : null,
    signIn: authEngine.login,
    signOut: authEngine.signOut,
  };
}