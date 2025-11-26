import { DEFAULT_PRESENCE_EVENTS_CONTRACT } from "../contracts/util";
import ownerRules from "../contracts/owner_rules";
import type { AssembledTransaction } from "@stellar/stellar-sdk/contract";

// Eliminado uso de storage local: leituras vêm do contrato on-chain

/**
 * Obtém o contrato de eventos da blockchain (preferencialmente) ou fallback para localStorage/padrão
 */
export async function getEventContractId(): Promise<string> {
  try {
    // Primeiro tenta obter da blockchain via contrato de roles (valor global)
    const tx = await ownerRules.get_event_contract();
    const simulation = await tx.simulate();
    const blockchainContract = simulation.result;
    if (blockchainContract && blockchainContract.length > 0) {
      return blockchainContract;
    }
  } catch (error) {
    console.warn("Falha ao ler contrato global na blockchain:", error);
  }

  // Sem storage local: se falhar, usar contrato padrão

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
  publicKey?: string,
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
  const options = publicKey
    ? ({ publicKey } as unknown as {
        fee?: number;
        timeoutInSeconds?: number;
        simulate?: boolean;
      })
    : undefined;
  const tx = await ownerRules.set_event_contract(
    { contract_id: contractId.trim() },
    options,
  );

  // Não armazenamos localmente; fonte de verdade é on-chain

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
    return !!(blockchainContract && blockchainContract.length > 0);
  } catch (error) {
    console.warn("Erro ao verificar contrato na blockchain:", error);
    return false;
  }
}

/**
 * Limpa o contrato global (apenas localStorage - blockchain mantém o valor)
 */
export function clearEventContractId(): void {
  // Sem storage local para limpar
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
