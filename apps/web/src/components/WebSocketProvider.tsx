'use client';

import { useWebSocket } from '@/hooks/useWebSocket';

export default function WebSocketProvider() {
  useWebSocket();
  return null;
}
