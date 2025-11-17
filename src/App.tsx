import { Layout } from "@stellar/design-system";
import "./App.css";
import ConnectAccount from "./components/ConnectAccount.tsx";
import { Routes, Route, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Claim from "./pages/Claim";
import Admin from "./pages/Admin";
import Supervisor from "./pages/Supervisor";
import Presence from "./pages/Presence";
import Debugger from "./pages/Debugger.tsx";
import { useRoles } from "./hooks/useRoles";
import { useWallet } from "./hooks/useWallet";
import Sidebar from "./components/layout/Sidebar";
import { OpLogProvider } from "./providers/OpLogProvider";
import OperationLogPanel from "./components/OperationLogPanel";
import Meetings from "./pages/Meetings";
import Profiles from "./pages/Profiles";
import Settings from "./pages/Settings";

const BrandUFMT: React.FC = () => (
  <div className="brand" style={{ gap: 12 }}>
    <img
      className="brand-img"
      alt="UFMT"
      src="https://www.ic.ufmt.br/storage/2023/02/Logo-IC-e-UFMT-1.png"
      style={{ width: 120, height: 60, objectFit: 'contain' }}
    />
    {/* <span className="brand-title">UFMT</span> */}
  </div>
);

const AppLayout: React.FC = () => {
  useRoles();
  useWallet();
  return (
    <main className="app-shell">
      <Sidebar />
      <div className="content-area">
        <header className="custom-header">
          <div className="header-left">
            <BrandUFMT />
          </div>
          <div className="header-center">
            <h1 className="project-title">PresenceTrack</h1>
          </div>
          <div className="header-right">
            <ConnectAccount />
          </div>
        </header>
        <Outlet />
        <Layout.Footer>
          <span>
            © {new Date().getFullYear()} PresenceTrack. Licensed under the {" "}
            <a
              href="http://www.apache.org/licenses/LICENSE-2.0"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apache License, Version 2.0
            </a>
            .
          </span>
        </Layout.Footer>
      </div>
      <OperationLogPanel />
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
        <Route path="/debug" element={<Debugger />} />
        <Route path="/debug/:contractName" element={<Debugger />} />
        <Route path="/claim" element={<Claim />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/supervisor" element={<Supervisor />} />
        <Route path="/presence/:event_id" element={<Presence />} />
        </Route>
      </Routes>
    </OpLogProvider>
  );
}

export default App;
