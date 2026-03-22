export interface DiagnosticResult {
  id: string;
  name: string;
  status: "pending" | "running" | "success" | "failure" | "skipped";
  message?: string;
  details?: unknown;
  error?: string;
  duration?: number;
  recommendation?: string;
}

export interface NetworkInfo {
  online: boolean;
  type?: string; // wifi, cellular, bluetooth, ethernet, none, etc.
  effectiveType?: string; // 'slow-2g', '2g', '3g', or '4g'
  downlink?: number; // effective bandwidth in Mbps
  downlinkMax?: number; // max bandwidth in Mbps
  rtt?: number; // round-trip time in ms
  saveData?: boolean; // user requested reduced data usage
}

export interface SpeedTestResult {
  downloadSpeedMbps: number;
  latencyMs?: number;
}

export interface ApiCheckResult {
  url: string;
  status: number;
  ok: boolean;
  timeMs: number;
}

export interface ResourceCheckResult {
  url: string;
  loaded: boolean;
  timeMs: number;
}

export interface LocationInfo {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  isp?: string;
}

export type DiagnosticCallback = (results: DiagnosticResult[]) => void;

export interface CustomTask {
  id: string;
  name: string;
  run: () => Promise<unknown>; // Return details on success, throw error on failure
}

export interface SDKConfig {
  apiList?: string[];
  resourceList?: string[]; // Images, scripts, etc.
  speedTestFileUrl?: string; // URL for download speed test
  customTasks?: CustomTask[];
  onResultsUpdate?: DiagnosticCallback;
}
