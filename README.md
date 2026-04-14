# CKB Billboard

Decentralized on-chain billboard rental market on Nervos CKB.

## Project Structure

- `contracts/` — CKB Type/Lock Scripts (Rust + ckb-std)
- `frontend/` — Next.js DApp with CCC SDK wallet integration
- `backend/` — Express API for image rendering and click tracking
- `deploy/` — Deployment scripts for CKB testnet

## Deployed Contracts (CKB Testnet)

| Contract | Code Hash | Hash Type | TX Hash |
|----------|-----------|-----------|---------|
| Billboard Type Script | `0x1a4eaa2fa1617920fc63642295d3378e59453717b50e91543a3085f342470064` | data2 | `0xb11170655d47776a5b3a941ae292b0c94dde5d8528b21cc816eb01cad161b2cb` |
| Billboard Lock Script | `0x35427a0103952c02724e360e35f2532c039cdaa20b5c7b891da85bf9a19c6913` | data2 | `0xb11170655d47776a5b3a941ae292b0c94dde5d8528b21cc816eb01cad161b2cb` |

## Quick Start

### 1. Install Dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
cd ../contracts && cargo build --target riscv64imac-unknown-none-elf --release
```

### 2. Start Backend

```bash
cd backend
npm start
```

### 3. Start Frontend (Dev)

```bash
cd frontend
npm run dev
```

## Features

- **Create Billboard** — Configure min price, auto-approve, lease terms
- **Market** — Browse all billboards and their lease status
- **Bid** — Submit ad content and rent billboards
- **Dashboard** — Manage owned billboards
- **Embed** — Markdown image link + JS SDK support

## GitHub Repository

https://github.com/chainTe/ckb-billboard

## License

MIT
