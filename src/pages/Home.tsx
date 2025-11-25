import React from "react";
import { Layout, Text } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { useRoles } from "../hooks/useRoles";
import { User, Shield, Users } from "lucide-react";

const Home: React.FC = () => {
  const { address } = useWallet();
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
                <Text as="p" size="md" className="field-value wallet-value">
                  {address || "—"}
                </Text>
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
    </Layout.Content>
  );
};

export default Home;
