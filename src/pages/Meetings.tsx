import { useEffect, useState, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button, Input, Layout, Text, Icon } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { useRoles } from "../hooks/useRoles";
import presenceEvents from "../contracts/presence_events";
// import { useAccountSequenceNumber } from "../debug/hooks/useAccountSequenceNumber";
import { useNotification } from "../hooks/useNotification";
import { useOpLog } from "../providers/OpLogProvider";
import { getEventContractId } from "../util/eventContract";
import { ContractWarning } from "../components/ContractWarning";

type EventItem = { id: number; name: string; start_ts: bigint; end_ts: bigint; status: string };

const Meetings: React.FC = () => {
  const { address, signTransaction } = useWallet();
  const { isSupervisor, isAssociate } = useRoles();
  const { addNotification } = useNotification();
  const { log } = useOpLog();
  const [evtName, setEvtName] = useState("");
  const [startLocal, setStartLocal] = useState<string>("");
  const [endLocal, setEndLocal] = useState<string>("");
  const [list, setList] = useState<EventItem[]>([]);
  const [qrFor, setQrFor] = useState<number | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [closedList, setClosedList] = useState<EventItem[]>([]);
  const [closedLoading, setClosedLoading] = useState<boolean>(false);
  const [closedCursor, setClosedCursor] = useState<number>(0);
  // sequence not needed when using signAndSend via contract client

  const toEpoch = (dt: string) => Math.floor(new Date(dt).getTime() / 1000);

  const createEvent = async () => {
    if (!address || !evtName || !startLocal || !endLocal) return;
    addNotification("Preparando criação de reunião", "primary");
    log("info", "Criando reunião");
    try {
      // Garante que o contrato está configurado antes de criar evento
      const currentContractId = await getEventContractId();
      if (!currentContractId) {
        addNotification("Contrato de eventos não configurado. Contate o administrador.", "error");
        log("error", "Contrato de eventos não configurado");
        return;
      }
      (presenceEvents as any).options.contractId = currentContractId;
      
      try {
        const txSup = await (presenceEvents as any).set_supervisor(
          { user: address, status: true },
          { publicKey: address }
        );
        log("info", "Solicitando assinatura para ativar supervisor");
        await (txSup as any).signAndSend({ signTransaction });
      } catch {
        // ignore if already supervisor or unauthorized; create_event will validate
      }
      const tx = await (presenceEvents as any).create_event(
        { name: evtName, start_ts: BigInt(toEpoch(startLocal)), end_ts: BigInt(toEpoch(endLocal)), operator: address },
        { publicKey: address }
      );
      const need = (tx as any).needsNonInvokerSigningBy as string[] | undefined;
      if (need && need.length && need[0] && need[0] !== address) {
        addNotification(`Assine com ${need[0]} ou ative Supervisor no Admin`, "warning");
        log("error", `Assine com ${need[0]} ou ative Supervisor`);
        return;
      }
      log("info", "Solicitando assinatura para criação de evento");
      await (tx as any).signAndSend({ signTransaction });
      addNotification("Reunião criada", "success");
      log("success", "Reunião criada");
      setEvtName(""); setStartLocal(""); setEndLocal("");
      setShowCreateModal(false);
      void refreshList();
    } catch (e: any) {
      const raw = e?.message || e?.result?.errorResult || e;
      const msg = typeof raw === "string" ? raw : JSON.stringify(raw);
      if (String(msg).includes("InvalidAction") || String(msg).includes("UnreachableCodeReached")) {
        addNotification("Operador não autorizado no contrato de eventos. Ative Supervisor no painel do Admin.", "warning");
      }
      addNotification(msg, "error");
      log("error", msg);
    }
  };

  const refreshList = useCallback(async () => {
    setLoading(true);
    log("info", "Buscando próximas reuniões");
    
    // Usa o novo sistema para obter o contrato atual
    const currentContractId = await getEventContractId();
    if (!currentContractId) {
      log("error", "Contrato de eventos não configurado");
      addNotification("Contrato de eventos não configurado. Contate o administrador.", "warning");
      setLoading(false);
      return;
    }
    
    // Configura o contrato no cliente
    (presenceEvents as any).options.contractId = currentContractId;
    const r = await (presenceEvents as any).list_upcoming();
    const arr: any[] = ((r as any)?.result as any[]) || [];
    const now = BigInt(Math.floor(Date.now() / 1000));
    const out: EventItem[] = arr.map((it: any) => {
      const start = BigInt(it.start_ts);
      const end = BigInt(it.end_ts);
      const status = now < start ? "Agendada" : now > end ? "Encerrada" : "Ativa";
      return { id: Number(it.id), name: String(it.name), start_ts: start, end_ts: end, status };
    });
    setList(out);
    setLoading(false);
    log("success", `Próximas reuniões carregadas: ${out.length}`);
  }, [log, addNotification]);

  const refreshClosed = useCallback(async () => {
    setClosedLoading(true);
    log("info", "Buscando reuniões encerradas");
    const currentContractId = await getEventContractId();
    if (!currentContractId) {
      log("error", "Contrato de eventos não configurado");
      addNotification("Contrato de eventos não configurado. Contate o administrador.", "warning");
      setClosedLoading(false);
      return;
    }
    (presenceEvents as any).options.contractId = currentContractId;
    const r = await (presenceEvents as any).list_closed({ cursor: BigInt(closedCursor), limit: 10 });
    const arr: any[] = ((r as any)?.result as any[]) || [];
    const now = BigInt(Math.floor(Date.now() / 1000));
    const out: EventItem[] = arr.map((it: any) => {
      const start = BigInt(it.start_ts);
      const end = BigInt(it.end_ts);
      const status = now < start ? "Agendada" : now > end ? "Encerrada" : "Ativa";
      return { id: Number(it.id), name: String(it.name), start_ts: start, end_ts: end, status };
    });
    setClosedList(out);
    setClosedLoading(false);
    log("success", `Encerradas carregadas: ${out.length}`);
  }, [addNotification, log, closedCursor]);

  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);
  useEffect(() => {
    if (address && !initialLoaded) {
      setInitialLoaded(true);
      void refreshList();
    }
  }, [address, initialLoaded]);

  const qrUrl = (eid: number) => `${window.location.origin}/presence/${eid}`;

  return (
    <Layout.Content>
      <Layout.Inset>
        <ContractWarning />
        <div className="card">
          <Text as="h1" size="xl">Reuniões</Text>
        </div>
        {/* Botão Registrar presença para associados */}
        {isAssociate && (
          <div className="card" style={{ marginTop: 12 }}>
            <Button variant="primary" size="sm" onClick={() => setShowQrModal(true)}>
              Registrar presença
            </Button>
          </div>
        )}
        {isSupervisor && (
          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text as="h2" size="lg">Minhas Reuniões</Text>
              <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>Nova Reunião</Button>
            </div>
          </div>
        )}
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text as="h2" size="lg">Próximas 5 Reuniões</Text>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => void refreshList()}
              disabled={loading}
            >
              {loading ? "Carregando..." : "Atualizar"}
            </Button>
          </div>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
              <span className="spin"><Icon.Circle /></span>
              <Text as="p" size="md">Carregando eventos…</Text>
            </div>
          )}
          {!loading && list.length === 0 && <Text as="p" size="md">Nenhuma reunião encontrada</Text>}
          {list.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((ev) => (
                  <tr key={ev.id}>
                    <td>{ev.id}</td>
                    <td>{ev.name}</td>
                    <td>
                      <span className={`status ${ev.status === "Ativa" ? "status-on" : ev.status === "Encerrada" ? "status-off" : "status-pending"}`}>{ev.status}</span>
                    </td>
                    <td style={{ display: "flex", gap: 8 }}>
                      {isSupervisor && ev.status === "Ativa" && (
                        <Button variant="secondary" size="sm" onClick={() => setQrFor(ev.id)}>QR Code</Button>
                      )}
                      <Button variant="secondary" size="sm" onClick={() => (window.location.href = qrUrl(ev.id))}>Presenças</Button>
                      {isSupervisor && ev.status === "Ativa" && (
                        <Button variant="secondary" size="sm" onClick={() => void 0}>Encerrar</Button>
                      )}
                      {isSupervisor && ev.status === "Encerrada" && (
                        <Button variant="secondary" size="sm" onClick={() => void 0}>Ativar</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {qrFor && (
            <div style={{ marginTop: 12 }}>
              <Text as="p" size="md">QR de presença para evento #{qrFor}</Text>
              <img alt="QR Code" style={{ width: 240, height: 240, background: "#fff", borderRadius: 8 }} src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl(qrFor))}`} />
            </div>
          )}
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text as="h2" size="lg">Encerradas</Text>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={() => { setClosedCursor(Math.max(0, closedCursor - 10)); void refreshClosed(); }} disabled={closedLoading || closedCursor === 0}>Anterior</Button>
              <Button variant="secondary" size="sm" onClick={() => { setClosedCursor(closedCursor + 10); void refreshClosed(); }} disabled={closedLoading}>Próxima</Button>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void refreshClosed()} disabled={closedLoading}>
            {closedLoading ? "Carregando..." : "Atualizar encerradas"}
          </Button>
          {closedLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
              <span className="spin"><Icon.Circle /></span>
              <Text as="p" size="md">Carregando encerradas…</Text>
            </div>
          )}
          {!closedLoading && closedList.length === 0 && <Text as="p" size="md">Nenhuma encerrada</Text>}
          {closedList.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {closedList.map((ev) => (
                  <tr key={ev.id}>
                    <td>{ev.id}</td>
                    <td>{ev.name}</td>
                    <td>
                      <span className={`status ${ev.status === "Ativa" ? "status-on" : ev.status === "Encerrada" ? "status-off" : "status-pending"}`}>{ev.status}</span>
                    </td>
                    <td style={{ display: "flex", gap: 8 }}>
                      <Button variant="secondary" size="sm" onClick={() => (window.location.href = qrUrl(ev.id))}>Presenças</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {showCreateModal && (
          <div className="confirmation-modal" onClick={() => setShowCreateModal(false)}>
            <div className="confirmation-content" onClick={(e) => e.stopPropagation()}>
              <div className="confirmation-header">
                <span className="confirmation-icon">🗓️</span>
                <h3 className="confirmation-title">Nova Reunião</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Input label="Nome da Reunião" id="evtname" value={evtName} onChange={(e) => setEvtName(e.target.value)} fieldSize="md" placeholder="Ex: Reunião de P&D em Soroban" />
                <Input label="Início" id="start" type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} fieldSize="md" />
                <Input label="Fim" id="end" type="datetime-local" value={endLocal} onChange={(e) => setEndLocal(e.target.value)} fieldSize="md" />
              </div>
              <div className="confirmation-buttons">
                <button className="secondary-action" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button className="primary-action" onClick={() => void createEvent()} disabled={!address || !evtName || !startLocal || !endLocal}>Criar</button>
              </div>
            </div>
          </div>
        )}
        {/* Modal QR para associados */}
        {showQrModal && (
          <div className="confirmation-modal" onClick={() => setShowQrModal(false)}>
            <div className="confirmation-content" onClick={(e) => e.stopPropagation()}>
              <div className="confirmation-header">
                <span className="confirmation-icon">📱</span>
                <h3 className="confirmation-title">Seu QR de presença</h3>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, margin: "16px 0" }}>
                {address ? (
                  <QRCodeCanvas value={address} size={240} />
                ) : (
                  <Text as="p" size="md">Conecte sua carteira para gerar o QR code.</Text>
                )}
                <Text as="p" size="md" style={{ wordBreak: "break-all" }}>Public Key: {address}</Text>
              </div>
              <div className="confirmation-buttons">
                <button className="secondary-action" onClick={() => setShowQrModal(false)}>Fechar</button>
              </div>
            </div>
          </div>
        )}
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Meetings;
