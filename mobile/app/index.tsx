// mobile/app/index.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const { status, role } = useAuthStore();
  if (status === 'signedOut') return <Redirect href="./login" />;
  if (role === 'driver') return <Redirect href="./driver" />;
  if (role === 'caretaker') return <Redirect href="./customer" />;
  return null;
}