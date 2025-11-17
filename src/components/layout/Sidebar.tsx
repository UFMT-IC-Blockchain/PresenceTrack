import React from "react";
import { NavLink } from "react-router-dom";
import { useRoles } from "../../hooks/useRoles";
import { useWallet } from "../../hooks/useWallet";
import { useOpLog } from "../../providers/OpLogProvider";

const Sidebar: React.FC = () => {
  const { isAdmin, isSupervisor } = useRoles();
  const { address } = useWallet();
  const { toggle } = useOpLog();
  return (
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon" aria-hidden="true">✎</span> PresenceTrack</div>
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>Dashboard</NavLink>
        <NavLink to="/credentials" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>Minhas Credenciais</NavLink>
        <NavLink to="/meetings" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>Reuniões</NavLink>
        <NavLink to="/debug" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>Contratos</NavLink>
        <button onClick={toggle} className="nav-item" style={{ textAlign: "left" }}>Histórico de Operações</button>
        {(address && (isAdmin || isSupervisor)) && (
          <NavLink to="/profiles" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>Gestão de Perfis</NavLink>
        )}
        {address && isAdmin && (
          <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-item nav-item-active" : "nav-item"}>Configurações</NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
