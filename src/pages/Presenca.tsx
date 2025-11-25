import { useEffect, useMemo, useState } from "react";
import { Button, Layout, Text } from "@stellar/design-system";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Download,
  QrCode,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import presenceEvents from "../contracts/presence_events";
import { getEventContractId } from "../util/eventContract";
import { useNotification } from "../hooks/useNotification";
import { useOpLog } from "../providers/OpLogProvider";

type MeetingRecord = {
  id: number;
  name: string;
  start_ts: bigint;
  end_ts: bigint;
  status: "Agendada" | "Ativa" | "Encerrada";
};

type AttendeeRecord = {
  address: string;
  registeredAt: bigint;
};

const extractEvents = (payload: any): any[] => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload?.result && Array.isArray(payload.result)) {
    return payload.result;
  }
  return [];
};

const normalizeEvents = (items: any[]): MeetingRecord[] => {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return items.map((raw) => {
    const start = BigInt(raw.start_ts);
    const end = BigInt(raw.end_ts);
    const status = now < start ? "Agendada" : now > end ? "Encerrada" : "Ativa";
    return {
      id: Number(raw.id),
      name: String(raw.name),
      start_ts: start,
      end_ts: end,
      status,
    };
  });
};

const formatDateRange = (start: bigint, end: bigint) => {
  const startDate = new Date(Number(start) * 1000);
  const endDate = new Date(Number(end) * 1000);
  return `${startDate.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })} — ${endDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const Presenca: React.FC = () => {
  const { addNotification } = useNotification();
  const { log } = useOpLog();
  const [tab, setTab] = useState<"admin" | "checkin">("admin");
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(
    null,
  );
  const [contractReady, setContractReady] = useState(false);
  const [qrPreview, setQrPreview] = useState<number | null>(null);
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeeError, setAttendeeError] = useState<string | null>(null);

  const getBaseUrl = () =>
    (typeof window !== "undefined" && window.location?.origin) || "";
  const qrUrl = (id: number) => `${getBaseUrl()}/presence/${id}`;

  const selectedMeeting = useMemo(
    () => meetings.find((meeting) => meeting.id === selectedMeetingId) || null,
    [meetings, selectedMeetingId],
  );

  const loadMeetings = async () => {
    setLoadingMeetings(true);
    try {
      const contractId = await getEventContractId();
      if (!contractId) {
        addNotification(
          "Contrato de eventos não configurado. Contate o administrador.",
          "warning",
        );
        log("error", "Contrato de eventos não configurado para aba Presença");
        return;
      }

      (presenceEvents as any).options.contractId = contractId;
      setContractReady(true);

      const upcomingResp = await (presenceEvents as any).list_upcoming();
      const closedResp = await (presenceEvents as any).list_closed({
        cursor: BigInt(0),
        limit: 20,
      });

      const upcoming = normalizeEvents(extractEvents(upcomingResp));
      const closed = normalizeEvents(extractEvents(closedResp));

      const map = new Map<number, MeetingRecord>();
      [...upcoming, ...closed].forEach((event) => {
        map.set(event.id, event);
      });

      const merged = Array.from(map.values()).sort((a, b) =>
        Number(b.start_ts - a.start_ts),
      );

      setMeetings(merged);

      setSelectedMeetingId((prev) => {
        if (merged.length === 0) {
          return null;
        }
        const stillExists = merged.some((meeting) => meeting.id === prev);
        return stillExists && prev != null ? prev : merged[0].id;
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : JSON.stringify(error ?? "Erro");
      log("error", `Falha ao carregar reuniões na aba Presença: ${message}`);
      addNotification("Não foi possível carregar as reuniões", "error");
    } finally {
      setLoadingMeetings(false);
    }
  };

  const loadAttendees = async (meetingId: number) => {
    if (!contractReady) {
      return;
    }

    setAttendees([]);
    setAttendeeError(null);
    setAttendeesLoading(true);

    let cursor = 0;
    const collected: AttendeeRecord[] = [];

    try {
      while (true) {
        const resp = await (presenceEvents as any).list_attendees({
          event_id: BigInt(meetingId),
          cursor: BigInt(cursor),
          limit: 25,
        });
        const raw = (resp as any)?.result ?? resp ?? [];
        const data: any[] = Array.isArray(raw) ? raw : [];

        if (!Array.isArray(data) || data.length === 0) {
          break;
        }

        data
          .filter((entry) => entry?.active)
          .forEach((entry) =>
            collected.push({
              address: String(entry.address),
              registeredAt: BigInt(entry.registered_at ?? 0),
            }),
          );

        cursor += data.length;
        if (data.length < 25) {
          break;
        }
      }

      setAttendees(collected);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : JSON.stringify(error ?? "Erro");
      setAttendeeError("Não foi possível carregar a lista de presença.");
      log("error", `Falha ao listar presenças: ${message}`);
    } finally {
      setAttendeesLoading(false);
    }
  };

  const exportCsv = () => {
    if (!selectedMeeting || attendees.length === 0) {
      return;
    }
    const header = "Endereço,Registrado em\n";
    const rows = attendees
      .map(
        (attendee) =>
          `${attendee.address},${new Date(Number(attendee.registeredAt) * 1000).toLocaleString("pt-BR")}`,
      )
      .join("\n");
    const csv = `${header}${rows}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `presencas_evento_${selectedMeeting.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    void loadMeetings();
  }, []);

  useEffect(() => {
    if (selectedMeetingId != null) {
      void loadAttendees(selectedMeetingId);
    }
  }, [selectedMeetingId, contractReady]);

  return (
    <Layout.Content>
      <Layout.Inset>
        <div className="presenca-page">
          <div className="presenca-header-card">
            <div>
              <Text as="h1" size="xl">
                Central de Presenças
              </Text>
              <Text as="p" size="sm" className="presenca-subtitle">
                Acompanhe QR Codes, listas de presenças e links diretos para
                registro.
              </Text>
            </div>
            <div className="presenca-tabs">
              <button
                className={`presence-tab ${tab === "admin" ? "presence-tab-active" : ""}`}
                onClick={() => setTab("admin")}
                type="button"
              >
                Painel Administrativo
              </button>
              <button
                className={`presence-tab ${tab === "checkin" ? "presence-tab-active" : ""}`}
                onClick={() => setTab("checkin")}
                type="button"
              >
                Check-in e Compartilhamento
              </button>
            </div>
          </div>

          {tab === "admin" && (
            <>
              <div className="presenca-card">
                <div className="presenca-card-header">
                  <div>
                    <Text as="h2" size="lg">
                      QR Codes das Reuniões
                    </Text>
                    <Text as="p" size="sm" className="presenca-card-subtitle">
                      Compartilhe os códigos das reuniões já criadas para
                      facilitar o registro.
                    </Text>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void loadMeetings()}
                    disabled={loadingMeetings}
                  >
                    {loadingMeetings ? "Atualizando..." : "Atualizar Reuniões"}
                  </Button>
                </div>

                {meetings.length === 0 && !loadingMeetings && (
                  <div className="presenca-empty">
                    <QrCode size={28} />
                    <Text as="p" size="sm">
                      Nenhuma reunião encontrada. Crie reuniões para gerar QR
                      Codes.
                    </Text>
                  </div>
                )}

                <div className="qr-grid">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="qr-card">
                      <div className="qr-card-header">
                        <div className="qr-card-icon">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <Text as="h3" size="md">
                            {meeting.name}
                          </Text>
                          <Text as="p" size="xs" className="qr-card-date">
                            {formatDateRange(meeting.start_ts, meeting.end_ts)}
                          </Text>
                        </div>
                      </div>
                      <div className="qr-card-actions">
                        <span
                          className={`status-chip status-${meeting.status.toLowerCase()}`}
                        >
                          {meeting.status}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setQrPreview((prev) =>
                              prev === meeting.id ? null : meeting.id,
                            )
                          }
                        >
                          <QrCode size={16} />
                          {qrPreview === meeting.id ? "Ocultar QR" : "Ver QR"}
                        </Button>
                      </div>
                      {qrPreview === meeting.id && (
                        <div className="qr-preview">
                          <div className="qr-preview-code">
                            <QRCodeSVG value={qrUrl(meeting.id)} size={180} />
                          </div>
                          <Text as="p" size="xs" className="qr-link">
                            {qrUrl(meeting.id)}
                          </Text>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="presenca-card">
                <div className="presenca-card-header">
                  <div>
                    <Text as="h2" size="lg">
                      Lista de Presença
                    </Text>
                    <Text as="p" size="sm" className="presenca-card-subtitle">
                      Escolha uma reunião e visualize os participantes
                      confirmados em tempo real.
                    </Text>
                  </div>
                  <div className="presenca-actions">
                    <select
                      className="presenca-select"
                      value={selectedMeetingId ?? ""}
                      onChange={(event) =>
                        setSelectedMeetingId(
                          event.target.value
                            ? Number(event.target.value)
                            : null,
                        )
                      }
                      disabled={meetings.length === 0}
                    >
                      <option value="">Selecione uma reunião</option>
                      {meetings.map((meeting) => (
                        <option key={meeting.id} value={meeting.id}>
                          #{meeting.id} · {meeting.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={exportCsv}
                      disabled={!selectedMeeting || attendees.length === 0}
                    >
                      <Download size={16} />
                      Exportar CSV
                    </Button>
                  </div>
                </div>

                {selectedMeeting && (
                  <div className="presenca-summary">
                    <div>
                      <Text as="p" size="sm" className="presenca-summary-label">
                        Reunião
                      </Text>
                      <Text as="p" size="md">
                        {selectedMeeting.name}
                      </Text>
                    </div>
                    <div>
                      <Text as="p" size="sm" className="presenca-summary-label">
                        Horário
                      </Text>
                      <Text as="p" size="md">
                        {formatDateRange(
                          selectedMeeting.start_ts,
                          selectedMeeting.end_ts,
                        )}
                      </Text>
                    </div>
                    <div>
                      <Text as="p" size="sm" className="presenca-summary-label">
                        Status
                      </Text>
                      <span
                        className={`status-chip status-${selectedMeeting.status.toLowerCase()}`}
                      >
                        {selectedMeeting.status}
                      </span>
                    </div>
                    <div>
                      <Text as="p" size="sm" className="presenca-summary-label">
                        Presentes
                      </Text>
                      <Text as="p" size="md">
                        {attendees.length}
                      </Text>
                    </div>
                  </div>
                )}

                {attendeesLoading && (
                  <div className="presenca-loading">
                    <Users size={20} className="spin" />
                    <Text as="p" size="sm">
                      Carregando participantes...
                    </Text>
                  </div>
                )}

                {attendeeError && (
                  <div className="presenca-error">
                    <AlertCircle size={20} />
                    <Text as="p" size="sm">
                      {attendeeError}
                    </Text>
                  </div>
                )}

                {!attendeesLoading &&
                  attendees.length === 0 &&
                  selectedMeeting &&
                  !attendeeError && (
                    <div className="presenca-empty">
                      <Users size={28} />
                      <Text as="p" size="sm">
                        Nenhum participante confirmou presença ainda.
                      </Text>
                    </div>
                  )}

                {!attendeesLoading && attendees.length > 0 && (
                  <div className="presenca-attendees">
                    {attendees.map((attendee) => (
                      <div key={attendee.address} className="attendee-row">
                        <div className="attendee-avatar">
                          {attendee.address.slice(0, 2)}
                        </div>
                        <div className="attendee-info">
                          <Text as="p" size="sm" className="attendee-address">
                            {attendee.address}
                          </Text>
                          <Text as="p" size="xs" className="attendee-time">
                            {new Date(
                              Number(attendee.registeredAt) * 1000,
                            ).toLocaleString("pt-BR")}
                          </Text>
                        </div>
                        <CheckCircle2 size={20} className="attendee-icon" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "checkin" && (
            <div className="presenca-card">
              <div className="presenca-card-header">
                <div>
                  <Text as="h2" size="lg">
                    Check-in Manual e Compartilhamento
                  </Text>
                  <Text as="p" size="sm" className="presenca-card-subtitle">
                    Gere links diretos de registro e encaminhe os participantes
                    para a página oficial de presença.
                  </Text>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void loadMeetings()}
                  disabled={loadingMeetings}
                >
                  {loadingMeetings ? "Atualizando..." : "Atualizar Reuniões"}
                </Button>
              </div>

              <div className="checkin-grid">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="checkin-card">
                    <div className="checkin-card-header">
                      <Text as="h3" size="md">
                        {meeting.name}
                      </Text>
                      <span
                        className={`status-chip status-${meeting.status.toLowerCase()}`}
                      >
                        {meeting.status}
                      </span>
                    </div>
                    <Text as="p" size="sm" className="checkin-date">
                      {formatDateRange(meeting.start_ts, meeting.end_ts)}
                    </Text>
                    <div className="checkin-link">
                      <Text as="p" size="xs" className="qr-link">
                        {qrUrl(meeting.id)}
                      </Text>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (
                            typeof navigator !== "undefined" &&
                            navigator.clipboard?.writeText
                          ) {
                            void navigator.clipboard.writeText(
                              qrUrl(meeting.id),
                            );
                            addNotification(
                              "Link copiado para a área de transferência.",
                              "success",
                            );
                          } else {
                            addNotification(
                              "Não foi possível copiar o link automaticamente.",
                              "warning",
                            );
                          }
                        }}
                      >
                        Copiar Link
                      </Button>
                    </div>
                    <div className="checkin-actions">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          window.open(qrUrl(meeting.id), "_blank");
                        }}
                      >
                        Abrir Registro
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setQrPreview((prev) =>
                            prev === meeting.id ? null : meeting.id,
                          )
                        }
                      >
                        <QrCode size={16} />
                        {qrPreview === meeting.id ? "Ocultar QR" : "Ver QR"}
                      </Button>
                    </div>
                    {qrPreview === meeting.id && (
                      <div className="qr-preview-inline">
                        <QRCodeSVG value={qrUrl(meeting.id)} size={140} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Presenca;
