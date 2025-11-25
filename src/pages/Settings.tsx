import { useEffect, useState } from "react";
import { Button, Input, Layout, Text } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { useRoles } from "../hooks/useRoles";
import ownerRules from "../contracts/owner_rules";
import presenceEvents from "../contracts/presence_events";
import { Client as PresenceClient } from "../contracts/generated/presence_events";
import { useNotification } from "../hooks/useNotification";
import { loadContractMetadata } from "../debug/util/loadContractMetada";
import { network } from "../contracts/util";
import { useOpLog } from "../providers/OpLogProvider";
import {
  getEventContractId,
  setEventContractId,
  isValidContractId,
  clearEventContractId,
} from "../util/eventContract";

const Settings: React.FC = () => {
  const { address } = useWallet();
  const { isAdmin } = useRoles();
  const { addNotification } = useNotification();
  const { log } = useOpLog();
  const [baseUri, setBaseUri] = useState("");
  const [newAdmin, setNewAdmin] = useState("");
  const [initAdmin, setInitAdmin] = useState("");
  const [msg, setMsg] = useState("");
  const [supAddr, setSupAddr] = useState("");
  const [peCid, setPeCid] = useState("");
  const [currentContract, setCurrentContract] = useState("");

  const { signTransaction } = useWallet();
  const call = async (fn: () => Promise<any>) => {
    setMsg("");
    try {
      await fn();
      setMsg("Ok");
    } catch (e: any) {
      setMsg(e?.message || "Erro");
    }
  };
  useEffect(() => {
    const loadContract = async () => {
      try {
        const v = await getEventContractId();
        if (v) {
          setPeCid(v);
          setCurrentContract(v);
        }
      } catch (error) {
        console.error("Erro ao carregar contrato:", error);
      }
    };
    void loadContract();
  }, []);

  if (!address || !isAdmin) {
    return (
      <Layout.Content>
        <Layout.Inset>
          <Text as="p" size="md">
            Acesso restrito ao Admin
          </Text>
        </Layout.Inset>
      </Layout.Content>
    );
  }

  return (
    <Layout.Content>
      <Layout.Inset>
        <div className="card">
          <Text as="h1" size="xl">
            Configurações
          </Text>
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <Text as="h2" size="lg">
            Administração
          </Text>
          <Input
            label="Definir Admin (initialize)"
            id="initadmin"
            value={initAdmin || address || ""}
            onChange={(e) => setInitAdmin(e.target.value)}
            fieldSize="md"
          />
          <Button
            onClick={() =>
              void call(async () => {
                log("info", `Definindo admin ${initAdmin || address}`);
                const tx = await ownerRules.initialize(
                  { admin: initAdmin || address! },
                  { publicKey: address } as any,
                );
                await (tx as any).signAndSend({ signTransaction });
                log("success", "Admin definido");
              })
            }
            variant="primary"
            size="md"
            className="primary-action"
          >
            Definir Admin
          </Button>
          <Input
            label="Novo Admin"
            id="newadmin"
            value={newAdmin}
            onChange={(e) => setNewAdmin(e.target.value)}
            fieldSize="md"
          />
          <Button
            onClick={() =>
              void call(async () => {
                log("info", `Transferindo admin para ${newAdmin}`);
                const tx = await ownerRules.transfer_admin(
                  { new_admin: newAdmin },
                  { publicKey: address } as any,
                );
                await (tx as any).signAndSend({ signTransaction });
                log("success", "Admin transferido");
              })
            }
            variant="primary"
            size="md"
            className="primary-action"
          >
            Transferir Admin
          </Button>
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <Text as="h2" size="lg">
            Base URI
          </Text>
          <Input
            label="Base URI"
            id="baseuri"
            value={baseUri}
            onChange={(e) => setBaseUri(e.target.value)}
            fieldSize="md"
          />
          <Button
            onClick={() =>
              void call(async () => {
                log("info", `Atualizando Base URI para ${baseUri}`);
                const tx = await ownerRules.set_base_uri({ new_uri: baseUri }, {
                  publicKey: address,
                } as any);
                await (tx as any).signAndSend({ signTransaction });
                log("success", "Base URI atualizada");
              })
            }
            variant="primary"
            size="md"
            className="primary-action"
          >
            Atualizar Base URI
          </Button>
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <Text as="h2" size="lg">
            Contrato de Eventos
          </Text>
          <Input
            label="Contract ID"
            id="pecid"
            value={peCid}
            onChange={(e) => setPeCid(e.target.value)}
            fieldSize="md"
          />
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <Text as="p" size="sm" style={{ color: "#666" }}>
              Contrato atual: {currentContract || "Nenhum definido"}
            </Text>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button
              onClick={() => {
                void (async () => {
                  try {
                    if (!isValidContractId(peCid)) {
                      addNotification(
                        "Contract ID inválido. Deve ter 56 caracteres alfanuméricos.",
                        "error",
                      );
                      return;
                    }
                    log(
                      "info",
                      `Atualizando contrato de eventos global para ${peCid}`,
                    );
                    const tx = await setEventContractId(peCid);
                    await (tx as any).signAndSend({ signTransaction });
                    (presenceEvents as any).options.contractId = peCid;
                    setCurrentContract(peCid);
                    addNotification(
                      "Contrato de eventos atualizado globalmente na blockchain para todos os usuários",
                      "success",
                    );
                    log(
                      "success",
                      "Contrato de eventos atualizado globalmente na blockchain",
                    );
                  } catch (e: any) {
                    addNotification(
                      e?.message || "Falha ao atualizar contrato",
                      "error",
                    );
                    log("error", e?.message || "Falha ao atualizar contrato");
                  }
                })();
              }}
              variant="primary"
              size="md"
              className="primary-action"
            >
              Definir Contrato Global
            </Button>
            <Button
              onClick={() => {
                void (async () => {
                  try {
                    clearEventContractId();
                    const defaultContract = await getEventContractId();
                    (presenceEvents as any).options.contractId =
                      defaultContract;
                    setPeCid(defaultContract);
                    setCurrentContract(defaultContract);
                    addNotification(
                      "Contrato global removido. Usando contrato padrão da rede.",
                      "success",
                    );
                    log("info", "Contrato global removido");
                  } catch (e: any) {
                    addNotification(
                      e?.message || "Falha ao remover contrato",
                      "error",
                    );
                    log("error", e?.message || "Falha ao remover contrato");
                  }
                })();
              }}
              variant="secondary"
              size="md"
            >
              Remover Global
            </Button>
            <Button
              onClick={() => {
                void (async () => {
                  try {
                    if (!address) {
                      addNotification("Conecte a carteira", "warning");
                      return;
                    }
                    log("info", "Preparando deploy do contrato de eventos");
                    const baseCid = (presenceEvents as any).options.contractId;
                    const meta = await loadContractMetadata(baseCid);
                    const wasmHash = meta.wasmHash || "";
                    if (!wasmHash) {
                      addNotification("WASM hash não encontrado", "error");
                      return;
                    }
                    log("info", "Gerando transação de deploy");
                    const tx = await (PresenceClient as any).deploy(
                      { admin: address },
                      {
                        publicKey: address,
                        rpcUrl: network.rpcUrl,
                        networkPassphrase: network.passphrase,
                        allowHttp: true,
                        wasmHash,
                      },
                    );
                    const need = (tx as any).needsNonInvokerSigningBy as
                      | string[]
                      | undefined;
                    if (need && need.length && need[0] && need[0] !== address) {
                      addNotification(
                        `Assine com ${need[0]} para deploy`,
                        "warning",
                      );
                      log("info", `Assine com ${need[0]} para deploy`);
                      return;
                    }
                    const sent = await (tx as any).signAndSend({
                      signTransaction,
                    });
                    const client = sent.result as any as {
                      options?: { contractId?: string };
                    };
                    const newId = client?.options?.contractId || "";
                    if (!newId) {
                      addNotification(
                        "Deploy concluído, mas não foi possível obter o Contract ID",
                        "warning",
                      );
                      return;
                    }
                    (presenceEvents as any).options.contractId = newId;

                    // Salva o novo contrato no contrato de roles na blockchain
                    try {
                      const tx = await ownerRules.set_event_contract(
                        { contract_id: newId },
                        { publicKey: address } as any,
                      );
                      await (tx as any).signAndSend({ signTransaction });
                      log(
                        "success",
                        `Contrato de eventos salvo no contrato de roles: ${newId}`,
                      );
                    } catch {
                      log(
                        "info",
                        "Contrato implantado mas não foi possível salvar no contrato de roles. Você pode definir manualmente nas configurações.",
                      );
                    }

                    // O contrato já foi salvo na blockchain, apenas atualiza o local
                    localStorage.setItem("presence_events_contract_id", newId);
                    setPeCid(newId);
                    addNotification(
                      `Novo contrato implantado: ${newId}`,
                      "success",
                    );
                    log("success", `Contrato implantado: ${newId}`);
                  } catch (e: any) {
                    addNotification(e?.message || "Falha no deploy", "error");
                    log("error", e?.message || "Falha no deploy");
                  }
                })();
              }}
              variant="secondary"
              size="md"
            >
              Deploy novo contrato (admin = minha carteira)
            </Button>
          </div>
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <Text as="h2" size="lg">
            Supervisores (presence_events)
          </Text>
          <Input
            label="Endereço"
            id="supaddr"
            value={supAddr}
            onChange={(e) => setSupAddr(e.target.value)}
            fieldSize="md"
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button
              onClick={() =>
                void call(async () => {
                  log("info", `Ativando supervisor ${(supAddr || address)!}`);
                  const tx = await (presenceEvents as any).set_supervisor(
                    { user: supAddr || address!, status: true },
                    { publicKey: address },
                  );
                  const need = (tx as any).needsNonInvokerSigningBy as
                    | string[]
                    | undefined;
                  if (need && need.length && need[0] && need[0] !== address) {
                    addNotification(
                      `Assine com ${need[0]} para ativar supervisor`,
                      "warning",
                    );
                    log("info", `Assine com ${need[0]} para ativar supervisor`);
                    return;
                  }
                  await (tx as any).signAndSend({ signTransaction });
                  log("success", "Supervisor ativado");
                })
              }
              variant="primary"
              size="md"
              className="primary-action"
            >
              Ativar Supervisor
            </Button>
            <Button
              onClick={() =>
                void call(async () => {
                  log("info", `Revogando supervisor ${(supAddr || address)!}`);
                  const tx = await (presenceEvents as any).set_supervisor(
                    { user: supAddr || address!, status: false },
                    { publicKey: address },
                  );
                  const need = (tx as any).needsNonInvokerSigningBy as
                    | string[]
                    | undefined;
                  if (need && need.length && need[0] && need[0] !== address) {
                    addNotification(
                      `Assine com ${need[0]} para revogar supervisor`,
                      "warning",
                    );
                    log(
                      "info",
                      `Assine com ${need[0]} para revogar supervisor`,
                    );
                    return;
                  }
                  await (tx as any).signAndSend({ signTransaction });
                  log("success", "Supervisor revogado");
                })
              }
              variant="secondary"
              size="md"
            >
              Revogar Supervisor
            </Button>
          </div>
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <Text as="h2" size="lg" style={{ color: "#ff9f43" }}>
            Estado do Sistema
          </Text>
          <Button
            onClick={() => {
              void call(async () => {
                log("info", "Pausando sistema");
                const tx = await ownerRules.pause({
                  publicKey: address,
                } as any);
                await (tx as any).signAndSend({ signTransaction });
                log("success", "Sistema pausado");
              });
              addNotification("Sistema pausado", "warning");
            }}
            variant="secondary"
            size="md"
            className="danger-action"
          >
            Pausar
          </Button>
          <Button
            onClick={() => {
              void call(async () => {
                log("info", "Despausando sistema");
                const tx = await ownerRules.unpause({
                  publicKey: address,
                } as any);
                await (tx as any).signAndSend({ signTransaction });
                log("success", "Sistema despausado");
              });
              addNotification("Sistema despausado", "success");
            }}
            variant="secondary"
            size="md"
          >
            Despausar
          </Button>
          {msg && (
            <Text as="p" size="md">
              {msg}
            </Text>
          )}
        </div>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Settings;
