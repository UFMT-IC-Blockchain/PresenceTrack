import React, { useState } from "react";
import { Layout, Text, Button, Profile } from "@stellar/design-system";
import { createPortal } from "react-dom";
import { useWallet } from "../hooks/useWallet";
import { useRoles } from "../hooks/useRoles";
import { User, Shield, Users } from "lucide-react";
import FundAccountButton from "../components/FundAccountButton";
import { disconnectWallet } from "../util/wallet";
import { stellarNetwork } from "../contracts/util";

const Home: React.FC = () => {
  const { address } = useWallet();
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const { isAdmin, isSupervisor, isAssociate } = useRoles();
  return (
    <Layout.Content>
      <Layout.Inset>
        <div className="dashboard-container">
          <div className="dashboard-header">
            <Text as="h1" size="xl" className="dashboard-title">
              Dashboard
            </Text>
            <Text as="p" size="md" className="dashboard-subtitle">
              Controle suas credenciais e acesso
            </Text>
          </div>

          <div className="profile-summary-card">
            <div className="profile-fields">
              <div className="profile-field">
                <Text as="p" size="sm" className="field-label">
                  Nome
                </Text>
                <Text as="p" size="md" className="field-value">
                  Indefinido
                </Text>
              </div>
              <div className="profile-field">
                <Text as="p" size="sm" className="field-label">
                  Carteira
                </Text>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {address ? (
                    <Profile
                      publicAddress={address}
                      size="md"
                      isShort
                      onClick={() => setShowDisconnectModal(true)}
                    />
                  ) : (
                    <Text as="p" size="md" className="field-value wallet-value">
                      —
                    </Text>
                  )}
                  {stellarNetwork !== "PUBLIC" && <FundAccountButton />}
                </div>
              </div>
            </div>
            <div className="roles-row">
              <div className="role-pill">
                <div className="role-icon admin">
                  <Shield size={24} />
                </div>
                <div
                  className={`role-status ${isAdmin ? "active" : "inactive"}`}
                >
                  {isAdmin
                    ? "Administrador · Ativo"
                    : "Administrador · Inativo"}
                </div>
              </div>
              <div className="role-pill">
                <div className="role-icon supervisor">
                  <Users size={24} />
                </div>
                <div
                  className={`role-status ${isSupervisor ? "active" : "inactive"}`}
                >
                  {isSupervisor ? "Supervisor · Ativo" : "Supervisor · Inativo"}
                </div>
              </div>
              <div className="role-pill">
                <div className="role-icon associate">
                  <User size={24} />
                </div>
                <div
                  className={`role-status ${isAssociate ? "active" : "inactive"}`}
                >
                  {isAssociate ? "Associado · Ativo" : "Associado · Inativo"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout.Inset>
      {showDisconnectModal &&
        createPortal(
          <div
            className="confirmation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="disconnect-title-dash"
          >
            <div className="confirmation-content">
              <h2 id="disconnect-title-dash" className="confirmation-title">
                Desconectar carteira
              </h2>
              <p className="confirmation-message">
                Conectado como{" "}
                <code style={{ lineBreak: "anywhere" }}>{address}</code>. Deseja
                desconectar?
              </p>
              <div className="confirmation-buttons">
                <Button
                  size="md"
                  variant="primary"
                  onClick={() => {
                    void disconnectWallet().then(() =>
                      setShowDisconnectModal(false),
                    );
                  }}
                >
                  Desconectar
                </Button>
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => setShowDisconnectModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </Layout.Content>
  );
};

export default Home;
