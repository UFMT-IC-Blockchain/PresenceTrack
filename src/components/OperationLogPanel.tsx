import React from "react";
import { useOpLog } from "../providers/OpLogProvider";

const OperationLogPanel: React.FC = () => {
  const { entries, isOpen, clear } = useOpLog();
  return (
    <div className={isOpen ? "oplog-panel oplog-open" : "oplog-panel"}>
      <div className="oplog-header">
        <span>Histórico de Operações</span>
        <button className="oplog-clear" onClick={clear}>Limpar</button>
      </div>
      <div className="oplog-body">
        {entries.map((e) => (
          <div key={e.id} className={`oplog-entry oplog-${e.level}`}>
            <span className="oplog-time">{new Date(e.ts).toLocaleTimeString()}</span>
            <span className="oplog-text">{e.text}</span>
          </div>
        ))}
        {entries.length === 0 && <div className="oplog-empty">Sem registros</div>}
      </div>
    </div>
  );
};

export default OperationLogPanel;