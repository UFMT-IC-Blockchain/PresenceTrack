import { useState } from "react";
import { Button, Input, Layout, Text } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { useRoles } from "../hooks/useRoles";
import ownerRules from "../contracts/owner_rules";
import { useNotification } from "../hooks/useNotification";
import { useOpLog } from "../providers/OpLogProvider";
import ConfirmationModal from "../components/ConfirmationModal";

const Profiles: React.FC = () => {
  const { address, signTransaction } = useWallet();
  const { isAdmin, isSupervisor } = useRoles();
  const { addNotification } = useNotification();
  const { log } = useOpLog();

  const [recipient, setRecipient] = useState("");
  const [roleToGenerate, setRoleToGenerate] = useState<"2" | "3">("3");
  const [claimLink, setClaimLink] = useState<string>("");

  const [revokeAddr, setRevokeAddr] = useState("");
  const [revokeRole, setRevokeRole] = useState<number>(3);
  const [msg, setMsg] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    type: "danger" as "danger" | "warning" | "info",
  });

  const gen = async () => {
    setMsg("");
    setClaimLink("");
    try {
      log("info", "Gerando claim");
      if (roleToGenerate === "2") {
        if (!isAdmin) {
          addNotification("Apenas Admin pode gerar Supervisor", "warning");
          return;
        }
        const tx = await (ownerRules as any).generate_supervisor_claim_link(
          { recipient },
          { publicKey: address },
        );
        log("info", "Solicitando assinatura");
        const sent = await (tx as any).signAndSend({ signTransaction });
        const tokenHex = Buffer.isBuffer(sent.result)
          ? Buffer.from(sent.result as any).toString("hex")
          : String(sent.result);
        setClaimLink(`${window.location.origin}/claim?token=${tokenHex}`);
        log("success", "Claim de Supervisor gerado");
        addNotification("Claim para Supervisor gerado", "success");
      } else {
        const tx = await (ownerRules as any).generate_associate_claim_link(
          { recipient, operator: address! },
          { publicKey: address },
        );
        log("info", "Solicitando assinatura");
        const sent = await (tx as any).signAndSend({ signTransaction });
        const tokenHex = Buffer.isBuffer(sent.result)
          ? Buffer.from(sent.result as any).toString("hex")
          : String(sent.result);
        setClaimLink(`${window.location.origin}/claim?token=${tokenHex}`);
        log("success", "Claim de Associado gerado");
        addNotification("Claim para Associado gerado", "success");
      }
    } catch (e: any) {
      setMsg(e?.message || "Erro ao gerar link");
      log("error", e?.message || "Erro ao gerar claim");
      addNotification("Erro ao gerar claim", "error");
    }
  };

  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: "danger" | "warning" | "info" = "info",
  ) => {
    setConfirmationData({ title, message, onConfirm, type });
    setShowConfirmation(true);
  };

  const revoke = () => {
    setMsg("");
    if (!isAdmin) {
      addNotification("Apenas Admin pode revogar", "warning");
      return;
    }
    if (!revokeAddr) {
      setMsg("Endereço inválido");
      addNotification("Endereço inválido", "error");
      return;
    }

    showConfirmDialog(
      "Confirmar Revogação",
      `Você tem certeza que deseja revogar o role ${revokeRole} do endereço ${revokeAddr}? Esta ação não pode ser desfeita.`,
      () => {
        const confirmAddr = prompt("Digite o endereço para confirmar");
        if (confirmAddr !== revokeAddr) {
          setMsg("Endereço não confere");
          addNotification("Endereço não confere", "warning");
          return;
        }
        void (async () => {
          try {
            log(
              "info",
              `Iniciando revogação: wallet ${revokeAddr}, role ${revokeRole}`,
            );
            log("info", "Preparando transação de revogação");
            const tx = await (ownerRules as any).revoke_credential(
              { wallet: revokeAddr, role_id: revokeRole },
              { publicKey: address },
            );
            const need = (tx as any).needsNonInvokerSigningBy as
              | string[]
              | undefined;
            if (need && need.length && need[0] && need[0] !== address) {
              addNotification(`Assine com ${need[0]} para revogar`, "warning");
              log("info", `Assinatura requerida de ${need[0]} para revogação`);
              return;
            }
            log("info", "Solicitando assinatura para revogação");
            await (tx as any).signAndSend({ signTransaction });
            setMsg("Credencial revogada");
            addNotification("Credencial revogada", "success");
            log("success", "Revogação concluída");
          } catch (e: any) {
            const raw = e?.message || e?.result?.errorResult || e;
            const errMsg = typeof raw === "string" ? raw : JSON.stringify(raw);
            setMsg(errMsg || "Erro ao revogar");
            addNotification(errMsg || "Erro ao revogar", "error");
            log("error", errMsg || "Erro ao revogar");
          }
        })();
      },
      "danger",
    );
  };

  return (
    <Layout.Content>
      <Layout.Inset>
        <div className="profiles-container">
          <div className="profiles-header">
            <div className="profiles-icon">👥</div>
            <Text as="h1" size="xl" className="profiles-title">
              Gestão de Perfis
            </Text>
            <Text as="p" size="md" className="profiles-subtitle">
              Crie e gerencie credenciais para usuários
            </Text>
          </div>

          {(isAdmin || isSupervisor) && (
            <div className="profile-card">
              <div className="card-header">
                <span className="card-icon">🔐</span>
                <Text as="h2" size="lg" className="card-title">
                  Geração de Credenciais
                </Text>
              </div>
              <div className="card-content">
                <div className="input-group">
                  <label className="input-label">Destinatário</label>
                  <Input
                    id="rec"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    fieldSize="md"
                    className="futuristic-input"
                    placeholder="Endereço da carteira"
                  />
                </div>

                <div className="radio-group">
                  <label className="input-label">Tipo de Credencial</label>
                  <label className="futuristic-radio">
                    <input
                      type="radio"
                      name="role"
                      value="3"
                      checked={roleToGenerate === "3"}
                      onChange={() => setRoleToGenerate("3")}
                    />
                    <div className="radio-content">
                      <div className="radio-title">Associado (3)</div>
                      <div className="radio-description">
                        Acesso básico ao sistema
                      </div>
                    </div>
                  </label>
                  <label className="futuristic-radio">
                    <input
                      type="radio"
                      name="role"
                      value="2"
                      checked={roleToGenerate === "2"}
                      onChange={() => setRoleToGenerate("2")}
                    />
                    <div className="radio-content">
                      <div className="radio-title">Supervisor (2)</div>
                      <div className="radio-description">
                        Gerenciamento de equipes
                      </div>
                    </div>
                  </label>
                </div>

                <Button
                  onClick={() => void gen()}
                  disabled={!address || !recipient}
                  variant="primary"
                  size="md"
                  className="primary-action"
                >
                  <span>⚡</span>
                  Gerar Link de Credencial
                </Button>

                {claimLink && (
                  <div className="result-box">
                    <div className="result-header">
                      <span className="result-icon">✅</span>
                      <span className="result-title">
                        Link Gerado com Sucesso!
                      </span>
                    </div>
                    <div className="result-content">
                      <code className="claim-link">{claimLink}</code>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="copy-button"
                        onClick={() => {
                          void navigator.clipboard.writeText(claimLink);
                          addNotification("Link copiado!", "success");
                        }}
                      >
                        📋 Copiar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="profile-card danger">
              <div className="card-header">
                <span className="card-icon">🚫</span>
                <Text as="h2" size="lg" className="card-title">
                  Revogação de Credenciais
                </Text>
              </div>
              <div className="card-content">
                <div className="input-group">
                  <label className="input-label">Endereço da Carteira</label>
                  <Input
                    id="revokeAddr"
                    value={revokeAddr}
                    onChange={(e) => setRevokeAddr(e.target.value)}
                    fieldSize="md"
                    className="futuristic-input"
                    placeholder="Endereço a ser revogado"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Role ID</label>
                  <Input
                    id="revokeRole"
                    type="number"
                    value={revokeRole}
                    onChange={(e) => setRevokeRole(Number(e.target.value))}
                    fieldSize="md"
                    className="futuristic-input"
                    placeholder="2 para Supervisor, 3 para Associado"
                  />
                </div>
                <Button
                  onClick={() => void revoke()}
                  variant="primary"
                  size="md"
                  className="danger-action"
                >
                  <span>🗑️</span>
                  Revogar Credencial
                </Button>
              </div>
            </div>
          )}

          {msg && (
            <div
              className={`message ${msg.includes("Erro") || msg.includes("Falha") ? "error" : "success"}`}
            >
              <span className="message-icon">
                {msg.includes("Erro") || msg.includes("Falha") ? "❌" : "✅"}
              </span>
              {msg}
            </div>
          )}
        </div>

        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={confirmationData.onConfirm}
          title={confirmationData.title}
          message={confirmationData.message}
          type={confirmationData.type}
        />
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Profiles;
