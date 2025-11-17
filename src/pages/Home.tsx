import React from "react";
import { Button, Layout, Text } from "@stellar/design-system";
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
            <Text as="h1" size="xl" className="dashboard-title">Dashboard</Text>
            <Text as="p" size="md" className="dashboard-subtitle">Controle suas credenciais e acesso</Text>
          </div>
          
          {/* Role Cards Section */}
          <div className="role-cards-grid">
            <div className={`role-card ${isAdmin ? 'active' : ''}`}>
              <div className="role-icon admin">
                <Shield size={32} />
              </div>
              <Text as="h3" size="lg" className="role-title">Administrador</Text>
              <Text as="p" size="sm" className="role-description">Controle total do sistema</Text>
              <div className={`role-status ${isAdmin ? 'active' : 'inactive'}`}>
                <span className="status-dot"></span>
                {isAdmin ? 'Ativo' : 'Inativo'}
              </div>
            </div>
            
            <div className={`role-card ${isSupervisor ? 'active' : ''}`}>
              <div className="role-icon supervisor">
                <Users size={32} />
              </div>
              <Text as="h3" size="lg" className="role-title">Supervisor</Text>
              <Text as="p" size="sm" className="role-description">Gerenciamento de equipes</Text>
              <div className={`role-status ${isSupervisor ? 'active' : 'inactive'}`}>
                <span className="status-dot"></span>
                {isSupervisor ? 'Ativo' : 'Inativo'}
              </div>
            </div>
            
            <div className={`role-card ${isAssociate ? 'active' : ''}`}>
              <div className="role-icon associate">
                <User size={32} />
              </div>
              <Text as="h3" size="lg" className="role-title">Associado</Text>
              <Text as="p" size="sm" className="role-description">Acesso básico ao sistema</Text>
              <div className={`role-status ${isAssociate ? 'active' : 'inactive'}`}>
                <span className="status-dot"></span>
                {isAssociate ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>
          
          {/* Action Cards */}
          <div className="action-cards">
            <div className="action-card">
              <div className="action-icon claim">
                <span>🔐</span>
              </div>
              <Text as="h3" size="lg" className="action-title">Resgatar Credencial</Text>
              <Text as="p" size="md" className="action-description">
                Utilize seu token para resgatar seu NFT de acesso
              </Text>
              <Button 
                variant="primary" 
                size="md" 
                className="primary-action"
                onClick={() => (window.location.href = "/claim")}
              >
                <span>🔓</span>
                Resgatar Agora
              </Button>
            </div>
            
            {address && isSupervisor && (
              <div className="action-card">
                <div className="action-icon meetings">
                  <span>📅</span>
                </div>
                <Text as="h3" size="lg" className="action-title">Gerenciar Reuniões</Text>
                <Text as="p" size="md" className="action-description">
                  Crie e gerencie reuniões com sua equipe
                </Text>
                <Button 
                  variant="secondary" 
                  size="md" 
                  className="secondary-action"
                  onClick={() => (window.location.href = "/meetings")}
                >
                  <span>🚀</span>
                  Acessar Reuniões
                </Button>
              </div>
            )}
          </div>
          
          {/* Stats Card */}
          <div className="stats-card">
            <Text as="h2" size="lg" className="stats-title">Estatísticas Rápidas</Text>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">📊</div>
                <Text as="p" size="md" className="stat-label">Total de Reuniões</Text>
                <Text as="p" size="lg" className="stat-value">—</Text>
              </div>
              <div className="stat-item">
                <div className="stat-icon">✅</div>
                <Text as="p" size="md" className="stat-label">Presenças Registradas</Text>
                <Text as="p" size="lg" className="stat-value">—</Text>
              </div>
            </div>
          </div>
        </div>
      </Layout.Inset>
    </Layout.Content>
  );
};

export default Home;
