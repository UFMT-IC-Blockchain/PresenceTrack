import React from "react";

export default function TopBar({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="topbar" role="navigation" aria-label="Barra superior fixa">
      <button
        className="topbar-toggle"
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        {isOpen ? "✖" : "☰"}
      </button>
      <div className="topbar-logo">
        <img
          className="brand-img"
          alt="UFMT"
          src="https://www.ic.ufmt.br/storage/2023/02/Logo-IC-e-UFMT-1.png"
        />
      </div>
      <div className="topbar-right" />
    </div>
  );
}
