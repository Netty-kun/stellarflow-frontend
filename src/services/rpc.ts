import {
  DEFAULT_RPC_NODES,
  type StellarRpcNode,
  type NetworkTarget,
} from '../config/rpcNodes';

export type SorobanServerLike = {
  readonly serverURL: string;
  [key: string]: unknown;
};

export interface RpcEndpointConfig {
  id?: string;
  name?: string;
  url: string;
  priority: number;
  network: NetworkTarget;
  type?: 'soroban' | 'horizon' | 'hybrid';
}

export interface RpcLatencyRecord {
  url: string;
  avgLatency: number;
  lastLatency: number;
  sampleCount: number;
  isAvailable: boolean;
  lastError: string | null;
}

interface LatencyEntry {
  samples: number[];
  lastError: string | null;
}

const DEFAULT_ENDPOINTS: RpcEndpointConfig[] = DEFAULT_RPC_NODES.map((node, index) => ({
  id: node.id,
  name: node.name,
  url: node.url,
  priority: node.isDefault ? 1 : index + 2,
  network: node.network,
  type: node.type,
}));

export class RpcManager {
  private endpoints: RpcEndpointConfig[] = [];
  private servers: Map<string, SorobanServerLike> = new Map();
  private currentUrl: string;
  private latencies: Map<string, LatencyEntry> = new Map();
  private stellarSdk: unknown = null;

  constructor(endpoints?: RpcEndpointConfig[]) {
    this.endpoints = (endpoints ?? DEFAULT_ENDPOINTS).sort((a, b) => a.priority - b.priority);
    this.currentUrl = this.endpoints[0]?.url ?? '';
  }

  private async getSdk(): Promise<any> {
    if (!this.stellarSdk) {
      this.stellarSdk = await import('@stellar/stellar-sdk');
    }
    return this.stellarSdk;
  }

  async getServer(url?: string): Promise<SorobanServerLike> {
    const targetUrl = url ?? this.currentUrl;
    let server = this.servers.get(targetUrl);
    if (!server) {
      const sdk = await this.getSdk();
      const ServerClass = sdk.rpc?.Server ?? sdk.SorobanRpc?.Server;
      if (ServerClass) {
        server = new ServerClass(targetUrl, { allowHttp: true });
        this.servers.set(targetUrl, server as SorobanServerLike);
      } else {
        server = { serverURL: targetUrl } as SorobanServerLike;
        this.servers.set(targetUrl, server);
      }
    }
    return server as SorobanServerLike;
  }

  getCurrentEndpoint(): RpcEndpointConfig | undefined {
    return this.endpoints.find((e) => e.url === this.currentUrl);
  }

  setCurrentEndpoint(url: string): boolean {
    const existing = this.endpoints.find((e) => e.url === url);
    if (existing) {
      this.currentUrl = url;
      return true;
    }
    // If not registered, add it dynamically
    this.endpoints.unshift({
      url,
      priority: 0,
      network: 'testnet',
      name: 'Custom Node',
    });
    this.currentUrl = url;
    return true;
  }

  isRetryableError(error: unknown): boolean {
    if (!error) return false;

    const err = error as Record<string, unknown>;
    const status = (err.status ?? err.statusCode ?? (err.response as Record<string, unknown>)?.status) as number | undefined;

    if (status === 429 || (typeof status === 'number' && status >= 500 && status < 600)) {
      return true;
    }

    const msg = (err.message ?? String(error)).toString().toLowerCase();
    return (
      msg.includes('rate limit') ||
      msg.includes('rate_limit') ||
      msg.includes('timeout') ||
      msg.includes('econnrefused') ||
      msg.includes('econnreset') ||
      msg.includes('network error') ||
      msg.includes('fetch failed')
    );
  }

  failover(network?: NetworkTarget): string {
    const filtered = network
      ? this.endpoints.filter((e) => e.network === network)
      : this.endpoints;

    if (filtered.length === 0) return this.currentUrl;

    const currentIdx = filtered.findIndex((e) => e.url === this.currentUrl);
    const nextIdx = (currentIdx + 1) % filtered.length;
    this.currentUrl = filtered[nextIdx].url;
    return this.currentUrl;
  }

  recordLatency(url: string, durationMs: number, error: string | null): void {
    let entry = this.latencies.get(url);
    if (!entry) {
      entry = { samples: [], lastError: null };
      this.latencies.set(url, entry);
    }
    entry.samples.push(durationMs);
    entry.lastError = error;
    if (entry.samples.length > 100) {
      entry.samples.shift();
    }
  }

  /**
   * Ping any Stellar RPC or Horizon endpoint to measure round-trip latency.
   */
  async pingEndpoint(
    url: string,
    timeoutMs = 6000,
  ): Promise<{ latencyMs: number; error: string | null }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const start = performance.now();

    try {
      // First try Soroban JSON-RPC getHealth
      const isHorizon = url.includes('horizon');
      if (isHorizon) {
        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } else {
        const res = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json().catch(() => null);
        if (json?.error) {
          throw new Error(json.error.message ?? 'Soroban RPC error');
        }
      }

      const duration = Math.round(performance.now() - start);
      this.recordLatency(url, duration, null);
      return { latencyMs: duration, error: null };
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      const errMsg = err instanceof Error ? err.message : 'Ping failed';
      this.recordLatency(url, duration, errMsg);
      return { latencyMs: duration, error: errMsg };
    } finally {
      clearTimeout(timer);
    }
  }

  async execute<T>(operation: (server: SorobanServerLike) => Promise<T>): Promise<T> {
    const attempts = this.endpoints.length;
    for (let i = 0; i < attempts; i++) {
      const endpoint =
        this.endpoints.find((e) => e.url === this.currentUrl) ?? this.endpoints[i];
      const server = await this.getServer(endpoint.url);
      const startTime = performance.now();

      try {
        const result = await operation(server);
        const duration = performance.now() - startTime;
        this.recordLatency(endpoint.url, duration, null);
        return result;
      } catch (error: unknown) {
        const duration = performance.now() - startTime;
        const errMsg = error instanceof Error ? error.message : String(error);
        this.recordLatency(endpoint.url, duration, errMsg);

        if (this.isRetryableError(error) && i < attempts - 1) {
          console.warn(
            `[RpcManager] Failover from ${endpoint.url} due to: ${errMsg}. Trying next endpoint...`,
          );
          this.failover(endpoint.network);
        } else {
          throw error;
        }
      }
    }
    throw new Error('[RpcManager] All RPC endpoints exhausted.');
  }

  getLatencyStats(): RpcLatencyRecord[] {
    return this.endpoints.map((ep) => {
      const entry = this.latencies.get(ep.url);
      const samples = entry?.samples ?? [];
      const avg =
        samples.length > 0
          ? samples.reduce((a, b) => a + b, 0) / samples.length
          : 0;
      return {
        url: ep.url,
        avgLatency: Math.round(avg * 10) / 10,
        lastLatency: samples.length > 0 ? samples[samples.length - 1] : 0,
        sampleCount: samples.length,
        isAvailable: !entry?.lastError,
        lastError: entry?.lastError ?? null,
      };
    });
  }

  getEndpoints(): RpcEndpointConfig[] {
    return [...this.endpoints];
  }

  addEndpoint(config: RpcEndpointConfig): void {
    const exists = this.endpoints.some((e) => e.url === config.url);
    if (!exists) {
      this.endpoints.push(config);
      this.endpoints.sort((a, b) => a.priority - b.priority);
    }
  }

  removeEndpoint(url: string): void {
    this.endpoints = this.endpoints.filter((e) => e.url !== url);
    this.servers.delete(url);
    this.latencies.delete(url);
    if (this.currentUrl === url) {
      this.currentUrl = this.endpoints[0]?.url ?? '';
    }
  }
}

export const rpcManager = new RpcManager();