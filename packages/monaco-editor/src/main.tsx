import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

declare global {
  interface Window {
    MonacoEnvironment: {
      getWorker(workerId: string, label: string): Worker;
    };
  }
}

const getWorker = (_worker: string, label: string): Worker => {
  switch (label) {
    case "json":
      return new Worker(new URL("./worker/json.worker.ts", import.meta.url), {
        type: "module",
      });
    case "css":
    case "scss":
    case "less":
      return new Worker(new URL("./worker/css.worker.ts", import.meta.url), {
        type: "module",
      });
    case "html":
    case "handlebars":
    case "razor":
      return new Worker(new URL("./worker/html.worker.ts", import.meta.url), {
        type: "module",
      });
    case "javascript":
    case "typescript":
      return new Worker(new URL("./worker/ts.worker.ts", import.meta.url), {
        type: "module",
      });
    case "flinksql":
      return new Worker(
        new URL("./worker/flinksql.worker.ts", import.meta.url),
        {
          type: "module",
        },
      );
    default:
      return new Worker(new URL("./worker/editor.worker.ts", import.meta.url), {
        type: "module",
      });
  }
};

window.MonacoEnvironment = {
  getWorker,
};

createRoot(document.getElementById("root")!).render(<App />);
