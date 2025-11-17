use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec};

const ADMIN_KEY: &Symbol = &symbol_short!("ADMIN");
const NEXT_EVENT_ID_KEY: &Symbol = &symbol_short!("NEXT_EVT");

#[contracttype]
pub enum DataKey {
    EventById(u64),
    Supervisor(Address),
    Presence(u64, Address),
    AttendeesCount(u64),
    AttendeeByIndex(u64, u64),
}

#[contracttype]
#[derive(Clone)]
pub struct EventData {
    pub name: String,
    pub start_ts: u64,
    pub end_ts: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct EventSummary {
    pub id: u64,
    pub name: String,
    pub start_ts: u64,
    pub end_ts: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct AttendeeInfo {
    pub address: Address,
    pub registered_at: u64,
    pub active: bool,
}

#[contract]
pub struct PresenceEvents;

#[contractimpl]
impl PresenceEvents {
    pub fn __constructor(env: &Env, admin: Address) {
        env.storage().instance().set(ADMIN_KEY, &admin);
        env.storage().instance().set(NEXT_EVENT_ID_KEY, &1u64);
    }

    

    pub fn set_supervisor(env: &Env, user: Address, status: bool) {
        Self::require_admin(env);
        env.storage().instance().set(&DataKey::Supervisor(user), &status);
    }

    pub fn create_event(env: &Env, name: String, start_ts: u64, end_ts: u64, operator: Address) -> u64 {
        operator.require_auth();
        let enabled: bool = env.storage().instance().get(&DataKey::Supervisor(operator.clone())).unwrap_or(false);
        if !enabled { panic!("not supervisor"); }
        if start_ts == 0 || end_ts == 0 || end_ts <= start_ts { panic!("invalid window"); }
        let id = Self::next_event_id(env);
        env.storage().instance().set(&DataKey::EventById(id), &EventData { name, start_ts, end_ts });
        id
    }

    pub fn get_event(env: &Env, event_id: u64) -> Option<EventData> {
        env.storage().instance().get(&DataKey::EventById(event_id))
    }

    pub fn register_presence(env: &Env, event_id: u64, attendee: Address) {
        attendee.require_auth();
        let ev: EventData = env.storage().instance().get(&DataKey::EventById(event_id)).expect("event not found");
        let now = env.ledger().timestamp();
        if now > ev.end_ts { panic!("outside window"); }
        let already: bool = env.storage().instance().get(&DataKey::Presence(event_id, attendee.clone())).unwrap_or(false);
        if already { panic!("already registered"); }
        
        // Registrar presença
        env.storage().instance().set(&DataKey::Presence(event_id, attendee.clone()), &true);
        
        // Adicionar à lista de participantes
        let count: u64 = env.storage().instance().get(&DataKey::AttendeesCount(event_id)).unwrap_or(0);
        env.storage().instance().set(&DataKey::AttendeeByIndex(event_id, count), &AttendeeInfo {
            address: attendee.clone(),
            registered_at: now,
            active: true
        });
        env.storage().instance().set(&DataKey::AttendeesCount(event_id), &(count + 1));
    }

    pub fn has_presence(env: &Env, event_id: u64, attendee: Address) -> bool {
        env.storage().instance().get(&DataKey::Presence(event_id, attendee)).unwrap_or(false)
    }

    pub fn list_attendees(env: &Env, event_id: u64, cursor: u64, limit: u32) -> Vec<AttendeeInfo> {
        let count: u64 = env.storage().instance().get(&DataKey::AttendeesCount(event_id)).unwrap_or(0);
        let mut out: Vec<AttendeeInfo> = Vec::new(env);
        if limit == 0 { return out; }
        
        let mut skipped = 0u64;
        let mut taken = 0u32;
        let mut i = 0u64;
        
        while i < count && taken < limit {
            if let Some(attendee) = env.storage().instance().get(&DataKey::AttendeeByIndex(event_id, i)) {
                if skipped < cursor {
                    skipped += 1;
                } else {
                    out.push_back(attendee);
                    taken += 1;
                }
            }
            i += 1;
        }
        out
    }

    pub fn remove_presence(env: &Env, event_id: u64, attendee: Address) {
        // Apenas supervisores podem remover presenças
        let caller = env.current_contract_address();
        let is_supervisor: bool = env.storage().instance().get(&DataKey::Supervisor(caller.clone())).unwrap_or(false);
        if !is_supervisor { panic!("not supervisor"); }
        
        // Verificar se a presença existe
        let has_presence: bool = env.storage().instance().get(&DataKey::Presence(event_id, attendee.clone())).unwrap_or(false);
        if !has_presence { panic!("attendee not registered"); }
        
        // Marcar presença como inativa (não removemos do storage, apenas marcamos como inativa)
        let count: u64 = env.storage().instance().get(&DataKey::AttendeesCount(event_id)).unwrap_or(0);
        let mut found = false;
        let mut i = 0u64;
        
        while i < count && !found {
            let attendee_info: Option<AttendeeInfo> = env.storage().instance().get(&DataKey::AttendeeByIndex(event_id, i));
            if let Some(mut info) = attendee_info {
                if info.address == attendee {
                    info.active = false;
                    env.storage().instance().set(&DataKey::AttendeeByIndex(event_id, i), &info);
                    found = true;
                }
            }
            i += 1;
        }
        
        // Remover a presença do mapping principal
        env.storage().instance().set(&DataKey::Presence(event_id, attendee), &false);
    }

    pub fn list_events(env: &Env, start_id: u64, limit: u32) -> Vec<EventSummary> {
        let mut out: Vec<EventSummary> = Vec::new(env);
        if limit == 0 { return out; }
        let mut i = start_id;
        let max = start_id.saturating_add(limit as u64);
        while i < max {
            let opt: Option<EventData> = env.storage().instance().get(&DataKey::EventById(i));
            if let Some(ev) = opt {
                out.push_back(EventSummary { id: i, name: ev.name, start_ts: ev.start_ts, end_ts: ev.end_ts });
            }
            i += 1;
        }
        out
    }

    pub fn list_upcoming(env: &Env) -> Vec<EventSummary> {
        let mut selected: Vec<EventSummary> = Vec::new(env);
        let now = env.ledger().timestamp();
        let mut id: u64 = env.storage().instance().get(NEXT_EVENT_ID_KEY).unwrap_or(1u64);
        if id == 0 { return selected; }
        if id > 0 { id -= 1; }
        let mut count = 0u32;
        while id >= 1 && count < 64 {
            let opt: Option<EventData> = env.storage().instance().get(&DataKey::EventById(id));
            if let Some(ev) = opt {
                if ev.end_ts > now {
                    let item = EventSummary { id, name: ev.name, start_ts: ev.start_ts, end_ts: ev.end_ts };
                    let mut inserted = false;
                    let mut idx = 0u32;
                    while idx < selected.len() {
                        let cur = selected.get(idx).unwrap();
                        if item.start_ts < cur.start_ts {
                            selected.insert(idx, item.clone());
                            inserted = true;
                            break;
                        }
                        idx += 1;
                    }
                    if !inserted { selected.push_back(item); }
                    if selected.len() > 5 { selected.pop_back(); }
                }
            }
            if id == 1 { break; }
            id -= 1;
            count += 1;
        }
        selected
    }

    pub fn list_closed(env: &Env, cursor: u64, limit: u32) -> Vec<EventSummary> {
        let mut out: Vec<EventSummary> = Vec::new(env);
        if limit == 0 { return out; }
        let now = env.ledger().timestamp();
        let mut id: u64 = env.storage().instance().get(NEXT_EVENT_ID_KEY).unwrap_or(1u64);
        if id == 0 { return out; }
        if id > 0 { id -= 1; }
        let mut skipped = 0u64;
        let mut taken = 0u32;
        while id >= 1 && taken < limit {
            let opt: Option<EventData> = env.storage().instance().get(&DataKey::EventById(id));
            if let Some(ev) = opt {
                if ev.end_ts <= now {
                    if skipped < cursor { skipped += 1; } else {
                        out.push_back(EventSummary { id, name: ev.name, start_ts: ev.start_ts, end_ts: ev.end_ts });
                        taken += 1;
                    }
                }
            }
            if id == 1 { break; }
            id -= 1;
        }
        out
    }

    fn next_event_id(env: &Env) -> u64 {
        let id: u64 = env.storage().instance().get(NEXT_EVENT_ID_KEY).unwrap_or(1u64);
        env.storage().instance().set(NEXT_EVENT_ID_KEY, &(id + 1));
        id
    }

    fn require_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(ADMIN_KEY).expect("admin not set");
        admin.require_auth();
    }

    pub fn transfer_admin(env: &Env, new_admin: Address) {
        Self::require_admin(env);
        env.storage().instance().set(ADMIN_KEY, &new_admin);
    }
}
