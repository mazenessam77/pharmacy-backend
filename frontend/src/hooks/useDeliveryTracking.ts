'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { getSocket, connectSocket } from '@/lib/socket';
import { deliveryService } from '@/lib/services/deliveryService';
import type {
  TrackingSnapshot,
  LngLat,
  LocationEvent,
  EtaEvent,
  StatusEvent,
} from '@/types/delivery';

export type TrackingState = 'loading' | 'none' | 'error' | 'ready';

export interface UseDeliveryTracking {
  state: TrackingState;
  snapshot: TrackingSnapshot | null;
  connected: boolean;
  /** Smoothly interpolated driver position for the map marker (never jumps). */
  driverPosition: LngLat | null;
  refetch: () => void;
}

/**
 * Owns the entire realtime tracking lifecycle for one order:
 *  - REST snapshot (404 => no delivery yet => state 'none')
 *  - authorized socket subscription (delivery:location|eta|status)
 *  - auto-reconnect: re-subscribe + refetch to fill any gap
 *  - rAF marker interpolation so the driver glides instead of teleporting
 */
export function useDeliveryTracking(orderId: string | undefined): UseDeliveryTracking {
  const [state, setState] = useState<TrackingState>('loading');
  const [snapshot, setSnapshot] = useState<TrackingSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [driverPosition, setDriverPosition] = useState<LngLat | null>(null);

  const targetRef = useRef<LngLat | null>(null);
  const rafRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchSnapshot = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await deliveryService.getTracking(orderId);
      const data = res.data.data;
      setSnapshot(data);
      if (data.driverLocation) {
        const p = { lng: data.driverLocation.lng, lat: data.driverLocation.lat };
        targetRef.current = p;
        setDriverPosition((cur) => cur ?? p);
      }
      setState('ready');
    } catch (err: any) {
      setState(err?.response?.status === 404 ? 'none' : 'error');
    }
  }, [orderId]);

  // Smooth marker animation (ease toward the latest target each frame).
  useEffect(() => {
    const animate = () => {
      const target = targetRef.current;
      if (target) {
        setDriverPosition((cur) => {
          if (!cur) return target;
          const dLng = target.lng - cur.lng;
          const dLat = target.lat - cur.lat;
          if (Math.abs(dLng) < 1e-6 && Math.abs(dLat) < 1e-6) return target; // settled -> stable ref, no rerender
          return { lng: cur.lng + dLng * 0.18, lat: cur.lat + dLat * 0.18 };
        });
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    let teardown: (() => void) | null = null;

    fetchSnapshot();

    (async () => {
      await connectSocket(); // idempotent — ensures the patient socket is live
      const socket = await getSocket();
      if (!active) return;
      socketRef.current = socket;
      setConnected(socket.connected);

      const subscribe = () => socket.emit('delivery:subscribe', { orderId });
      subscribe();

      const onConnect = () => {
        setConnected(true);
        subscribe();
        fetchSnapshot(); // fill the gap created while disconnected
      };
      const onDisconnect = () => setConnected(false);
      const onLocation = (e: LocationEvent) => {
        targetRef.current = { lng: e.lng, lat: e.lat };
        setSnapshot((s) =>
          s
            ? {
                ...s,
                driverLocation: {
                  lng: e.lng,
                  lat: e.lat,
                  heading: e.heading,
                  speed: e.speed,
                  accuracy: e.accuracy,
                  recordedAt: e.recordedAt,
                },
              }
            : s
        );
      };
      const onEta = (e: EtaEvent) => setSnapshot((s) => (s ? { ...s, eta: e } : s));
      const onStatus = (e: StatusEvent) =>
        setSnapshot((s) =>
          s ? { ...s, status: e.status, timeline: [...s.timeline, { status: e.status, at: e.at }] } : s
        );

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('delivery:location', onLocation);
      socket.on('delivery:eta', onEta);
      socket.on('delivery:status', onStatus);

      teardown = () => {
        socket.emit('delivery:unsubscribe', { orderId });
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('delivery:location', onLocation);
        socket.off('delivery:eta', onEta);
        socket.off('delivery:status', onStatus);
      };
    })();

    return () => {
      active = false;
      teardown?.();
    };
  }, [orderId, fetchSnapshot]);

  return { state, snapshot, connected, driverPosition, refetch: fetchSnapshot };
}
