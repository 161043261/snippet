import { useState, useEffect, type ChangeEvent, type FC } from "react";

export const PromptForm: FC = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (status && status !== "Submitting...") {
      const timer = setTimeout(() => {
        setStatus("");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSubmit = async (e: ChangeEvent) => {
    e.preventDefault();
    setStatus("Submitting...");

    try {
      const response = await fetch("/prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          content,
        }),
      });

      if (response.ok) {
        setStatus("Prompt created successfully!");
        setName("");
        setDescription("");
        setContent("");
      } else {
        const data = await response.json();
        setStatus(`Error: ${data.error || "Failed to create prompt"}`);
      }
    } catch (err) {
      setStatus("Error: Network error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-white p-8 border border-gray-200 rounded-lg shadow-md w-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Create New Prompt
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. code-reviewer"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Description of the prompt"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
            placeholder="The prompt content..."
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Create Prompt
        </button>
      </form>

      {status && (
        <div
          className={`mt-4 p-3 rounded-md ${
            status.includes("Error")
              ? "bg-red-50 text-red-500"
              : "bg-green-50 text-green-500"
          }`}
        >
          {status}
        </div>
      )}
    </div>
  );
};

export default PromptForm;
