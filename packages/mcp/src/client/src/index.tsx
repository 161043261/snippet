import { createRoot } from "react-dom/client";
import PromptForm from "./prompt-form.js";
import "./index.css";

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <PromptForm />
    </div>
  );
};

const container = document.getElementById("app");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
