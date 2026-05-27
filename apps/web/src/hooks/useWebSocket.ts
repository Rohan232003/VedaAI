'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAssignmentStore } from '@/store/assignmentStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>(undefined);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  const { setGenerationStatus, updateAssignmentStatus, fetchAssignment } = useAssignmentStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type, assignmentId, data } = msg;

          switch (type) {
            case 'job_queued':
              updateAssignmentStatus(assignmentId, 'queued');
              setGenerationStatus({ assignmentId, progress: 0, message: data?.message || 'Queued...' });
              break;
            case 'job_started':
              updateAssignmentStatus(assignmentId, 'generating');
              setGenerationStatus({ assignmentId, progress: data?.progress || 10, message: data?.message || 'Starting...' });
              break;
            case 'job_progress':
              setGenerationStatus({ assignmentId, progress: data?.progress || 50, message: data?.message || 'Processing...' });
              break;
            case 'job_completed':
              updateAssignmentStatus(assignmentId, 'completed');
              setGenerationStatus({ assignmentId, progress: 100, message: data?.message || 'Done!' });
              fetchAssignment(assignmentId);
              setTimeout(() => setGenerationStatus(null), 2000);
              break;
            case 'job_failed':
              updateAssignmentStatus(assignmentId, 'failed');
              setGenerationStatus({ assignmentId, progress: 0, message: data?.error || 'Failed' });
              setTimeout(() => setGenerationStatus(null), 5000);
              break;
          }
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // Connection failed — will retry
    }
  }, [setGenerationStatus, updateAssignmentStatus, fetchAssignment]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}
