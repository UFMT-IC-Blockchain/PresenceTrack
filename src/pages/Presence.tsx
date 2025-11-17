import { Button, Layout, Text } from "@stellar/design-system";
import { useParams } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import presenceEvents from "../contracts/presence_events";
import { useAccountSequenceNumber } from "../debug/hooks/useAccountSequenceNumber";
import { getNetworkHeaders } from "../debug/util/getNetworkHeaders";
import { getTxnToSimulate } from "../debug/util/sorobanUtils";
import { BASE_FEE } from "@stellar/stellar-sdk";
import { network } from "../contracts/util";
import { useEffect, useMemo, useState, useRef } from "react";
import { useNotification } from "../hooks/useNotification";
import { useRoles } from "../hooks/useRoles";
import { useOpLog } from "../providers/OpLogProvider";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle,
  Clock,
  Users,
  Calendar,
  QrCode,
  UserCheck,
  UserX,
  AlertCircle,
} from "lucide-react";
import { getEventContractId } from "../util/eventContract";

type Attendee = {
  address: string;
  registeredAt: bigint;
};

const Presence: React.FC = () => {
  const { event_id } = useParams();
  const { address, signTransaction } = useWallet();
  const { addNotification } = useNotification();
  const { log } = useOpLog();
  const { isAssociate } = useRoles();
  const eid = useMemo(
    () => (event_id ? BigInt(event_id) : undefined),
    [event_id],
  );
  const didInitLog = useRef(false);
  const didContractLog = useRef(false);

  // Log component mount and initial state
  useEffect(() => {
    const setupContract = async () => {
      if (!didInitLog.current) {
        log("info", "=== Página de Registro de Presença Iniciada ===");
        didInitLog.current = true;
      }

      // Configura o contrato de eventos
      try {
        const currentContractId = await getEventContractId();
        if (currentContractId) {
          (presenceEvents as any).options.contractId = currentContractId;
          if (!didContractLog.current) {
            log("info", `Contract ID configurado: ${currentContractId}`);
            didContractLog.current = true;
          }
        } else {
          log("error", "Contract ID não configurado");
          addNotification(
            "Contrato de eventos não configurado. Contate o administrador.",
            "warning",
          );
        }
      } catch (error) {
        log("error", "Erro ao configurar contrato de eventos:" + String(error));
        addNotification(
          "Erro ao configurar contrato de eventos. Contate o administrador.",
          "error",
        );
      }
    };

    void setupContract();

    return () => {};
  }, []);

  const [ev, setEv] = useState<{
    name: string;
    start_ts: bigint;
    end_ts: bigint;
  } | null>(null);
  const [, setStatus] = useState<string>("");
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [showQR, setShowQR] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [attendeesCursor, setAttendeesCursor] = useState<number>(0);
  const [hasMoreAttendees, setHasMoreAttendees] = useState<boolean>(true);
  const [attendeesLoading, setAttendeesLoading] = useState<boolean>(false);

  // Cache local para participantes conhecidos

  const { data: seqNum, refetch } = useAccountSequenceNumber({
    publicKey: address || "",
    horizonUrl: network.horizonUrl,
    headers: getNetworkHeaders(network, "horizon"),
    uniqueId: "register_presence",
    enabled: false,
  });

  // Time calculations
  const getTimeStatus = (start_ts: bigint, end_ts: bigint) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (now < start_ts)
      return {
        status: "not_started",
        text: "Aguardando início",
        color: "var(--neon-orange)",
      };
    if (now > end_ts)
      return {
        status: "ended",
        text: "Evento encerrado",
        color: "var(--neon-red)",
      };
    return {
      status: "active",
      text: "Evento ativo",
      color: "var(--neon-green)",
    };
  };

  const formatTime = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString("pt-BR");
  };

  // Função auxiliar para buscar participantes via transações

  const getDuration = (start_ts: bigint, end_ts: bigint) => {
    const duration = Number(end_ts - start_ts);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getTimeRemaining = (start_ts: bigint, end_ts: bigint) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (now < start_ts) {
      const remaining = Number(start_ts - now);
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (now >= end_ts) return "Evento encerrado";
    const remaining = Number(end_ts - now);
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Load event data
  useEffect(() => {
    const loadEventData = async () => {
      if (!eid || !address) {
        return;
      }

      setLoading(true);

      try {
        const resp: any = await presenceEvents.get_event({ event_id: eid });
        const payload = resp?.result ?? resp;

        if (payload && payload.start_ts != null && payload.end_ts != null) {
          const eventData = {
            name: String(payload.name),
            start_ts: BigInt(payload.start_ts),
            end_ts: BigInt(payload.end_ts),
          };
          setEv(eventData);
          log("success", `Evento carregado: ${eventData.name} (#${event_id})`);
        } else {
          setStatus("Evento não encontrado");
          log("error", `Evento #${event_id} não encontrado ou dados inválidos`);
        }

        let userRegistered = false;

        if (address && eid) {
          try {
            const resp: any = await presenceEvents.has_presence({
              event_id: BigInt(eid),
              attendee: address,
            });
            const payload = resp?.result ?? resp;
            userRegistered = Boolean(payload);
            log(
              "info",
              `Presença do usuário: ${userRegistered ? "Registrado" : "Não registrado"}`,
            );
          } catch (error) {
            log("error", `Erro ao verificar presença: ${String(error)}`);
            userRegistered = false;
          }
        }

        setIsRegistered(userRegistered);

        await loadAttendees(0, true);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setStatus("Falha ao carregar dados do evento");
        log("error", `Erro ao carregar dados do evento: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    void loadEventData();
  }, [address, eid, network.rpcUrl, network.passphrase]);

  // Função para carregar participantes com paginação
  const loadAttendees = async (cursor: number, reset: boolean = false) => {
    if (!eid || attendeesLoading) return;

    setAttendeesLoading(true);
    try {
      const resp: any = await presenceEvents.list_attendees({
        event_id: BigInt(eid),
        cursor: BigInt(cursor),
        limit: 10,
      });
      const attendeesData = resp?.result ?? resp;

      if (attendeesData && Array.isArray(attendeesData)) {
        const newAttendees: Attendee[] = attendeesData
          .filter((attendee: any) => attendee.active) // Somente participantes ativos
          .map((attendee: any) => ({
            address: attendee.address,
            registeredAt: BigInt(attendee.registered_at),
          }));

        if (reset) {
          setAttendees(newAttendees);
          setAttendeesCursor(newAttendees.length);
        } else {
          setAttendees((prev) => [...prev, ...newAttendees]);
          setAttendeesCursor((prev) => prev + newAttendees.length);
        }

        setHasMoreAttendees(newAttendees.length === 10);
        log("success", `Participantes carregados: ${newAttendees.length}`);
      } else {
        setHasMoreAttendees(false);
        log("info", "Nenhum participante encontrado");
      }
    } catch (error) {
      log("error", `Erro ao carregar participantes: ${String(error)}`);
    } finally {
      setAttendeesLoading(false);
    }
  };

  // Função para carregar mais participantes (scroll infinito)
  const loadMoreAttendees = () => {
    if (hasMoreAttendees && !attendeesLoading) {
      void loadAttendees(attendeesCursor);
    }
  };

  // Função para remover presença (apenas supervisores)
  const removeAttendee = async (attendeeAddress: string) => {
    if (!eid || !address) return;

    try {
      log("info", `Removendo presença de ${attendeeAddress.slice(0, 8)}...`);
      await presenceEvents.remove_presence({
        event_id: BigInt(eid),
        attendee: attendeeAddress,
      });

      log("success", "Presença removida com sucesso");
      addNotification("Presença removida com sucesso", "success");

      // Recarregar lista de participantes
      setAttendeesCursor(0);
      setHasMoreAttendees(true);
      await loadAttendees(0, true);
    } catch (error) {
      log("error", `Erro ao remover presença: ${String(error)}`);
      addNotification(
        "Erro ao remover presença. Você precisa ser supervisor.",
        "error",
      );
    }
  };

  // Load event data when component mounts or dependencies change

  // Update status based on time
  useEffect(() => {
    if (!ev) return;

    const updateTimeStatus = () => {
      const s = getTimeStatus(ev.start_ts, ev.end_ts);
      setStatus(s.text);
    };

    // Update status immediately
    updateTimeStatus();

    getTimeStatus(ev.start_ts, ev.end_ts);

    // Set up interval to update time status every minute (but don't log)
    const interval = setInterval(updateTimeStatus, 60000);

    return () => clearInterval(interval);
  }, [ev?.start_ts, ev?.end_ts]);

  const register = async () => {
    if (!address || !eid) {
      log("error", "Tentativa de registro sem endereço ou ID do evento");
      addNotification("Erro: Endereço ou evento não disponível", "error");
      return;
    }

    log(
      "info",
      `Iniciando processo de registro de presença - Evento: #${event_id}, Usuário: ${address.slice(0, 8)}...${address.slice(-6)}`,
    );

    // Check if already registered
    if (isRegistered) {
      log("info", "Tentativa de registro duplicado - usuário já registrado");
      addNotification("Você já está registrado neste evento", "warning");
      return;
    }

    log("info", "Validando associação do usuário...");
    if (!isAssociate) {
      log("error", "Usuário não é associado - registro não permitido");
      addNotification("Apenas associados podem registrar presença", "error");
      return;
    }

    const timeCheck = ev ? getTimeStatus(ev.start_ts, ev.end_ts) : null;
    const nowCheck = BigInt(Math.floor(Date.now() / 1000));
    const threshold = ev
      ? ev.start_ts > BigInt(7200)
        ? ev.start_ts - BigInt(7200)
        : BigInt(0)
      : BigInt(0);
    log(
      "info",
      `Debug tempo · now=${nowCheck} start=${ev?.start_ts} end=${ev?.end_ts} preWindowStart=${threshold}`,
    );
    log("info", `Debug status · ${timeCheck?.status}`);
    const notStartedTooEarly =
      timeCheck?.status === "not_started" && nowCheck < threshold;
    if (timeCheck?.status === "ended") {
      log("error", "Evento encerrado - registro não permitido");
      addNotification("Evento encerrado - registro não permitido", "error");
      return;
    }
    if (notStartedTooEarly) {
      log("error", "Registro permitido somente 2 horas antes do início");
      addNotification(
        "Registro permitido somente 2 horas antes do início",
        "warning",
      );
      return;
    }
    log("info", "Usuário é associado, preparando transação...");
    addNotification("Preparando registro de presença", "primary");

    log("info", "Obtendo número de sequência da conta...");
    log("info", `Estado atual da sequência: ${seqNum || "não disponível"}`);

    // Forçar atualização da sequência
    let finalSeqNum = seqNum;

    try {
      const { data: refreshedSeqNum, error: seqError } = await refetch();

      if (seqError) {
        log("error", `Erro ao obter sequência: ${JSON.stringify(seqError)}`);
      } else if (refreshedSeqNum) {
        finalSeqNum = refreshedSeqNum;
      }
    } catch {
      log("error", "Erro ao atualizar sequência");
    }

    // Se ainda não tivermos sequência, tentar obter manualmente
    if (!finalSeqNum || finalSeqNum === "0") {
      log("info", "Obtendo sequência diretamente do Horizon...");
      try {
        const response = await fetch(
          `${network.horizonUrl}/accounts/${address}`,
          {
            headers: getNetworkHeaders(network, "horizon"),
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.sequence) {
            finalSeqNum = (BigInt(data.sequence) + BigInt(1)).toString();
            log("info", "Sequência atualizada");
          }
        } else {
          log("error", "Falha ao obter sequência no Horizon");
        }
      } catch {
        log("error", "Erro ao consultar sequência no Horizon");
      }
    }

    // Verificar se o número de sequência é válido
    if (!finalSeqNum || finalSeqNum === "0") {
      log("error", "Número de sequência inválido ou não disponível");
      addNotification(
        "Erro: Não foi possível obter o número de sequência da conta",
        "error",
      );
      return;
    }

    log("info", `Número de sequência obtido: ${finalSeqNum}`);

    const txnParams = {
      source_account: address,
      fee: BASE_FEE,
      seq_num: finalSeqNum,
      cond: { time: { min_time: "0", max_time: "0" } },
      memo: {},
    } as const;

    // Converter BigInt para número regular para o contrato
    const eventIdNumber = Number(eid);

    // Criar objeto com argumentos no formato tipado esperado por getScValsFromArgs
    const args = {
      event_id: { type: "u64", value: String(eventIdNumber) },
      attendee: { type: "address", value: address },
    };

    const sorobanOperation = {
      operation_type: "invoke_contract_function",
      params: {
        contract_id: presenceEvents.options.contractId,
        function_name: "register_presence",
        args,
      },
    } as const;

    log("info", "Montando transação...");

    const { xdr, error } = getTxnToSimulate(
      {
        contract_id: presenceEvents.options.contractId,
        function_name: "register_presence",
        args,
      },
      txnParams,
      sorobanOperation,
      network.passphrase,
    );

    if (error || !xdr) {
      log("error", "Falha ao montar transação");
      addNotification("Falha ao montar transação", "error");
      return;
    }

    log("info", "Montando transação via client...");
    let assembled;
    try {
      (presenceEvents as any).options.publicKey = address;
      assembled = await (presenceEvents as any).register_presence(
        {
          event_id: Number(eid),
          attendee: address,
        },
        { publicKey: address },
      );
    } catch (simErr: any) {
      const msg =
        typeof simErr?.message === "string"
          ? simErr.message
          : JSON.stringify(simErr);
      log("error", `Falha na simulação da transação: ${msg}`);
      const t = ev ? getTimeStatus(ev.start_ts, ev.end_ts) : null;
      const nowCheck2 = BigInt(Math.floor(Date.now() / 1000));
      const threshold2 = ev
        ? ev.start_ts > BigInt(7200)
          ? ev.start_ts - BigInt(7200)
          : BigInt(0)
        : BigInt(0);
      const tooEarly = t?.status === "not_started" && nowCheck2 < threshold2;
      if (t?.status === "ended") {
        addNotification("Evento encerrado - registro não permitido", "error");
      } else if (tooEarly) {
        addNotification(
          "Registro permitido somente 2 horas antes do início",
          "warning",
        );
      } else if (isRegistered) {
        addNotification("Você já está registrado neste evento", "warning");
      } else {
        addNotification("Falha na simulação da transação", "error");
      }
      return;
    }

    log("info", "Solicitando assinatura e envio...");
    let sent;
    try {
      sent = await assembled.signAndSend({ signTransaction });
    } catch (sendErr: any) {
      const msg =
        typeof sendErr?.message === "string"
          ? sendErr.message
          : JSON.stringify(sendErr);
      log("error", `Erro ao assinar/enviar: ${msg}`);
      const t = ev ? getTimeStatus(ev.start_ts, ev.end_ts) : null;
      const nowCheck2 = BigInt(Math.floor(Date.now() / 1000));
      const threshold2 = ev
        ? ev.start_ts > BigInt(7200)
          ? ev.start_ts - BigInt(7200)
          : BigInt(0)
        : BigInt(0);
      const tooEarly = t?.status === "not_started" && nowCheck2 < threshold2;
      if (t?.status === "ended") {
        addNotification("Evento encerrado - registro não permitido", "error");
      } else if (tooEarly) {
        addNotification(
          "Registro permitido somente 2 horas antes do início",
          "warning",
        );
      } else if (isRegistered) {
        addNotification("Você já está registrado neste evento", "warning");
      } else {
        addNotification("Erro ao registrar presença", "error");
      }
      return;
    }

    const hash = sent.sendTransactionResponse?.hash || "";
    log("success", `Presença registrada com sucesso! Hash: ${hash}`);

    addNotification("Presença registrada com sucesso!", "success");
    setIsRegistered(true);
    setStatus("Presença confirmada ✓");

    // Add to attendees list with proper timestamp
    const now = BigInt(Math.floor(Date.now() / 1000));
    const newAttendee = { address, registeredAt: now };

    setAttendees((prev) => {
      // Verificar se já existe na lista para evitar duplicatas
      const exists = prev.some((attendee) => attendee.address === address);
      if (exists) {
        log("info", "Usuário já estava na lista local");
        return prev;
      }

      const updatedList = [...prev, newAttendee];
      return updatedList;
    });
  };

  const timeInfo = ev ? getTimeStatus(ev.start_ts, ev.end_ts) : null;
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const preWindowStart = ev
    ? ev.start_ts > BigInt(7200)
      ? ev.start_ts - BigInt(7200)
      : BigInt(0)
    : BigInt(0);
  const withinPreWindow = ev ? nowSec >= preWindowStart : false;
  const beforeEnd = ev ? nowSec <= ev.end_ts : false;
  const canRegister =
    !!address &&
    !!eid &&
    !!ev &&
    !!isAssociate &&
    !isRegistered &&
    beforeEnd &&
    (timeInfo?.status === "active" ||
      (timeInfo?.status === "not_started" && withinPreWindow));

  if (loading) {
    return (
      <Layout.Content>
        <div className="presence-container">
          <div className="loading-card">
            <div className="loading-spinner"></div>
            <Text as="p" size="lg">
              Carregando informações do evento...
            </Text>
            <Text
              as="p"
              size="sm"
              style={{ color: "var(--dark-text-secondary)", marginTop: "8px" }}
            >
              Conectando à blockchain e verificando dados...
            </Text>
          </div>
        </div>
      </Layout.Content>
    );
  }

  if (!ev) {
    return (
      <Layout.Content>
        <div className="presence-container">
          <div className="error-card">
            <AlertCircle size={48} className="error-icon" />
            <Text as="h2" size="xl" className="error-title">
              Evento não encontrado
            </Text>
            <Text as="p" size="md" className="error-text">
              O evento solicitado não existe ou não está disponível.
            </Text>
            <Text
              as="p"
              size="sm"
              style={{ color: "var(--dark-text-secondary)", marginTop: "16px" }}
            >
              ID do evento: #{event_id}
            </Text>
          </div>
        </div>
      </Layout.Content>
    );
  }

  return (
    <Layout.Content>
      <div className="presence-container">
        {/* Event Header Card */}
        <div className="event-header-card">
          <div className="event-icon">
            <Calendar size={32} />
          </div>
          <div className="event-info">
            <Text as="h1" size="xl" className="event-title">
              {ev.name}
            </Text>
            <Text as="p" size="md" className="event-subtitle">
              Evento #{event_id}
            </Text>
          </div>
          <div className="event-status">
            <div
              className="status-indicator"
              style={{ backgroundColor: timeInfo?.color || "var(--neon-blue)" }}
            >
              {timeInfo?.status === "active" && <Clock size={16} />}
              {timeInfo?.status === "ended" && <UserX size={16} />}
              {timeInfo?.status === "not_started" && <AlertCircle size={16} />}
              <span>{timeInfo?.text}</span>
            </div>
          </div>
        </div>

        {/* Time Information Cards */}
        <div className="time-cards-grid">
          <div className="time-card">
            <div className="time-card-icon">
              <Calendar size={24} />
            </div>
            <div className="time-card-content">
              <Text as="p" size="sm" className="time-card-label">
                Início
              </Text>
              <Text as="p" size="md" className="time-card-value">
                {formatTime(ev.start_ts)}
              </Text>
            </div>
          </div>

          <div className="time-card">
            <div className="time-card-icon">
              <Clock size={24} />
            </div>
            <div className="time-card-content">
              <Text as="p" size="sm" className="time-card-label">
                Duração
              </Text>
              <Text as="p" size="md" className="time-card-value">
                {getDuration(ev.start_ts, ev.end_ts)}
              </Text>
            </div>
          </div>

          <div className="time-card">
            <div className="time-card-icon">
              <AlertCircle size={24} />
            </div>
            <div className="time-card-content">
              <Text as="p" size="sm" className="time-card-label">
                Tempo Restante
              </Text>
              <Text as="p" size="md" className="time-card-value">
                {getTimeRemaining(ev.start_ts, ev.end_ts)}
              </Text>
            </div>
          </div>
        </div>

        {/* Registration Card */}
        <div
          className={`registration-card ${isRegistered ? "registered" : ""}`}
        >
          <div className="registration-header">
            <div className="registration-icon">
              {isRegistered ? (
                <CheckCircle size={32} />
              ) : (
                <UserCheck size={32} />
              )}
            </div>
            <div className="registration-info">
              <Text as="h2" size="lg" className="registration-title">
                {isRegistered ? "Presença Confirmada" : "Registrar Presença"}
              </Text>
              <Text as="p" size="md" className="registration-subtitle">
                {isRegistered
                  ? "Você já está registrado neste evento"
                  : "Clique no botão abaixo para confirmar sua presença"}
              </Text>
            </div>
          </div>

          <div className="registration-actions">
            <Button
              onClick={() => {
                log("info", "Botão de registro clicado");
                log(
                  "info",
                  "Validando possibilidade de registro de presença...",
                );
                if (!canRegister) {
                  log("error", "Validação: Registro NÃO permitido");
                  if (!address) {
                    log("info", "Botão clicado mas usuário não conectado");
                    addNotification(
                      "Por favor, conecte sua carteira primeiro",
                      "warning",
                    );
                  } else if (!ev) {
                    log("info", "Botão clicado mas evento não carregado");
                    addNotification(
                      "Aguarde o carregamento do evento",
                      "warning",
                    );
                  } else if (!isAssociate) {
                    log("info", "Botão clicado por usuário não associado");
                    addNotification(
                      "Apenas associados podem registrar presença",
                      "warning",
                    );
                  } else if (
                    timeInfo?.status === "not_started" &&
                    !withinPreWindow
                  ) {
                    log(
                      "info",
                      "Registro permitido somente 2 horas antes do início",
                    );
                    addNotification(
                      "Registro permitido somente 2 horas antes do início",
                      "warning",
                    );
                  } else if (timeInfo?.status === "ended") {
                    log("info", "Evento encerrado - registro não permitido");
                    addNotification(
                      "Evento encerrado - registro não permitido",
                      "warning",
                    );
                  } else if (isRegistered) {
                    log("info", "Botão clicado mas usuário já registrado");
                    addNotification(
                      "Você já está registrado neste evento",
                      "warning",
                    );
                  }
                  return;
                }
                log("success", "Validação: Registro permitido");
                log("info", "Iniciando processo de registro...");
                void register();
              }}
              variant={isRegistered ? "secondary" : "primary"}
              size="md"
              className="registration-button"
            >
              {isRegistered ? "✓ Registrado" : "Registrar Presença"}
            </Button>

            <Button
              onClick={() => {
                const newShowQR = !showQR;
                log(
                  "info",
                  `${newShowQR ? "Mostrando" : "Ocultando"} QR Code do evento`,
                );
                setShowQR(newShowQR);
              }}
              variant="secondary"
              size="md"
              className="qr-button"
            >
              <QrCode size={16} />
              {showQR ? "Ocultar QR Code" : "Mostrar QR Code"}
            </Button>
          </div>
        </div>

        {/* QR Code Card */}
        {showQR && (
          <div className="qr-card">
            <div className="qr-header">
              <QrCode size={24} />
              <Text as="h3" size="lg" className="qr-title">
                QR Code do Evento
              </Text>
            </div>
            <div className="qr-content">
              <QRCodeSVG
                value={`${window.location.origin}/presence/${event_id}`}
                size={200}
                level="H"
                includeMargin={true}
                className="qr-code"
              />
              <Text as="p" size="sm" className="qr-text">
                Escaneie este QR code para acessar o registro de presença
              </Text>
            </div>
          </div>
        )}

        {/* Attendees List Card */}
        <div className="attendees-card">
          <div className="attendees-header">
            <Users size={24} />
            <Text as="h2" size="lg" className="attendees-title">
              Lista de Presenças
            </Text>
            <span className="attendees-count">{attendees.length}</span>
          </div>

          <div className="attendees-list">
            {attendees.length === 0 ? (
              <div className="no-attendees">
                <UserX size={48} className="no-attendees-icon" />
                <Text as="p" size="md" className="no-attendees-text">
                  Nenhum participante registrado ainda
                </Text>
              </div>
            ) : (
              attendees.map((attendee, index) => (
                <div key={index} className="attendee-item">
                  <div className="attendee-info">
                    <CheckCircle size={16} className="attendee-icon" />
                    <Text as="p" size="sm" className="attendee-address">
                      {attendee.address.slice(0, 8)}...
                      {attendee.address.slice(-6)}
                    </Text>
                  </div>
                  <div className="attendee-actions">
                    <Text as="p" size="xs" className="attendee-time">
                      {formatTime(attendee.registeredAt)}
                    </Text>
                    <Button
                      onClick={() => void removeAttendee(attendee.address)}
                      variant="destructive"
                      size="sm"
                      className="remove-attendee-btn"
                      title="Remover presença (apenas supervisores)"
                    >
                      <UserX size={12} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          {hasMoreAttendees && (
            <div className="load-more-container">
              <Button
                onClick={loadMoreAttendees}
                variant="secondary"
                size="sm"
                disabled={attendeesLoading}
                className="load-more-btn"
              >
                {attendeesLoading ? "Carregando..." : "Carregar mais"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout.Content>
  );
};

export default Presence;
