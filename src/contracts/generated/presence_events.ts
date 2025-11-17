import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}

export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCXANWVLJJVZKZZ6Q2LVYOE3SODUK22ARPK7LXQNFRT5YE6LTNK6NUT6",
  },
} as const;

export type DataKey =
  | { tag: "EventById"; values: readonly [u64] }
  | { tag: "Supervisor"; values: readonly [string] }
  | { tag: "Presence"; values: readonly [u64, string] }
  | { tag: "AttendeesCount"; values: readonly [u64] }
  | { tag: "AttendeeByIndex"; values: readonly [u64, u64] };

export interface EventData {
  end_ts: u64;
  name: string;
  start_ts: u64;
}

export interface EventSummary {
  end_ts: u64;
  id: u64;
  name: string;
  start_ts: u64;
}

export interface AttendeeInfo {
  active: boolean;
  address: string;
  registered_at: u64;
}

export interface Client {
  /**
   * Construct and simulate a set_supervisor transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_supervisor: (
    { user, status }: { user: string; status: boolean },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a create_event transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_event: (
    {
      name,
      start_ts,
      end_ts,
      operator,
    }: { name: string; start_ts: u64; end_ts: u64; operator: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<u64>>;

  /**
   * Construct and simulate a get_event transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_event: (
    { event_id }: { event_id: u64 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<Option<EventData>>>;

  /**
   * Construct and simulate a register_presence transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  register_presence: (
    { event_id, attendee }: { event_id: u64; attendee: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a has_presence transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  has_presence: (
    { event_id, attendee }: { event_id: u64; attendee: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<boolean>>;

  /**
   * Construct and simulate a list_attendees transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  list_attendees: (
    { event_id, cursor, limit }: { event_id: u64; cursor: u64; limit: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<Array<AttendeeInfo>>>;

  /**
   * Construct and simulate a remove_presence transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  remove_presence: (
    { event_id, attendee }: { event_id: u64; attendee: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a list_events transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  list_events: (
    { start_id, limit }: { start_id: u64; limit: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<Array<EventSummary>>>;

  /**
   * Construct and simulate a list_upcoming transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  list_upcoming: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<Array<EventSummary>>>;

  /**
   * Construct and simulate a list_closed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  list_closed: (
    { cursor, limit }: { cursor: u64; limit: u32 },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<Array<EventSummary>>>;

  /**
   * Construct and simulate a transfer_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  transfer_admin: (
    { new_admin }: { new_admin: string },
    options?: {
      /**
       * The fee to pay for the transaction. Default: BASE_FEE
       */
      fee?: number;

      /**
       * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
       */
      timeoutInSeconds?: number;

      /**
       * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
       */
      simulate?: boolean;
    },
  ) => Promise<AssembledTransaction<null>>;
}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Constructor/Initialization Args for the contract's `__constructor` method */
    { admin }: { admin: string },
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      },
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({ admin }, options);
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAEAAAAAAAAACUV2ZW50QnlJZAAAAAAAAAEAAAAGAAAAAQAAAAAAAAAKU3VwZXJ2aXNvcgAAAAAAAQAAABMAAAABAAAAAAAAAAhQcmVzZW5jZQAAAAIAAAAGAAAAEwAAAAEAAAAAAAAADkF0dGVuZGVlc0NvdW50AAAAAAABAAAABgAAAAEAAAAAAAAAD0F0dGVuZGVlQnlJbmRleAAAAAACAAAABgAAAAY=",
        "AAAAAQAAAAAAAAAAAAAACUV2ZW50RGF0YQAAAAAAAAMAAAAAAAAABmVuZF90cwAAAAAABgAAAAAAAAAEbmFtZQAAABAAAAAAAAAACHN0YXJ0X3RzAAAABg==",
        "AAAAAQAAAAAAAAAAAAAADEV2ZW50U3VtbWFyeQAAAAQAAAAAAAAABmVuZF90cwAAAAAABgAAAAAAAAACaWQAAAAAAAYAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAhzdGFydF90cwAAAAY=",
        "AAAAAQAAAAAAAAAAAAAADEF0dGVuZGVlSW5mbwAAAAMAAAAAAAAABmFjdGl2ZQAAAAAAAQAAAAAAAAAHYWRkcmVzcwAAAAATAAAAAAAAAA1yZWdpc3RlcmVkX2F0AAAAAAAABg==",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAOc2V0X3N1cGVydmlzb3IAAAAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAZzdGF0dXMAAAAAAAEAAAAA",
        "AAAAAAAAAAAAAAAMY3JlYXRlX2V2ZW50AAAABAAAAAAAAAAEbmFtZQAAABAAAAAAAAAACHN0YXJ0X3RzAAAABgAAAAAAAAAGZW5kX3RzAAAAAAAGAAAAAAAAAAhvcGVyYXRvcgAAABMAAAABAAAABg==",
        "AAAAAAAAAAAAAAAJZ2V0X2V2ZW50AAAAAAAAAQAAAAAAAAAIZXZlbnRfaWQAAAAGAAAAAQAAA+gAAAfQAAAACUV2ZW50RGF0YQAAAA==",
        "AAAAAAAAAAAAAAARcmVnaXN0ZXJfcHJlc2VuY2UAAAAAAAACAAAAAAAAAAhldmVudF9pZAAAAAYAAAAAAAAACGF0dGVuZGVlAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAMaGFzX3ByZXNlbmNlAAAAAgAAAAAAAAAIZXZlbnRfaWQAAAAGAAAAAAAAAAhhdHRlbmRlZQAAABMAAAABAAAAAQ==",
        "AAAAAAAAAAAAAAAObGlzdF9hdHRlbmRlZXMAAAAAAAMAAAAAAAAACGV2ZW50X2lkAAAABgAAAAAAAAAGY3Vyc29yAAAAAAAGAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD6gAAB9AAAAAMQXR0ZW5kZWVJbmZv",
        "AAAAAAAAAAAAAAAPcmVtb3ZlX3ByZXNlbmNlAAAAAAIAAAAAAAAACGV2ZW50X2lkAAAABgAAAAAAAAAIYXR0ZW5kZWUAAAATAAAAAA==",
        "AAAAAAAAAAAAAAALbGlzdF9ldmVudHMAAAAAAgAAAAAAAAAIc3RhcnRfaWQAAAAGAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD6gAAB9AAAAAMRXZlbnRTdW1tYXJ5",
        "AAAAAAAAAAAAAAANbGlzdF91cGNvbWluZwAAAAAAAAAAAAABAAAD6gAAB9AAAAAMRXZlbnRTdW1tYXJ5",
        "AAAAAAAAAAAAAAALbGlzdF9jbG9zZWQAAAAAAgAAAAAAAAAGY3Vyc29yAAAAAAAGAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD6gAAB9AAAAAMRXZlbnRTdW1tYXJ5",
        "AAAAAAAAAAAAAAAOdHJhbnNmZXJfYWRtaW4AAAAAAAEAAAAAAAAACW5ld19hZG1pbgAAAAAAABMAAAAA",
      ]),
      options,
    );
  }
  public readonly fromJSON = {
    set_supervisor: this.txFromJSON<null>,
    create_event: this.txFromJSON<u64>,
    get_event: this.txFromJSON<Option<EventData>>,
    register_presence: this.txFromJSON<null>,
    has_presence: this.txFromJSON<boolean>,
    list_attendees: this.txFromJSON<Array<AttendeeInfo>>,
    remove_presence: this.txFromJSON<null>,
    list_events: this.txFromJSON<Array<EventSummary>>,
    list_upcoming: this.txFromJSON<Array<EventSummary>>,
    list_closed: this.txFromJSON<Array<EventSummary>>,
    transfer_admin: this.txFromJSON<null>,
  };
}
