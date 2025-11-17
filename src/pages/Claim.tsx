import { useEffect, useMemo, useState } from "react";
import { Button, Input, Layout, Text } from "@stellar/design-system";
import ownerRules from "../contracts/owner_rules";
import { useWallet } from "../hooks/useWallet";
import { useNotification } from "../hooks/useNotification";
import { useOpLog } from "../providers/OpLogProvider";

const Claim: React.FC = () => {
  const { address } = useWallet();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [token, setToken] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const { addNotification } = useNotification();
  const { log } = useOpLog();

  useEffect(() => {
    const t = params.get("token") || "";
    setToken(t);
  }, [params]);

  const { signTransaction } = useWallet();

  const isValidToken = (t: string) => /^[a-fA-F0-9]{16,}$/.test(t);
  const extractError = (e: any): string => {
    try {
      if (!e) return "Erro desconhecido";
      if (typeof e === "string") return e;
      if (typeof e?.message === "string") return e.message;
      const rr = e?.result?.errorResult || e?.result;
      if (typeof rr === "string") return rr;
      if (typeof rr?.message === "string") return rr.message;
      if (rr?.detail) return String(rr.detail);
      if (rr?.title) return String(rr.title);
      return JSON.stringify(rr ?? e);
    } catch {
      return "Falha ao chamar contrato";
    }
  };
  const submit = async () => {
    if (!address || !token) return;
    if (!isValidToken(token)) { setMsg("Token inválido"); return; }
    setBusy(true);
    setMsg("");
    try {
      addNotification("Preparando transação de claim", "primary");
      log("info", "Preparando claim");
      const tokenBytes = Buffer.from(token, "hex");
      const tx = await (ownerRules as any).claim_nft(
        { token_hash: tokenBytes as any, wallet: address },
        { publicKey: address }
      );
      log("info", "Solicitando assinatura");
      const sent = await tx.signAndSend({ signTransaction });
      const hash = (sent.getTransactionResponse as any)?.hash || (sent.sendTransactionResponse as any)?.hash || "";
      setMsg(hash ? `Credencial emitida · Hash: ${hash}` : `Credencial emitida · Token: ${String(sent.result)}`);
      log("success", hash ? `Claim concluído · ${hash}` : "Claim concluído");
      addNotification("Claim concluído", "success");
    } catch (e: any) {
      setMsg(extractError(e));
      log("error", extractError(e));
      addNotification("Erro no claim", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout.Content>
      <Layout.Inset>
        <div className="claim-container">
          <div className="claim-card">
            <div className="claim-header">
              <div className="claim-icon">🔐</div>
              <Text as="h1" size="xl" className="claim-title">Resgatar Credencial</Text>
              <Text as="p" size="md" className="claim-subtitle">
                Insira seu token de credencial para resgatar seu NFT de acesso
              </Text>
            </div>
            
            <div className="claim-form">
              <div className="input-group">
                <label htmlFor="token" className="input-label">Token de Credencial</label>
                <Input 
                  id="token" 
                  value={token} 
                  onChange={(e) => setToken(e.target.value)} 
                  fieldSize="md" 
                  className="futuristic-input"
                  placeholder="Cole seu token aqui..."
                  disabled={busy}
                />
              </div>
              
              <Button 
                onClick={() => void submit()} 
                disabled={!address || !token || busy} 
                variant="primary" 
                size="md" 
                className="primary-action claim-button"
              >
                {busy ? (
                  <span className="button-content">
                    <span className="spin">⚡</span>
                    Processando...
                  </span>
                ) : (
                  <span className="button-content">
                    <span>🔓</span>
                    Resgatar Credencial
                  </span>
                )}
              </Button>
              
              {msg && (
                <div className={`message ${msg.includes('Erro') || msg.includes('Falha') || msg.includes('inválido') ? 'error' : 'success'}`}>
                  <span className="message-icon">
                    {msg.includes('Erro') || msg.includes('Falha') || msg.includes('inválido') ? '❌' : '✅'}
                  </span>
                  <span className={msg.includes('Hash:') ? 'hash-text' : ''}>
                    {msg}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="claim-info">
            <div className="info-card">
              <Text as="h3" size="lg">Como funciona?</Text>
              <Text as="p" size="md">
                Após inserir seu token, sua credencial NFT será mintada e você terá acesso às funcionalidades correspondentes ao seu perfil.
              </Text>
            </div>
          </div>
        </div>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Claim;
