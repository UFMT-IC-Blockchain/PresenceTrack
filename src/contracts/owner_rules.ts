import { Client, networks } from "owner_rules_client";
import { network } from "./util";

const client = new Client({
  contractId: networks.testnet.contractId,
  networkPassphrase: network.passphrase,
  rpcUrl: network.rpcUrl,
});

export default client;