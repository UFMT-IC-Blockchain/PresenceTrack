import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getEventContractId } from "../util/eventContract";

interface ContractWarningProps {
  className?: string;
}

export const ContractWarning: React.FC<ContractWarningProps> = ({ className = "" }) => {
  const [showWarning, setShowWarning] = useState(false);
  
  useEffect(() => {
    const checkContract = async () => {
      try {
        const contractId = await getEventContractId();
        setShowWarning(!contractId || contractId.trim() === "");
      } catch (error) {
        console.error("Erro ao verificar contrato:", error);
        setShowWarning(true); // Mostra aviso em caso de erro
      }
    };
    checkContract();
  }, []);
  
  if (!showWarning) return null;
  
  return (
    <div className={`contract-warning ${className}`} style={{
      backgroundColor: "#fff3cd",
      border: "1px solid #ffeaa7",
      borderRadius: "8px",
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "16px"
    }}>
      <AlertCircle size={20} style={{ color: "#f39c12", flexShrink: 0 }} />
      <div>
        <strong style={{ color: "#d68910", margin: 0, fontSize: "14px" }}>
          Contrato de Eventos Não Configurado
        </strong>
        <p style={{ color: "#b7950b", margin: "4px 0 0 0", fontSize: "13px" }}>
          O administrador precisa configurar o contrato de eventos nas configurações para que todos os usuários possam acessar os eventos.
        </p>
      </div>
    </div>
  );
};