export class Client {
  constructor(options: {
    contractId: string;
    networkPassphrase: string;
    rpcUrl: string;
  });
  options: { contractId: string; networkPassphrase: string; rpcUrl: string };
  create_event(args: {
    name: string;
    start_ts: bigint;
    end_ts: bigint;
    operator: string;
  }): Promise<any>;
  get_event(args: { event_id: bigint }): Promise<{ result: unknown }>;
  register_presence(args: { event_id: bigint; attendee: string }): Promise<any>;
  has_presence(args: {
    event_id: bigint;
    attendee: string;
  }): Promise<{ result: unknown }>;
  set_supervisor(args: { user: string; status: boolean }): Promise<any>;
  list_events(args: {
    start_id: bigint;
    limit: number;
  }): Promise<{ result: unknown }>;
  list_upcoming(): Promise<{ result: unknown }>;
  list_closed(args: {
    cursor: bigint;
    limit: number;
  }): Promise<{ result: unknown }>;
  list_attendees(args: {
    event_id: bigint;
    cursor: bigint;
    limit: number;
  }): Promise<{ result: unknown }>;
  remove_presence(args: { event_id: bigint; attendee: string }): Promise<any>;
  transfer_admin(args: { new_admin: string }): Promise<any>;
}
export const networks: {
  testnet: {
    contractId: "CCKLYKBIIMGQFUEXJMISGKDHIFXAP45LBRMZ6CGNLZMWFYPFZBD4N5C7";
  };
};
