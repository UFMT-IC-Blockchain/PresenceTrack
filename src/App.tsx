import React from "react";
import "./App.css";
import { Routes, Route, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Claim from "./pages/Claim";
import Admin from "./pages/Admin";
import Supervisor from "./pages/Supervisor";
import Presence from "./pages/Presence";
import Presenca from "./pages/Presenca";
import Debugger from "./pages/Debugger.tsx";
import { useRoles } from "./hooks/useRoles";
import { useWallet } from "./hooks/useWallet";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import { OpLogProvider } from "./providers/OpLogProvider";
import OperationLogPanel from "./components/OperationLogPanel";
import Meetings from "./pages/Meetings";
import Profiles from "./pages/Profiles";
import Settings from "./pages/Settings";
import Sobre from "./pages/Sobre";

// Header removido; logos estão agora na Sidebar

const AppLayout: React.FC = () => {
  useRoles();
  useWallet();
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <main className="app-shell overlay-mode">
      <TopBar isOpen={menuOpen} onToggle={() => setMenuOpen((v) => !v)} />
      <Sidebar
        mode="overlay"
        open={menuOpen}
        onSelect={() => setMenuOpen(false)}
      />
      <div className="content-area">
        <Outlet />
      </div>
      <OperationLogPanel />
      <div id="globalModalRoot" />
    </main>
  );
};

function App() {
  return (
    <OpLogProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/credentials" element={<Claim />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/debug" element={<Debugger />} />
          <Route path="/debug/:contractName" element={<Debugger />} />
          <Route path="/claim" element={<Claim />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/supervisor" element={<Supervisor />} />
          <Route path="/presence/:event_id" element={<Presence />} />
          <Route path="/presenca" element={<Presenca />} />
        </Route>
      </Routes>
    </OpLogProvider>
  );
}

export default App;
