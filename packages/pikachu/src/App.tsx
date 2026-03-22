import { Route, Routes } from "react-router-dom";
import Home from "./pages/home";

import Fallback from "./pages/fallback";
import CssPikachu from "./pages/css";
import CanvasPikachu from "./pages/canvas";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/css" element={<CssPikachu />} />
      <Route path="/canvas" element={<CanvasPikachu />} />
      <Route path="*" element={<Fallback />} />
    </Routes>
  );
}

export default App;
