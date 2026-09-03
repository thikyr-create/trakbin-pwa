import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../src/services/supabase';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    })();
  }, []);

  return null;
}