import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Overview from "./pages/Overview";
import CPU from "./pages/CPU";
import Memory from "./pages/Memory";
import Disk from "./pages/Disk";
import Network from "./pages/Network";
import Processes from "./pages/Processes";
import Services from "./pages/Services";
import Docker from "./pages/Docker";
import Logs from "./pages/Logs";
import Optimize from "./pages/Optimize";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="cpu" element={<CPU />} />
        <Route path="memory" element={<Memory />} />
        <Route path="disk" element={<Disk />} />
        <Route path="network" element={<Network />} />
        <Route path="processes" element={<Processes />} />
        <Route path="services" element={<Services />} />
        <Route path="docker" element={<Docker />} />
        <Route path="logs" element={<Logs />} />
        <Route path="optimize" element={<Optimize />} />
      </Route>
    </Routes>
  );
}
