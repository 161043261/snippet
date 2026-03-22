import type {
  DiagnosticResult,
  SDKConfig,
  NetworkInfo,
  SpeedTestResult,
  ApiCheckResult,
  ResourceCheckResult,
  LocationInfo,
  DiagnosticCallback,
} from "./types";

interface NavigatorConnection extends EventTarget {
  effectiveType?: string;
  downlink?: number;
  downlinkMax?: number;
  rtt?: number;
  saveData?: boolean;
  type?: string;
}

class NetworkDiagnoseSDK {
  private config: SDKConfig;
  private results: DiagnosticResult[] = [];
  private listeners: DiagnosticCallback[] = [];

  constructor(config: SDKConfig) {
    this.config = config;
    if (config.onResultsUpdate) {
      this.subscribe(config.onResultsUpdate);
    }
    this.setupNetworkListeners();
  }

  private setupNetworkListeners() {
    const handleConnectionChange = () => {
      // If we already have a network-status result, update it dynamically
      const hasNetworkResult = this.results.some(
        (r) => r.id === "network-status",
      );
      if (hasNetworkResult) {
        this.checkNetworkStatus();
      }
    };

    window.addEventListener("online", handleConnectionChange);
    window.addEventListener("offline", handleConnectionChange);

    const nav = navigator as unknown as {
      connection?: NavigatorConnection;
      mozConnection?: NavigatorConnection;
      webkitConnection?: NavigatorConnection;
    };
    const connection =
      nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection && typeof connection.addEventListener === "function") {
      connection.addEventListener("change", handleConnectionChange);
    }
  }

  public subscribe(callback: DiagnosticCallback) {
    this.listeners.push(callback);
    // Emit current state immediately
    callback(this.results);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private emit() {
    this.listeners.forEach((listener) => listener([...this.results]));
  }

  private addResult(result: DiagnosticResult) {
    const existingIndex = this.results.findIndex((r) => r.id === result.id);
    if (existingIndex >= 0) {
      this.results[existingIndex] = result;
    } else {
      this.results.push(result);
    }
    this.emit();
  }

  private updateResult(id: string, updates: Partial<DiagnosticResult>) {
    const index = this.results.findIndex((r) => r.id === id);
    if (index >= 0) {
      this.results[index] = { ...this.results[index], ...updates };
      this.emit();
    }
  }

  public async runFullDiagnosis() {
    this.results = [];
    this.emit();

    const tasks = [
      this.checkNetworkStatus(),
      this.checkLocation(),
      this.checkSpeed(),
      this.checkApiConnectivity(),
      this.checkResources(),
      ...this.runCustomTasks(),
    ];

    await Promise.allSettled(tasks);
  }

  private runCustomTasks() {
    if (!this.config.customTasks) return [];

    return this.config.customTasks.map(async (task) => {
      this.addResult({ id: task.id, name: task.name, status: "running" });
      const start = performance.now();
      try {
        const details = await task.run();
        this.updateResult(task.id, {
          status: "success",
          details,
          duration: Math.round(performance.now() - start),
        });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown Error";
        this.updateResult(task.id, {
          status: "failure",
          error: message,
          duration: Math.round(performance.now() - start),
        });
      }
    });
  }

  private async checkNetworkStatus() {
    const id = "network-status";
    this.addResult({ id, name: "Basic Network Status", status: "running" });

    try {
      const online = navigator.onLine;
      const nav = navigator as unknown as {
        connection?: NavigatorConnection;
        mozConnection?: NavigatorConnection;
        webkitConnection?: NavigatorConnection;
      };
      const connection =
        nav.connection || nav.mozConnection || nav.webkitConnection;

      const info: NetworkInfo = {
        online,
        type: connection?.type,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        downlinkMax: connection?.downlinkMax,
        rtt: connection?.rtt,
        saveData: connection?.saveData,
      };

      if (!online) {
        throw new Error("Browser reports offline status");
      }

      const networkType = info.type ? `${info.type} / ` : "";
      const dataSaver = info.saveData ? " (Data Saver Mode)" : "";

      this.updateResult(id, {
        status: "success",
        details: info,
        message: `Online (${networkType}${info.effectiveType || "Unknown"}${dataSaver}), RTT: ${info.rtt || "?"}ms`,
        duration: 0,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      this.updateResult(id, {
        status: "failure",
        error: message,
        recommendation:
          "Please ensure your device is connected to a network (WiFi/Ethernet).",
      });
    }
  }

  private async checkLocation() {
    const id = "location-check";
    this.addResult({ id, name: "Location & ISP Check", status: "running" });

    try {
      // Use a public IP API. In production, this should be your own backend endpoint.
      // Using ipapi.co as an example (rate limited, but good for demo)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("https://ipapi.co/json/", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const location: LocationInfo = {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country_name,
        isp: data.org,
      };

      this.updateResult(id, {
        status: "success",
        details: location,
        message: `${location.city}, ${location.region}, ${location.country} (${location.isp})`,
        duration: 0, // Fetch time could be tracked if needed
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      this.updateResult(id, {
        status: "failure",
        error: `Failed to retrieve location information: ${message}`,
        recommendation:
          "This might be due to network blocking or API rate limits. Core functionality is not affected.",
      });
    }
  }

  private async checkSpeed() {
    const id = "speed-test";
    // Default to a small image if not provided.
    // Using a reliable CDN asset (e.g. Google logo or similar small file)
    const testUrl =
      this.config.speedTestFileUrl ||
      "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png";

    this.addResult({ id, name: "Speed Test", status: "running" });

    try {
      const startTime = performance.now();
      const response = await fetch(testUrl + "?t=" + startTime, {
        cache: "no-store",
      });
      const endTime = performance.now();

      if (!response.ok) throw new Error("Failed to download test file");

      const blob = await response.blob();
      const sizeInBits = blob.size * 8;
      const durationInSeconds = (endTime - startTime) / 1000;
      const bps = sizeInBits / durationInSeconds;
      const mbps = (bps / (1024 * 1024)).toFixed(2);

      this.updateResult(id, {
        status: "success",
        details: {
          downloadSpeedMbps: parseFloat(mbps),
          latencyMs: Math.round(endTime - startTime),
        } as SpeedTestResult,
        message: `Download Speed: ${mbps} Mbps`,
        duration: Math.round(endTime - startTime),
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      this.updateResult(id, {
        status: "failure",
        error: message,
        recommendation:
          "Network connection may be unstable. Try switching to a different network environment.",
      });
    }
  }

  private async checkApiConnectivity() {
    const id = "api-check";
    const apiList = this.config.apiList || [];

    if (apiList.length === 0) {
      this.addResult({
        id,
        name: "API Connectivity",
        status: "skipped",
        message: "No API list configured",
      });
      return;
    }

    this.addResult({ id, name: "API Connectivity", status: "running" });

    const results: ApiCheckResult[] = [];
    let failures = 0;

    for (const url of apiList) {
      const start = performance.now();
      try {
        const res = await fetch(url, {
          method: "HEAD",
          mode: "no-cors",
          cache: "no-store",
        });
        // Note: mode: 'no-cors' limits access to status, but ensures we can at least reach the server
        // if CORS is not set up for HEAD. However, 'no-cors' returns opaque response (status 0).
        // If we need status, we need CORS. Assuming these are our APIs or public ones.
        // Let's try GET if HEAD fails or for better compatibility if APIs support it.
        // For 'no-cors', we can't read status, but if promise resolves, it means network is ok-ish.

        results.push({
          url,
          status: res.status,
          ok: res.type === "opaque" ? true : res.ok,
          timeMs: Math.round(performance.now() - start),
        });
      } catch {
        failures++;
        results.push({
          url,
          status: 0,
          ok: false,
          timeMs: Math.round(performance.now() - start),
        });
      }
    }

    const allOk = failures === 0;
    this.updateResult(id, {
      status: allOk ? "success" : "failure",
      details: results,
      message: `${results.length - failures}/${results.length} API reachable`,
      recommendation: !allOk
        ? "Some APIs are unreachable. Please check your firewall or the service status."
        : undefined,
      duration: Math.max(...results.map((r) => r.timeMs)), // Max duration of parallel checks
    });
  }

  private async checkResources() {
    const id = "resource-check";
    const resourceList = this.config.resourceList || [];

    if (resourceList.length === 0) {
      this.addResult({
        id,
        name: "Static Resource Loading",
        status: "skipped",
        message: "No resource list configured",
      });
      return;
    }

    this.addResult({ id, name: "Static Resource Loading", status: "running" });

    const results: ResourceCheckResult[] = [];
    let failures = 0;

    const checkImage = (url: string): Promise<ResourceCheckResult> => {
      return new Promise((resolve) => {
        const start = performance.now();
        const img = new Image();
        img.onload = () => {
          resolve({
            url,
            loaded: true,
            timeMs: Math.round(performance.now() - start),
          });
        };
        img.onerror = () => {
          resolve({
            url,
            loaded: false,
            timeMs: Math.round(performance.now() - start),
          });
        };
        img.src = url + "?t=" + Date.now(); // Prevent cache
      });
    };

    const checks = resourceList.map((url) => checkImage(url));
    const checkResults = await Promise.all(checks);

    checkResults.forEach((res) => {
      if (!res.loaded) failures++;
      results.push(res);
    });

    const allOk = failures === 0;
    this.updateResult(id, {
      status: allOk ? "success" : "failure",
      details: results,
      message: `${results.length - failures}/${results.length} resources loaded successfully`,
      recommendation: !allOk
        ? "Failed to load CDN resources. This might be due to a CDN node failure or a local DNS issue."
        : undefined,
      duration: Math.max(...results.map((r) => r.timeMs)),
    });
  }

  public getResults() {
    return this.results;
  }
}

export default NetworkDiagnoseSDK;
