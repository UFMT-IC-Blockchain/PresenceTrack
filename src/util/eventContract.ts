import { DEFAULT_PRESENCE_EVENTS_CONTRACT } from "../contracts/util";
import ownerRules from "../contracts/owner_rules";
import type { AssembledTransaction } from "@stellar/stellar-sdk/contract";

const CONTRACT_STORAGE_KEY = "presence_events_contract_id";
const GLOBAL_CONTRACT_SET_KEY = "presence_events_contract_global_set";

/**
 * Obtém o contrato de eventos da blockchain (preferencialmente) ou fallback para localStorage/padrão
 */
export async function getEventContractId(): Promise<string> {
  try {
    // Preferir ID armazenado localmente se existir
    const localContract = localStorage.getItem(CONTRACT_STORAGE_KEY);
    if (localContract && isValidContractId(localContract)) {
      return localContract;
    }

    // Caso não exista local, tenta obter da blockchain via contrato de roles
    const tx = await ownerRules.get_event_contract();
    const simulation = await tx.simulate();
    const blockchainContract = simulation.result;
    if (blockchainContract && blockchainContract.length > 0) {
      return blockchainContract;
    }
  } catch (error) {
    console.warn(
      "Erro ao obter contrato da blockchain, usando fallback:",
      error,
    );
  }

  // Último fallback: contrato padrão da rede
  return DEFAULT_PRESENCE_EVENTS_CONTRACT;
}

/**
 * Define o contrato de eventos no contrato de roles na blockchain
 * Apenas admins devem chamar esta função
 * Retorna a transação para ser assinada pelo chamador
 */
export async function setEventContractId(
  contractId: string,
): Promise<AssembledTransaction<null>> {
  if (!contractId || contractId.trim() === "") {
    throw new Error("Contract ID não pode ser vazio");
  }

  if (!isValidContractId(contractId)) {
    throw new Error(
      "Contract ID inválido. Deve ter 56 caracteres alfanuméricos.",
    );
  }

  // Passa o publicKey nas opções quando chama o método do contrato
  const tx = await ownerRules.set_event_contract({
    contract_id: contractId.trim(),
  });

  // Armazena localmente para backup e compatibilidade (faz isso antes de retornar a tx)
  localStorage.setItem(CONTRACT_STORAGE_KEY, contractId.trim());
  localStorage.setItem(GLOBAL_CONTRACT_SET_KEY, "true");

  // Retorna a transação para o chamador assinar e enviar
  return tx;
}

/**
 * Verifica se um contrato global foi definido
 */
export async function isGlobalContractSet(): Promise<boolean> {
  try {
    const tx = await ownerRules.get_event_contract();
    const simulation = await tx.simulate();
    const blockchainContract = simulation.result;
    if (blockchainContract && blockchainContract.length > 0) {
      return true;
    }
  } catch (error) {
    console.warn("Erro ao verificar contrato na blockchain:", error);
  }

  return localStorage.getItem(GLOBAL_CONTRACT_SET_KEY) === "true";
}

/**
 * Limpa o contrato global (apenas localStorage - blockchain mantém o valor)
 */
export function clearEventContractId(): void {
  localStorage.removeItem(CONTRACT_STORAGE_KEY);
  localStorage.removeItem(GLOBAL_CONTRACT_SET_KEY);
}

/**
 * Valida se um contract ID está no formato correto
 */
export function isValidContractId(contractId: string): boolean {
  if (!contractId || contractId.trim() === "") {
    return false;
  }

  // Validação básica para contract ID Stellar (56 caracteres, alfanumérico)
  const trimmed = contractId.trim();
  return trimmed.length === 56 && /^[A-Z0-9]+$/.test(trimmed);
}
