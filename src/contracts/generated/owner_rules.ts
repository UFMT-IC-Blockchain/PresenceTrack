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
    contractId: "CAOHH2TRQKPII3HHCFJUGK4LR5QECAT7OUFNKL3OKKOA6EXKTJ576463",
  },
} as const;

export type DataKey =
  | { tag: "RoleByWallet"; values: readonly [string] }
  | { tag: "TokenById"; values: readonly [u64] }
  | { tag: "ClaimToken"; values: readonly [Buffer] }
  | { tag: "Authorized"; values: readonly [string] };

export interface TokenData {
  owner: string;
  role_id: u32;
}

export interface ClaimData {
  recipient: string;
  role_id: u32;
  valid: boolean;
}

export interface Client {
  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  initialize: (
    { admin }: { admin: string },
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

  /**
   * Construct and simulate a pause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  pause: (options?: {
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
  }) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a unpause transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  unpause: (options?: {
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
  }) => Promise<AssembledTransaction<null>>;

  /**
   * Construct and simulate a set_base_uri transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_base_uri: (
    { new_uri }: { new_uri: string },
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
   * Construct and simulate a set_event_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_event_contract: (
    { contract_id }: { contract_id: string },
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
   * Construct and simulate a get_event_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_event_contract: (options?: {
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
  }) => Promise<AssembledTransaction<Option<string>>>;

  /**
   * Construct and simulate a authorize_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  authorize_contract: (
    { contract, status }: { contract: string; status: boolean },
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
   * Construct and simulate a recover_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  recover_admin: (
    { new_admin, operator }: { new_admin: string; operator: string },
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
   * Construct and simulate a generate_supervisor_claim_link transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  generate_supervisor_claim_link: (
    { recipient }: { recipient: string },
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
  ) => Promise<AssembledTransaction<Buffer>>;

  /**
   * Construct and simulate a generate_associate_claim_link transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  generate_associate_claim_link: (
    { recipient, operator }: { recipient: string; operator: string },
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
  ) => Promise<AssembledTransaction<Buffer>>;

  /**
   * Construct and simulate a claim_nft transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  claim_nft: (
    { token_hash, wallet }: { token_hash: Buffer; wallet: string },
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
   * Construct and simulate a revoke_credential transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  revoke_credential: (
    { wallet, role_id }: { wallet: string; role_id: u32 },
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
   * Construct and simulate a has_role transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  has_role: (
    { wallet, role_id }: { wallet: string; role_id: u32 },
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
   * Construct and simulate a token_uri transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  token_uri: (
    { token_id }: { token_id: u64 },
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
  ) => Promise<AssembledTransaction<string>>;

  /**
   * Construct and simulate a supports_interface transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  supports_interface: (
    { interface_id }: { interface_id: string },
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
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAEAAAAAAAAADFJvbGVCeVdhbGxldAAAAAEAAAATAAAAAQAAAAAAAAAJVG9rZW5CeUlkAAAAAAAAAQAAAAYAAAABAAAAAAAAAApDbGFpbVRva2VuAAAAAAABAAAD7gAAACAAAAABAAAAAAAAAApBdXRob3JpemVkAAAAAAABAAAAEw==",
        "AAAAAQAAAAAAAAAAAAAACVRva2VuRGF0YQAAAAAAAAIAAAAAAAAABW93bmVyAAAAAAAAEwAAAAAAAAAHcm9sZV9pZAAAAAAE",
        "AAAAAQAAAAAAAAAAAAAACUNsYWltRGF0YQAAAAAAAAMAAAAAAAAACXJlY2lwaWVudAAAAAAAABMAAAAAAAAAB3JvbGVfaWQAAAAABAAAAAAAAAAFdmFsaWQAAAAAAAAB",
        "AAAAAAAAAAAAAAAKaW5pdGlhbGl6ZQAAAAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAOdHJhbnNmZXJfYWRtaW4AAAAAAAEAAAAAAAAACW5ld19hZG1pbgAAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAAFcGF1c2UAAAAAAAAAAAAAAA==",
        "AAAAAAAAAAAAAAAHdW5wYXVzZQAAAAAAAAAAAA==",
        "AAAAAAAAAAAAAAAMc2V0X2Jhc2VfdXJpAAAAAQAAAAAAAAAHbmV3X3VyaQAAAAAQAAAAAA==",
        "AAAAAAAAAAAAAAASc2V0X2V2ZW50X2NvbnRyYWN0AAAAAAABAAAAAAAAAAtjb250cmFjdF9pZAAAAAAQAAAAAA==",
        "AAAAAAAAAAAAAAASZ2V0X2V2ZW50X2NvbnRyYWN0AAAAAAAAAAAAAQAAA+gAAAAQ",
        "AAAAAAAAAAAAAAASYXV0aG9yaXplX2NvbnRyYWN0AAAAAAACAAAAAAAAAAhjb250cmFjdAAAABMAAAAAAAAABnN0YXR1cwAAAAAAAQAAAAA=",
        "AAAAAAAAAAAAAAANcmVjb3Zlcl9hZG1pbgAAAAAAAAIAAAAAAAAACW5ld19hZG1pbgAAAAAAABMAAAAAAAAACG9wZXJhdG9yAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAeZ2VuZXJhdGVfc3VwZXJ2aXNvcl9jbGFpbV9saW5rAAAAAAABAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAQAAA+4AAAAg",
        "AAAAAAAAAAAAAAAdZ2VuZXJhdGVfYXNzb2NpYXRlX2NsYWltX2xpbmsAAAAAAAACAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAAAAAAhvcGVyYXRvcgAAABMAAAABAAAD7gAAACA=",
        "AAAAAAAAAAAAAAAJY2xhaW1fbmZ0AAAAAAAAAgAAAAAAAAAKdG9rZW5faGFzaAAAAAAD7gAAACAAAAAAAAAABndhbGxldAAAAAAAEwAAAAEAAAAG",
        "AAAAAAAAAAAAAAARcmV2b2tlX2NyZWRlbnRpYWwAAAAAAAACAAAAAAAAAAZ3YWxsZXQAAAAAABMAAAAAAAAAB3JvbGVfaWQAAAAABAAAAAA=",
        "AAAAAAAAAAAAAAAIaGFzX3JvbGUAAAACAAAAAAAAAAZ3YWxsZXQAAAAAABMAAAAAAAAAB3JvbGVfaWQAAAAABAAAAAEAAAAB",
        "AAAAAAAAAAAAAAAJdG9rZW5fdXJpAAAAAAAAAQAAAAAAAAAIdG9rZW5faWQAAAAGAAAAAQAAABA=",
        "AAAAAAAAAAAAAAASc3VwcG9ydHNfaW50ZXJmYWNlAAAAAAABAAAAAAAAAAxpbnRlcmZhY2VfaWQAAAAQAAAAAQAAAAE=",
      ]),
      options,
    );
  }
  public readonly fromJSON = {
    initialize: this.txFromJSON<null>,
    transfer_admin: this.txFromJSON<null>,
    pause: this.txFromJSON<null>,
    unpause: this.txFromJSON<null>,
    set_base_uri: this.txFromJSON<null>,
    set_event_contract: this.txFromJSON<null>,
    get_event_contract: this.txFromJSON<Option<string>>,
    authorize_contract: this.txFromJSON<null>,
    recover_admin: this.txFromJSON<null>,
    generate_supervisor_claim_link: this.txFromJSON<Buffer>,
    generate_associate_claim_link: this.txFromJSON<Buffer>,
    claim_nft: this.txFromJSON<u64>,
    revoke_credential: this.txFromJSON<null>,
    has_role: this.txFromJSON<boolean>,
    token_uri: this.txFromJSON<string>,
    supports_interface: this.txFromJSON<boolean>,
  };
}
