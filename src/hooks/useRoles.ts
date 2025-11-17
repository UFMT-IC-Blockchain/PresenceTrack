import { useEffect, useState } from "react";
import { useWallet } from "./useWallet";
import ownerRules from "../contracts/owner_rules";

export const useRoles = () => {
  const { address } = useWallet();
  const [roles, setRoles] = useState({ isAdmin: false, isSupervisor: false, isAssociate: false, ready: false });

  useEffect(() => {
    const run = async () => {
      if (!address) { setRoles({ isAdmin: false, isSupervisor: false, isAssociate: false, ready: true }); return; }
      try {
        const a: { result?: boolean | { unwrap?: () => unknown } } = await ownerRules.has_role({ wallet: address, role_id: 1 });
        const s: { result?: boolean | { unwrap?: () => unknown } } = await ownerRules.has_role({ wallet: address, role_id: 2 });
        const u: { result?: boolean | { unwrap?: () => unknown } } = await ownerRules.has_role({ wallet: address, role_id: 3 });
        const getBool = (resp: { result?: boolean | { unwrap?: () => unknown } } | boolean | null | undefined) => {
          if (typeof resp === "boolean") return resp;
          const r = resp?.result;
          if (typeof r === "boolean") return r;
          const unwrap = (r as { unwrap?: () => unknown })?.unwrap;
          if (typeof unwrap === "function") {
            try { return !!unwrap(); } catch { return false; }
          }
          return false;
        };
        const av = getBool(a);
        const sv = getBool(s);
        const uv = getBool(u);
        setRoles({ isAdmin: !!av, isSupervisor: !!sv, isAssociate: !!uv, ready: true });
      } catch {
        setRoles({ isAdmin: false, isSupervisor: false, isAssociate: false, ready: true });
      }
    };
    void run();
  }, [address]);

  return roles;
};
