import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useRoles } from "../../hooks/useRoles";
import { useWallet } from "../../hooks/useWallet";
import { useOpLog } from "../../providers/OpLogProvider";
import { WalletButton } from "../WalletButton";
import NetworkPill from "../NetworkPill";

const Sidebar: React.FC<{
  mode?: "overlay" | "sidebar";
  open?: boolean;
  onSelect?: () => void;
}> = ({ mode = "sidebar", open = true, onSelect }) => {
  const { isAdmin, isSupervisor, isAssociate } = useRoles();
  const { address } = useWallet();
  const { toggle } = useOpLog();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapse = () => {
    setCollapsed((v) => !v);
    const shell = document.querySelector(".app-shell");
    if (shell) {
      shell.classList.toggle("collapsed");
    }
  };
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onPointer = (e: Event) => {
      const el = sidebarRef.current;
      const target = e.target as Node | null;
      if (!el || !target) return;
      if (!el.contains(target)) {
        if (mode === "overlay") {
          if (open) onSelect?.();
        } else {
          setCollapsed(true);
          const shell = document.querySelector(".app-shell");
          shell?.classList.add("collapsed");
        }
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode === "overlay") {
          if (open) onSelect?.();
        } else {
          setCollapsed(true);
          const shell = document.querySelector(".app-shell");
          shell?.classList.add("collapsed");
        }
      }
    };
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [mode, open, onSelect]);
  const ti = collapsed ? -1 : 0;
  const handleItemClick = () => {
    if (mode === "overlay" && onSelect) onSelect();
  };
  const handleAsideClick = () => {
    if (mode === "overlay") return;
    if (collapsed) {
      setCollapsed(false);
      const shell = document.querySelector(".app-shell");
      shell?.classList.remove("collapsed");
    }
  };
  const overlayClass = mode === "overlay" ? " overlay" : "";
  const openClass = mode === "overlay" ? (open ? " open" : "") : "";
  const effectiveCollapsed = mode === "overlay" ? false : collapsed;
  return (
    <aside
      ref={sidebarRef}
      onClick={handleAsideClick}
      className={`sidebar${overlayClass}${openClass}${effectiveCollapsed ? " sidebar-collapsed" : ""}`}
      aria-label="Navegação principal"
    >
      {mode !== "overlay" && (
        <button
          className="collapse-toggle nav-item"
          style={{ textAlign: "left" }}
          onClick={toggleCollapse}
          aria-expanded={!collapsed}
          aria-controls="sidebarNavigation"
        >
          {collapsed ? "▶" : "◀"}
          <span className="sr-only">
            {collapsed ? "Expandir menu" : "Recolher menu"}
          </span>
        </button>
      )}
      <div className="sidebar-wallet-inline" aria-hidden={effectiveCollapsed}>
        <WalletButton
          compact
          showBalance={false}
          onAction={mode === "overlay" ? onSelect : undefined}
        />
        <NetworkPill />
      </div>
      <nav
        id="sidebarNavigation"
        className="sidebar-nav"
        aria-hidden={effectiveCollapsed}
      >
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "nav-item nav-item-active" : "nav-item"
          }
          tabIndex={ti}
          onClick={handleItemClick}
        >
          Dashboard
        </NavLink>
        {!isAdmin && !isSupervisor && isAssociate ? (
          <>
            <NavLink
              to="/meetings"
              className={({ isActive }) =>
                isActive ? "nav-item nav-item-active" : "nav-item"
              }
              tabIndex={ti}
              onClick={handleItemClick}
            >
              Reuniões
            </NavLink>
            <NavLink
              to="/presenca"
              className={({ isActive }) =>
                isActive ? "nav-item nav-item-active" : "nav-item"
              }
              tabIndex={ti}
              onClick={handleItemClick}
            >
              Presença
            </NavLink>
            <button
              onClick={() => setAdvancedOpen((v) => !v)}
              className="nav-item"
              style={{ textAlign: "left" }}
              tabIndex={ti}
            >
              Opções avançadas
            </button>
            {advancedOpen && (
              <>
                <NavLink
                  to="/credentials"
                  className={({ isActive }) =>
                    isActive ? "nav-item nav-item-active" : "nav-item"
                  }
                  style={{ paddingLeft: 32, fontSize: "0.95em" }}
                  tabIndex={ti}
                  onClick={handleItemClick}
                >
                  Minhas Credenciais
                </NavLink>
                <NavLink
                  to="/debug"
                  className={({ isActive }) =>
                    isActive ? "nav-item nav-item-active" : "nav-item"
                  }
                  style={{ paddingLeft: 32, fontSize: "0.95em" }}
                  tabIndex={ti}
                  onClick={handleItemClick}
                >
                  Contratos
                </NavLink>
                <button
                  onClick={toggle}
                  className="nav-item"
                  style={{
                    textAlign: "left",
                    paddingLeft: 32,
                    fontSize: "0.95em",
                  }}
                  tabIndex={ti}
                  onClickCapture={handleItemClick}
                >
                  Histórico de Operações
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <NavLink
              to="/meetings"
              className={({ isActive }) =>
                isActive ? "nav-item nav-item-active" : "nav-item"
              }
              tabIndex={ti}
              onClick={handleItemClick}
            >
              Reuniões
            </NavLink>
            <NavLink
              to="/presenca"
              className={({ isActive }) =>
                isActive ? "nav-item nav-item-active" : "nav-item"
              }
              tabIndex={ti}
              onClick={handleItemClick}
            >
              Presença
            </NavLink>
            <NavLink
              to="/credentials"
              className={({ isActive }) =>
                isActive ? "nav-item nav-item-active" : "nav-item"
              }
              tabIndex={ti}
              onClick={handleItemClick}
            >
              Minhas Credenciais
            </NavLink>
            <NavLink
              to="/debug"
              className={({ isActive }) =>
                isActive ? "nav-item nav-item-active" : "nav-item"
              }
              tabIndex={ti}
              onClick={handleItemClick}
            >
              Contratos
            </NavLink>
            <button
              onClick={toggle}
              className="nav-item"
              style={{ textAlign: "left" }}
              tabIndex={ti}
              onClickCapture={handleItemClick}
            >
              Histórico de Operações
            </button>
          </>
        )}
        {address && (isAdmin || isSupervisor) && (
          <NavLink
            to="/profiles"
            className={({ isActive }) =>
              isActive ? "nav-item nav-item-active" : "nav-item"
            }
            tabIndex={ti}
            onClick={handleItemClick}
          >
            Gestão de Perfis
          </NavLink>
        )}
        {address && isAdmin && (
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? "nav-item nav-item-active" : "nav-item"
            }
            tabIndex={ti}
            onClick={handleItemClick}
          >
            Configurações
          </NavLink>
        )}
        <NavLink
          to="/sobre"
          className={({ isActive }) =>
            isActive ? "nav-item nav-item-active" : "nav-item"
          }
          tabIndex={ti}
          onClick={handleItemClick}
        >
          Sobre
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
