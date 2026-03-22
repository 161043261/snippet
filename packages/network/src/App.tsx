import NetworkDiagnosePanel from "./components/network-diagnose-panel";

function App() {
  const diagnosticConfig = {
    apiList: [
      "https://api.github.com",
      "https://jsonplaceholder.typicode.com/todos/1",
      "https://httpbin.org/get",
    ],
    resourceList: [
      "https://vitejs.dev/logo.svg",
      "https://react.dev/favicon.ico",
      "https://www.google.com/favicon.ico",
    ],
    speedTestFileUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/3d/LARGE_elevation.jpg", // ~1.5MB file
  };

  const handleOnCall = () => {
    // In a real app, this would open a ticket or chat
    alert(
      "Initiating Oncall support request...\n(Simulation: Ticket created, technical support will contact you shortly)",
    );
  };

  return (
    <>
      <NetworkDiagnosePanel
        config={diagnosticConfig}
        onCallAction={handleOnCall}
      />
    </>
  );
}

export default App;
