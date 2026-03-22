import { useState, useMemo } from "react";
import {
  Stethoscope,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  SkipForward,
  Clock,
  Lightbulb,
  PhoneCall,
} from "lucide-react";
import NetworkDiagnoseSDK from "../sdk/network-diagnose-sdk";
import type {
  DiagnosticResult,
  SDKConfig,
  ApiCheckResult,
  ResourceCheckResult,
  LocationInfo,
  SpeedTestResult,
  NetworkInfo,
} from "../sdk/types";

interface NetworkDiagnosePanelProps {
  config: Omit<SDKConfig, "onResultsUpdate">;
  title?: string;
  onCallAction?: () => void;
}

const NetworkDiagnosePanel: React.FC<NetworkDiagnosePanelProps> = ({
  config,
  title = "Network Diagnostics",
  onCallAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId] = useState(() => Date.now().toString().slice(-6));

  const sdk = useMemo(
    () =>
      new NetworkDiagnoseSDK({
        ...config,
        onResultsUpdate: (newResults) => {
          setResults(newResults);
        },
      }),
    [config],
  ); // Re-create SDK if config changes

  const startDiagnosis = async () => {
    setIsRunning(true);
    await sdk.runFullDiagnosis();
    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "failure":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "skipped":
        return <SkipForward className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-300" />;
    }
  };

  const renderDetails = (result: DiagnosticResult) => {
    if (!result.details) return null;

    if (result.id === "network-status") {
      const info = result.details as NetworkInfo;
      return (
        <div className="text-xs text-gray-600 mt-1 pl-6">
          <p>Online: {info.online ? "Yes" : "No"}</p>
          <p>
            Network Type: {info.type || "Unknown"}{" "}
            {info.effectiveType ? `(${info.effectiveType})` : ""}
          </p>
          <p>
            Downlink:{" "}
            {info.downlink !== undefined ? `${info.downlink} Mbps` : "Unknown"}
          </p>
          <p>
            Max Downlink:{" "}
            {info.downlinkMax !== undefined
              ? `${info.downlinkMax} Mbps`
              : "Unknown"}
          </p>
          <p>RTT: {info.rtt !== undefined ? `${info.rtt} ms` : "Unknown"}</p>
          <p>
            Data Saver:{" "}
            {info.saveData !== undefined
              ? info.saveData
                ? "On"
                : "Off"
              : "Unknown"}
          </p>
        </div>
      );
    }

    if (result.id === "location-check") {
      const info = result.details as LocationInfo;
      return (
        <div className="text-xs text-gray-600 mt-1 pl-6">
          <p>IP: {info.ip}</p>
          <p>
            Location: {info.city}, {info.region}, {info.country}
          </p>
          <p>ISP: {info.isp}</p>
        </div>
      );
    }

    if (result.id === "speed-test") {
      const info = result.details as SpeedTestResult;
      return (
        <div className="text-xs text-gray-600 mt-1 pl-6">
          <p>Download Speed: {info.downloadSpeedMbps} Mbps</p>
          <p>Latency: {info.latencyMs} ms</p>
        </div>
      );
    }

    if (result.id === "api-check") {
      const list = result.details as ApiCheckResult[];
      return (
        <div className="text-xs text-gray-600 mt-1 pl-6 max-h-32 overflow-y-auto">
          {list.map((item, idx) => (
            <div
              key={idx}
              className={`flex justify-between ${item.ok ? "text-green-600" : "text-red-600"}`}
            >
              <span className="truncate max-w-50">{item.url}</span>
              <span>
                {item.status} ({item.timeMs}ms)
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (result.id === "resource-check") {
      const list = result.details as ResourceCheckResult[];
      return (
        <div className="text-xs text-gray-600 mt-1 pl-6 max-h-32 overflow-y-auto">
          {list.map((item, idx) => (
            <div
              key={idx}
              className={`flex justify-between ${item.loaded ? "text-green-600" : "text-red-600"}`}
            >
              <span className="truncate max-w-50">{item.url}</span>
              <span>
                {item.loaded ? "OK" : "Fail"} ({item.timeMs}ms)
              </span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="text-xs text-gray-500 pl-6">
        {JSON.stringify(result.details)}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50 flex items-center gap-2 transition-all"
      >
        <Stethoscope className="w-5 h-5" />
        <span>Network Diagnostics</span>
      </button>
    );
  }

  const hasFailures = results.some((r) => r.status === "failure");

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl z-50 border border-gray-200 flex flex-col max-h-[80vh]">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center rounded-t-lg">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <Stethoscope className="w-5 h-5" /> {title}
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {results.length === 0 && !isRunning ? (
          <div className="text-center py-8 text-gray-500">
            <p>Click the button below to start network diagnostics</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                className="border-b border-gray-100 pb-2 last:border-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-2 font-medium text-sm text-gray-700">
                    {getStatusIcon(result.status)} {result.name}
                  </span>
                  {result.duration !== undefined && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {result.duration}ms
                    </span>
                  )}
                </div>
                {result.message && (
                  <div className="text-xs text-gray-500 pl-6 mb-1">
                    {result.message}
                  </div>
                )}
                {renderDetails(result)}
                {result.recommendation && (
                  <div className="mt-2 text-xs bg-yellow-50 text-yellow-700 p-2 rounded ml-6 border border-yellow-100 flex items-start gap-1">
                    <Lightbulb className="w-4 h-4 shrink-0" />
                    <span>Recommendation: {result.recommendation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg space-y-2">
        <button
          onClick={startDiagnosis}
          disabled={isRunning}
          className={`w-full py-2 px-4 rounded-md font-medium text-white transition-colors flex justify-center items-center gap-2 ${
            isRunning
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 shadow-sm"
          }`}
        >
          {isRunning && <Loader2 className="w-4 h-4 animate-spin" />}
          {isRunning ? "Diagnosing..." : "Start Diagnosis"}
        </button>

        {hasFailures && (
          <button
            onClick={
              onCallAction || (() => alert("Oncall function not configured"))
            }
            className="w-full py-2 px-4 rounded-md font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4" /> Contact Oncall Support
          </button>
        )}

        <div className="text-center text-xs text-gray-400 mt-2">
          Diagnostic ID: {sessionId}
        </div>
      </div>
    </div>
  );
};

export default NetworkDiagnosePanel;
