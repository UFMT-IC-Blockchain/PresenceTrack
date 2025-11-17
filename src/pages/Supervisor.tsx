import { useState } from "react";
import { Button, Input, Layout, Text } from "@stellar/design-system";
import ownerRules from "../contracts/owner_rules";
import presenceEvents from "../contracts/presence_events";
import { useWallet } from "../hooks/useWallet";
import { useRoles } from "../hooks/useRoles";
// import { useAccountSequenceNumber } from "../debug/hooks/useAccountSequenceNumber";
import { useNotification } from "../hooks/useNotification";

const Supervisor: React.FC = () => {
  const { address, signTransaction } = useWallet();
  const { isSupervisor, ready } = useRoles();
  const [recipient, setRecipient] = useState("");
  const [claim, setClaim] = useState<string>("");
  const [msg, setMsg] = useState("");
  const [evtName, setEvtName] = useState("");
  const [startTs, setStartTs] = useState<string>("");
  const [endTs, setEndTs] = useState<string>("");
  const [evtIdForQr, setEvtIdForQr] = useState<string>("");
  const { addNotification } = useNotification();

  // sequence not needed when using signAndSend via contract client

  const gen = async () => {
    setMsg("");
    try {
      const { result } = await ownerRules.generate_associate_claim_link({ recipient, operator: address! });
      if ((result as any)?.isOk?.()) {
        const hash = (result as any).unwrap();
        setClaim(String(hash));
        addNotification("Token de claim gerado", "success");
      } else {
        setMsg("Falha ao gerar token");
        addNotification("Falha ao gerar token", "error");
      }
    } catch (e: any) {
      setMsg(e?.message || "Erro");
      addNotification("Erro ao gerar token", "error");
    }
  };

  const createEvent = async () => {
    if (!address || !evtName || !startTs || !endTs) return;
    setMsg("");
    try {
      addNotification("Preparando criação de evento", "primary");
      try {
        const txSup = await (presenceEvents as any).set_supervisor(
          { user: address, status: true },
          { publicKey: address }
        );
        await (txSup as any).signAndSend({ signTransaction });
      } catch {
        // ignore if already supervisor or unauthorized; create_event will validate
      }
      const tx = await (presenceEvents as any).create_event(
        { name: evtName, start_ts: BigInt(startTs), end_ts: BigInt(endTs), operator: address },
        { publicKey: address }
      );
      const sent = await (tx as any).signAndSend({ signTransaction });
      const hash = (sent.getTransactionResponse as any)?.hash || (sent.sendTransactionResponse as any)?.hash || "";
      setMsg(hash ? `Evento criado · Hash: ${hash}` : "Evento criado");
      addNotification("Evento criado", "success");
    } catch (e: any) {
      setMsg(e?.message || "Erro");
      addNotification("Erro ao criar evento", "error");
    }
  };

  if (ready && !isSupervisor) {
    return (
      <Layout.Content>
        <Layout.Inset>
          <Text as="p" size="md">Acesso negado</Text>
        </Layout.Inset>
      </Layout.Content>
    );
  }
  return (
    <Layout.Content>
      <Layout.Inset>
        <Text as="h1" size="xl">Ferramentas do Supervisor</Text>
        <Input label="Destinatário" id="rec" value={recipient} onChange={(e) => setRecipient(e.target.value)} fieldSize="md" />
        <Button onClick={() => void gen()} disabled={!address || !recipient} variant="primary" size="md" className="primary-action">Gerar Claim</Button>
        {claim && (
          <Text as="p" size="md">Link de claim: {`${window.location.origin}/claim?token=${claim}`}</Text>
        )}
        <Text as="h2" size="lg">Criar Evento</Text>
        <Input label="Nome" id="evtname" value={evtName} onChange={(e) => setEvtName(e.target.value)} fieldSize="md" />
        <Input label="Início (epoch segundos)" id="start" value={startTs} onChange={(e) => setStartTs(e.target.value)} fieldSize="md" />
        <Input label="Fim (epoch segundos)" id="end" value={endTs} onChange={(e) => setEndTs(e.target.value)} fieldSize="md" />
        <Button onClick={() => void createEvent()} disabled={!address || !evtName || !startTs || !endTs} variant="primary" size="md" className="primary-action">Criar Evento</Button>
        <Text as="h2" size="lg">QR/Link de Presença</Text>
        <Input label="ID do Evento" id="evtQr" value={evtIdForQr} onChange={(e) => setEvtIdForQr(e.target.value)} fieldSize="md" />
        {evtIdForQr && (
          <Text as="p" size="md">Link de presença: {`${window.location.origin}/presence/${evtIdForQr}`}</Text>
        )}
        {claim && <Text as="p" size="md">Token: {claim}</Text>}
        {msg && <Text as="p" size="md">{msg}</Text>}
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Supervisor;
