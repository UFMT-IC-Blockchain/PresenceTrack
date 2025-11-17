import { Client, networks } from "presence_events_client";
import { network } from "./util";

// Atualizar para o novo ID do contrato reconstruído
const NEW_CONTRACT_ID = "CC72PQF6AY52IPX2L3YWLTXZFF4UHNX73OWNQS6UJZDQLXCVSRJKQPJH";

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
