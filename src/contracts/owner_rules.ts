import { Client, networks } from "./generated/owner_rules";
import { network } from "./util";

const client = new Client({
  contractId: networks.testnet.contractId,
  networkPassphrase: network.passphrase,
  rpcUrl: network.rpcUrl,
});

export default client;
