import { Client, networks } from "./generated/presence_events";
import { network } from "./util";

// Atualizar para o novo ID do contrato publicado
const NEW_CONTRACT_ID = "CCRZWRFSV454RYLHDFCJ27NIHUODJBOC6Y3TRYVLRX7O6KTUOEWJQMFI";

// Garantir que o ID do contrato esteja atualizado no storage
const currentStoredId = localStorage.getItem("presence_events_contract_id");
if (currentStoredId !== NEW_CONTRACT_ID) {
  if (currentStoredId) {
    console.log(`Atualizando ID de contrato: ${currentStoredId} -> ${NEW_CONTRACT_ID}`);
  }
  localStorage.setItem("presence_events_contract_id", NEW_CONTRACT_ID);
}

const client = new Client({
  contractId: localStorage.getItem("presence_events_contract_id") || NEW_CONTRACT_ID,
  networkPassphrase: network.passphrase,
  rpcUrl: network.rpcUrl,
});

export default client;
