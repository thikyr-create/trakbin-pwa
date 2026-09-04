import { useEffect, useState } from 'react';

export function useDriverNotifications() {
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);

  const markSeen = () => {
    setUnread(0);
  };

  return { items, unread, markSeen };
}