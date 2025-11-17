import { useState } from "react";
import { Button, Input, Layout, Text } from "@stellar/design-system";
import ownerRules from "../contracts/owner_rules";
import { useWallet } from "../hooks/useWallet";
import { useRoles } from "../hooks/useRoles";
import { useNotification } from "../hooks/useNotification";
import ConfirmationModal from "../components/ConfirmationModal";

const Admin: React.FC = () => {
  const { address } = useWallet();
  const { isAdmin, ready } = useRoles();
  const { addNotification } = useNotification();
  const [baseUri, setBaseUri] = useState("");
  const [newAdmin, setNewAdmin] = useState("");
  const [initAdmin, setInitAdmin] = useState("");
  const [revokeAddr, setRevokeAddr] = useState("");
  const [revokeRole, setRevokeRole] = useState<number>(3);
  const [msg, setMsg] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState({
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info' as 'danger' | 'warning' | 'info'
  });

  const call = async (fn: () => Promise<any>) => {
    setMsg("");
    try {
      await fn();
      setMsg("Ok");
    } catch (e: any) {
      setMsg(e?.message || "Erro");
    }
  };

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'info') => {
    setConfirmationData({ title, message, onConfirm, type });
    setShowConfirmation(true);
  };

  if (!address) {
    return (
      <Layout.Content>
        <Layout.Inset>
          <Text as="p" size="md">Conecte a carteira</Text>
        </Layout.Inset>
      </Layout.Content>
    );
  }
  if (ready && !isAdmin) {
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
        <div className="admin-container">
          <div className="admin-header">
            <div className="admin-icon">⚡</div>
            <Text as="h1" size="xl" className="admin-title">Painel de Controle</Text>
            <Text as="p" size="md" className="admin-subtitle">Gerenciamento administrativo do sistema</Text>
          </div>
          
          <div className="admin-grid">
            {/* System Control */}
            <div className="admin-card">
              <div className="card-header">
                <span className="card-icon">🎛️</span>
                <Text as="h2" size="lg" className="card-title">Controle do Sistema</Text>
              </div>
              <div className="card-content">
                <div className="input-group">
                  <label className="input-label">Definir Administrador</label>
                  <Input 
                    id="initadmin" 
                    value={initAdmin || address || ""} 
                    onChange={(e) => setInitAdmin(e.target.value)} 
                    fieldSize="md" 
                    className="futuristic-input"
                    placeholder="Endereço do administrador"
                  />
                </div>
                <div className="button-group">
                  <Button 
                    onClick={() => void call(() => ownerRules.initialize({ admin: initAdmin || address! }))} 
                    variant="primary" 
                    size="md" 
                    className="primary-action"
                  >
                    <span>⚡</span>
                    Definir Admin
                  </Button>
                  <Button 
                    onClick={() => void call(() => ownerRules.pause())} 
                    variant="secondary" 
                    size="md" 
                    className="secondary-action"
                  >
                    <span>⏸️</span>
                    Pausar
                  </Button>
                  <Button 
                    onClick={() => void call(() => ownerRules.unpause())} 
                    variant="secondary" 
                    size="md" 
                    className="secondary-action"
                  >
                    <span>▶️</span>
                    Despausar
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Configuration */}
            <div className="admin-card">
              <div className="card-header">
                <span className="card-icon">⚙️</span>
                <Text as="h2" size="lg" className="card-title">Configurações</Text>
              </div>
              <div className="card-content">
                <div className="input-group">
                  <label className="input-label">Base URI</label>
                  <Input 
                    id="baseuri" 
                    value={baseUri} 
                    onChange={(e) => setBaseUri(e.target.value)} 
                    fieldSize="md" 
                    className="futuristic-input"
                    placeholder="URI base para metadados"
                  />
                </div>
                <Button 
                  onClick={() => void call(() => ownerRules.set_base_uri({ new_uri: baseUri }))} 
                  variant="primary" 
                  size="md" 
                  className="primary-action"
                >
                  <span>🔄</span>
                  Atualizar Base URI
                </Button>
              </div>
            </div>
            
            {/* Admin Transfer */}
            <div className="admin-card">
              <div className="card-header">
                <span className="card-icon">👑</span>
                <Text as="h2" size="lg" className="card-title">Transferência de Admin</Text>
              </div>
              <div className="card-content">
                <div className="input-group">
                  <label className="input-label">Novo Administrador</label>
                  <Input 
                    id="newadmin" 
                    value={newAdmin} 
                    onChange={(e) => setNewAdmin(e.target.value)} 
                    fieldSize="md" 
                    className="futuristic-input"
                    placeholder="Endereço do novo admin"
                  />
                </div>
                <Button 
                  onClick={() => void call(() => ownerRules.transfer_admin({ new_admin: newAdmin }))} 
                  variant="primary" 
                  size="md" 
                  className="primary-action"
                >
                  <span>👑</span>
                  Transferir Admin
                </Button>
              </div>
            </div>
            
            {/* Credential Revocation */}
            <div className="admin-card danger">
              <div className="card-header">
                <span className="card-icon">🚫</span>
                <Text as="h2" size="lg" className="card-title">Revogação de Credenciais</Text>
              </div>
              <div className="card-content">
                <div className="input-group">
                  <label className="input-label">Endereço para Revogar</label>
                  <Input 
                    id="revokeAddr" 
                    value={revokeAddr} 
                    onChange={(e) => setRevokeAddr(e.target.value)} 
                    fieldSize="md" 
                    className="futuristic-input"
                    placeholder="Endereço da carteira"
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
                    placeholder="ID do role (2 ou 3)"
                  />
                </div>
                <Button 
                  onClick={() => {
                    if (!revokeAddr) { 
                      setMsg("Endereço inválido"); 
                      addNotification("Endereço inválido", "error"); 
                      return; 
                    }
                    showConfirmDialog(
                      'Confirmar Revogação',
                      `Você tem certeza que deseja revogar o role ${revokeRole} do endereço ${revokeAddr}? Esta ação não pode ser desfeita.`,
                      () => {
                        const confirmAddr = prompt("Digite o endereço para confirmar");
                        if (confirmAddr !== revokeAddr) { 
                          setMsg("Endereço não confere"); 
                          addNotification("Endereço não confere", "warning"); 
                          return; 
                        }
                        void call(() => ownerRules.revoke_credential({ wallet: revokeAddr, role_id: revokeRole }));
                      },
                      'danger'
                    );
                  }} 
                  variant="primary" 
                  size="md" 
                  className="danger-action"
                >
                  <span>🚫</span>
                  Revogar Credencial
                </Button>
              </div>
            </div>
          </div>
          
          {msg && (
            <div className={`message ${msg.includes('Erro') || msg.includes('Falha') ? 'error' : 'success'}`}>
              <span className="message-icon">
                {msg.includes('Erro') || msg.includes('Falha') ? '❌' : '✅'}
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

export default Admin;
