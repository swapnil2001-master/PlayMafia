import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import RoomPage from "./pages/RoomPage";
import ConfigPage from "./pages/ConfigPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<CreateRoom />} />
      <Route path="/join" element={<JoinRoom />} />
      {/* Deep link from a shared invite / QR code. */}
      <Route path="/join/:code" element={<JoinRoom />} />
      <Route path="/room/:code" element={<RoomPage />} />
      <Route path="/room/:code/config" element={<ConfigPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
