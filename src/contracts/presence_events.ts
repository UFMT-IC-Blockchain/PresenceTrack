import { Client, networks } from "./generated/presence_events";
import { network } from "./util";

const client = new Client({
  contractId: networks.testnet.contractId,
  networkPassphrase: network.passphrase,
  rpcUrl: network.rpcUrl,
});

export default client;
