/**
 * Routing / ETA abstraction. The rest of the app depends on the `RoutingService`
 * interface, never on a concrete provider (Dependency Inversion) — so we can
 * swap Google for OSRM/Mapbox by adding one adapter, with zero call-site changes.
 *
 * Cost note: Google Directions is billed per request. We therefore fetch the
 * full route ONCE (cached on the Delivery) and only re-query for ETA on a
 * throttle (ETA_REFRESH_INTERVAL_MS) — never per GPS ping.
 */
import { env } from '../config/env';
import { logger } from '../utils/logger';
import type { LngLat } from '../utils/geo';

export interface RouteResult {
  polyline: string; // encoded polyline (overview)
  distanceM: number;
  durationS: number;
}

export interface RoutingService {
  /** Returns the driving route from origin to destination, or null if unavailable. */
  getRoute(origin: LngLat, destination: LngLat): Promise<RouteResult | null>;
}

class GoogleDirectionsAdapter implements RoutingService {
  constructor(private readonly apiKey: string) {}

  async getRoute(origin: LngLat, destination: LngLat): Promise<RouteResult | null> {
    try {
      const params = new URLSearchParams({
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        mode: 'driving',
        key: this.apiKey,
      });
      const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;

      // 5s timeout so a slow provider never blocks the request/socket loop.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        logger.warn(`Directions HTTP ${res.status}`);
        return null;
      }
      const json: any = await res.json();
      if (json.status !== 'OK' || !json.routes?.length) {
        logger.warn(`Directions status ${json.status}`);
        return null;
      }
      const route = json.routes[0];
      const legs: any[] = route.legs || [];
      const distanceM = legs.reduce((s, l) => s + (l.distance?.value || 0), 0);
      const durationS = legs.reduce((s, l) => s + (l.duration?.value || 0), 0);
      return {
        polyline: route.overview_polyline?.points || '',
        distanceM,
        durationS,
      };
    } catch (err) {
      logger.error('GoogleDirectionsAdapter.getRoute failed:', err);
      return null;
    }
  }
}

/** No-op adapter — used when no provider/key is configured. Degrades to "ETA unavailable". */
class NullRoutingService implements RoutingService {
  async getRoute(): Promise<RouteResult | null> {
    return null;
  }
}

let instance: RoutingService | null = null;

export function getRoutingService(): RoutingService {
  if (instance) return instance;
  if (env.ROUTING_PROVIDER === 'google' && env.GOOGLE_MAPS_API_KEY) {
    instance = new GoogleDirectionsAdapter(env.GOOGLE_MAPS_API_KEY);
  } else {
    if (env.ROUTING_PROVIDER === 'google') {
      logger.warn('ROUTING_PROVIDER=google but GOOGLE_MAPS_API_KEY is empty — ETA disabled.');
    }
    instance = new NullRoutingService();
  }
  return instance;
}
