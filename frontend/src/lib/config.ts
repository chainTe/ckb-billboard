export const CKB_RPC_URL = process.env.NEXT_PUBLIC_CKB_RPC_URL || "https://testnet.ckb.dev/rpc";
export const CKB_INDEXER_URL = process.env.NEXT_PUBLIC_CKB_INDEXER_URL || "https://testnet.ckb.dev/indexer";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/v1";

// These will be set after contract deployment
export const BILLBOARD_TYPE_CODE_HASH = process.env.NEXT_PUBLIC_BILLBOARD_TYPE_CODE_HASH || "";
export const BILLBOARD_TYPE_HASH_TYPE = process.env.NEXT_PUBLIC_BILLBOARD_TYPE_HASH_TYPE || "data2";
export const BILLBOARD_LOCK_CODE_HASH = process.env.NEXT_PUBLIC_BILLBOARD_LOCK_CODE_HASH || "";
export const BILLBOARD_LOCK_HASH_TYPE = process.env.NEXT_PUBLIC_BILLBOARD_LOCK_HASH_TYPE || "data2";

export const MIN_LEASE_BLOCKS = 144; // ~1 day
export const COOLDOWN_BLOCKS = 8640; // ~24 hours
export const ONE_CKB = BigInt(100000000);
