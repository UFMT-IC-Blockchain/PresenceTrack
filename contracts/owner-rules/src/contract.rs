#![allow(deprecated)]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Bytes, BytesN, Env, Map, String, Symbol,
};

const ADMIN_KEY: &Symbol = &symbol_short!("ADMIN");
const PAUSED_KEY: &Symbol = &symbol_short!("PAUSED");
const NEXT_TOKEN_ID_KEY: &Symbol = &symbol_short!("NEXT_ID");
const BASE_URI_KEY: &Symbol = &symbol_short!("BASE_URI");
const LOCKED_KEY: &Symbol = &symbol_short!("LOCKED");
const EVENT_CONTRACT_KEY: &Symbol = &symbol_short!("EVENT_CTR");

const ROLE_ADMIN: u32 = 1;
const ROLE_SUPERVISOR: u32 = 2;
const ROLE_ASSOCIATE: u32 = 3;

#[contracttype]
pub enum DataKey {
    RoleByWallet(Address),
    TokenById(u64),
    ClaimToken(BytesN<32>),
    Authorized(Address),
}

#[contracttype]
#[derive(Clone)]
pub struct TokenData {
    pub role_id: u32,
    pub owner: Address,
}

#[contracttype]
#[derive(Clone)]
pub struct ClaimData {
    pub role_id: u32,
    pub recipient: Address,
    pub valid: bool,
}

#[contract]
pub struct OwnerRules;

#[contractimpl]
impl OwnerRules {
    pub fn initialize(env: &Env, admin: Address) {
        if env.storage().instance().has(ADMIN_KEY) { panic!("already initialized"); }
        admin.require_auth();
        env.storage().instance().set(ADMIN_KEY, &admin);
        env.storage().instance().set(PAUSED_KEY, &false);
        env.storage().instance().set(NEXT_TOKEN_ID_KEY, &1u64);
        env.storage().instance().set(BASE_URI_KEY, &String::from_str(env, ""));
        env.storage().instance().set(LOCKED_KEY, &false);
        let token_id = Self::next_id_and_increment(env);
        let data = TokenData { role_id: ROLE_ADMIN, owner: admin.clone() };
        env.storage().instance().set(&DataKey::TokenById(token_id), &data);
        let mut roles: Map<u32, u64> = Self::roles_for(env, &admin);
        roles.set(ROLE_ADMIN, token_id);
        env.storage().instance().set(&DataKey::RoleByWallet(admin.clone()), &roles);
        Self::emit_credential_minted(env, ROLE_ADMIN, admin, token_id);
    }
    pub fn __constructor(env: &Env, admin: Address) {
        env.storage().instance().set(ADMIN_KEY, &admin);
        env.storage().instance().set(PAUSED_KEY, &false);
        env.storage().instance().set(NEXT_TOKEN_ID_KEY, &1u64);
        env.storage().instance().set(BASE_URI_KEY, &String::from_str(env, ""));
        env.storage().instance().set(LOCKED_KEY, &false);
        let token_id = Self::next_id_and_increment(env);
        let data = TokenData { role_id: ROLE_ADMIN, owner: admin.clone() };
        env.storage().instance().set(&DataKey::TokenById(token_id), &data);
        let mut roles: Map<u32, u64> = Self::roles_for(env, &admin);
        roles.set(ROLE_ADMIN, token_id);
        env.storage().instance().set(&DataKey::RoleByWallet(admin.clone()), &roles);
        Self::emit_credential_minted(env, ROLE_ADMIN, admin, token_id);
    }

    pub fn transfer_admin(env: &Env, new_admin: Address) {
        Self::require_admin(env);
        let old_admin = Self::admin(env).expect("admin not set");
        if let Some(old_token) = Self::role_token_for(env, &old_admin, ROLE_ADMIN) {
            env.storage().instance().remove(&DataKey::TokenById(old_token));
            let mut roles_old: Map<u32, u64> = Self::roles_for(env, &old_admin);
            roles_old.remove(ROLE_ADMIN);
            env.storage().instance().set(&DataKey::RoleByWallet(old_admin.clone()), &roles_old);
            Self::emit_credential_revoked(env, ROLE_ADMIN, old_admin.clone(), old_token);
        }
        env.storage().instance().set(ADMIN_KEY, &new_admin);
        let token_id = Self::next_id_and_increment(env);
        let data = TokenData { role_id: ROLE_ADMIN, owner: new_admin.clone() };
        env.storage().instance().set(&DataKey::TokenById(token_id), &data);
        let mut roles_new: Map<u32, u64> = Self::roles_for(env, &new_admin);
        roles_new.set(ROLE_ADMIN, token_id);
        env.storage().instance().set(&DataKey::RoleByWallet(new_admin.clone()), &roles_new);
        Self::emit_admin_transferred(env, old_admin, new_admin.clone());
        Self::emit_credential_minted(env, ROLE_ADMIN, new_admin, token_id);
    }

    pub fn pause(env: &Env) {
        Self::require_admin(env);
        env.storage().instance().set(PAUSED_KEY, &true);
    }

    pub fn unpause(env: &Env) {
        Self::require_admin(env);
        env.storage().instance().set(PAUSED_KEY, &false);
    }

    pub fn set_base_uri(env: &Env, new_uri: String) {
        Self::require_admin(env);
        env.storage().instance().set(BASE_URI_KEY, &new_uri);
        Self::emit_base_uri_updated(env, new_uri);
    }

    pub fn set_event_contract(env: &Env, contract_id: String) {
        Self::require_admin(env);
        env.storage().instance().set(EVENT_CONTRACT_KEY, &contract_id);
        Self::emit_event_contract_updated(env, contract_id);
    }

    pub fn get_event_contract(env: &Env) -> Option<String> {
        env.storage().instance().get(EVENT_CONTRACT_KEY)
    }

    pub fn authorize_contract(env: &Env, contract: Address, status: bool) {
        Self::require_admin(env);
        env.storage().instance().set(&DataKey::Authorized(contract), &status);
    }

    pub fn recover_admin(env: &Env, new_admin: Address, operator: Address) {
        operator.require_auth();
        let authorized: bool = env
            .storage()
            .instance()
            .get(&DataKey::Authorized(operator.clone()))
            .unwrap_or(false);
        if !authorized { panic!("not authorized"); }
        env.storage().instance().set(ADMIN_KEY, &new_admin);
    }

    pub fn generate_supervisor_claim_link(env: &Env, recipient: Address) -> BytesN<32> {
        Self::require_admin(env);
        Self::new_claim(env, recipient, ROLE_SUPERVISOR)
    }

    pub fn generate_associate_claim_link(env: &Env, recipient: Address, operator: Address) -> BytesN<32> {
        let is_admin = Self::has_role(env, Self::admin(env).unwrap_or(recipient.clone()), ROLE_ADMIN);
        let is_supervisor = Self::has_role(env, operator.clone(), ROLE_SUPERVISOR);
        if !is_admin && !is_supervisor { panic!("not allowed"); }
        Self::new_claim(env, recipient, ROLE_ASSOCIATE)
    }

    pub fn claim_nft(env: &Env, token_hash: BytesN<32>, wallet: Address) -> u64 {
        Self::require_not_paused(env);
        Self::enter(env);
        let claim: ClaimData = env
            .storage()
            .instance()
            .get(&DataKey::ClaimToken(token_hash.clone()))
            .expect("invalid claim token");
        if !claim.valid { Self::exit(env); panic!("token already used"); }
        if claim.recipient != wallet { Self::exit(env); panic!("recipient mismatch"); }
        if Self::role_token_for(env, &wallet, claim.role_id).is_some() {
            Self::exit(env);
            panic!("already has role");
        }
        let token_id = Self::next_id_and_increment(env);
        let data = TokenData { role_id: claim.role_id, owner: wallet.clone() };
        env.storage().instance().set(&DataKey::TokenById(token_id), &data);
        let mut roles: Map<u32, u64> = Self::roles_for(env, &wallet);
        roles.set(claim.role_id, token_id);
        env.storage().instance().set(&DataKey::RoleByWallet(wallet.clone()), &roles);
        env.storage().instance().set(&DataKey::ClaimToken(token_hash.clone()), &ClaimData { role_id: claim.role_id, recipient: claim.recipient, valid: false });
        Self::emit_credential_minted(env, claim.role_id, wallet, token_id);
        Self::exit(env);
        token_id
    }

    pub fn revoke_credential(env: &Env, wallet: Address, role_id: u32) {
        Self::require_admin(env);
        Self::enter(env);
        if let Some(token_id) = Self::role_token_for(env, &wallet, role_id) {
            env.storage().instance().remove(&DataKey::TokenById(token_id));
            let mut roles: Map<u32, u64> = Self::roles_for(env, &wallet);
            roles.remove(role_id);
            env.storage().instance().set(&DataKey::RoleByWallet(wallet.clone()), &roles);
            Self::emit_credential_revoked(env, role_id, wallet, token_id);
        } else {
            Self::exit(env);
            panic!("credential not found");
        }
        Self::exit(env);
    }

    pub fn has_role(env: &Env, wallet: Address, role_id: u32) -> bool {
        Self::role_token_for(env, &wallet, role_id).is_some()
    }

    pub fn token_uri(env: &Env, _token_id: u64) -> String {
        let base: String = env
            .storage()
            .instance()
            .get(BASE_URI_KEY)
            .unwrap_or(String::from_str(env, ""));
        base
    }

    pub fn supports_interface(_env: &Env, _interface_id: String) -> bool {
        true
    }

    fn new_claim(env: &Env, recipient: Address, role_id: u32) -> BytesN<32> {
        let r: u64 = env.prng().gen_range(1..=u64::MAX);
        let mut bytes = Bytes::new(env);
        let _ = recipient;
        let r_bytes = r.to_be_bytes();
        bytes.extend_from_slice(&r_bytes);
        let role_bytes = role_id.to_be_bytes();
        bytes.extend_from_slice(&role_bytes);
        let hash: BytesN<32> = env.crypto().sha256(&bytes).into();
        env.storage().instance().set(
            &DataKey::ClaimToken(hash.clone()),
            &ClaimData { role_id, recipient: recipient.clone(), valid: true },
        );
        Self::emit_claim_link_generated(env, recipient, role_id, hash.clone());
        hash
    }

    fn admin(env: &Env) -> Option<Address> {
        env.storage().instance().get(ADMIN_KEY)
    }

    fn require_admin(env: &Env) {
        let admin = Self::admin(env).expect("admin not set");
        admin.require_auth();
    }

    fn require_not_paused(env: &Env) {
        let paused: bool = env.storage().instance().get(PAUSED_KEY).unwrap_or(false);
        if paused { panic!("paused"); }
    }

    fn next_id_and_increment(env: &Env) -> u64 {
        let id: u64 = env
            .storage()
            .instance()
            .get(NEXT_TOKEN_ID_KEY)
            .unwrap_or(1u64);
        env.storage().instance().set(NEXT_TOKEN_ID_KEY, &(id + 1));
        id
    }

    fn roles_for(env: &Env, wallet: &Address) -> Map<u32, u64> {
        env.storage()
            .instance()
            .get(&DataKey::RoleByWallet(wallet.clone()))
            .unwrap_or(Map::new(env))
    }

    fn role_token_for(env: &Env, wallet: &Address, role_id: u32) -> Option<u64> {
        let roles: Map<u32, u64> = Self::roles_for(env, wallet);
        roles.get(role_id)
    }

    fn enter(env: &Env) {
        let locked: bool = env.storage().instance().get(LOCKED_KEY).unwrap_or(false);
        if locked { panic!("reentrancy"); }
        env.storage().instance().set(LOCKED_KEY, &true);
    }

    fn exit(env: &Env) {
        env.storage().instance().set(LOCKED_KEY, &false);
    }

    fn emit_credential_minted(env: &Env, role_id: u32, recipient: Address, token_id: u64) {
        env.events().publish((symbol_short!("CredMint"), role_id, recipient.clone()), token_id);
    }

    fn emit_credential_revoked(env: &Env, role_id: u32, wallet: Address, token_id: u64) {
        env.events().publish((symbol_short!("CredRev"), role_id, wallet.clone()), token_id);
    }

    fn emit_admin_transferred(env: &Env, old_admin: Address, new_admin: Address) {
        env.events().publish((symbol_short!("AdminXfer"), old_admin, new_admin), true);
    }

    fn emit_base_uri_updated(env: &Env, new_uri: String) {
        env.events().publish((symbol_short!("BaseURI"),), new_uri);
    }

    fn emit_claim_link_generated(env: &Env, recipient: Address, role_id: u32, claim_hash: BytesN<32>) {
        env.events().publish((symbol_short!("ClaimGen"), role_id, recipient), claim_hash);
    }

    fn emit_event_contract_updated(env: &Env, contract_id: String) {
        env.events().publish((symbol_short!("EventCtr"),), contract_id);
    }
}
