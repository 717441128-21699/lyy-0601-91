import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Settings from "@/pages/Settings";
import SongSelect from "@/pages/SongSelect";
import DifficultySelect from "@/pages/DifficultySelect";
import GamePlay from "@/pages/GamePlay";
import Result from "@/pages/Result";
import PackManager from "@/pages/PackManager";
import Practice from "@/pages/Practice";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/songs" element={<SongSelect />} />
        <Route path="/difficulty/:songId" element={<DifficultySelect />} />
        <Route path="/play/:songId/:difficultyId" element={<GamePlay />} />
        <Route path="/result/:songId/:difficultyId" element={<Result />} />
        <Route path="/packs" element={<PackManager />} />
        <Route path="/practice/:songId" element={<Practice />} />
      </Routes>
    </Router>
  );
}
