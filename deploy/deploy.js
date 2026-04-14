const { ccc } = require("@ckb-ccc/ccc");
const fs = require("fs");
const path = require("path");

const PRIVATE_KEY = process.env.PRIVATE_KEY;

function calcCapacity(lockArgsLen, typeArgsLen, dataLen) {
  const bytes = 61 + lockArgsLen + (typeArgsLen > 0 ? typeArgsLen : 0) + dataLen;
  return ccc.numToHex(BigInt(bytes) * BigInt(100000000));
}

async function deploy() {
  if (!PRIVATE_KEY) {
    console.error("Please set PRIVATE_KEY environment variable");
    process.exit(1);
  }

  const client = new ccc.ClientPublicTestnet();
  const signer = new ccc.SignerCkbPrivateKey(client, PRIVATE_KEY);
  const address = await signer.getRecommendedAddress();
  console.log("Deployer address:", address);

  const typeScriptBin = fs.readFileSync(
    path.join(__dirname, "../contracts/target/riscv64imac-unknown-none-elf/release/billboard-type-script")
  );
  const lockScriptBin = fs.readFileSync(
    path.join(__dirname, "../contracts/target/riscv64imac-unknown-none-elf/release/billboard-lock-script")
  );

  console.log("Type script size:", typeScriptBin.length);
  console.log("Lock script size:", lockScriptBin.length);

  const tx = ccc.Transaction.from({});
  const deployerLock = await ccc.Script.fromKnownScript(
    client,
    ccc.KnownScript.Secp256k1Blake160,
    (await signer.getAddressObjs())[0].script.args
  );
  
  const typeCapacity = calcCapacity(20, 0, typeScriptBin.length);
  tx.addOutput(
    {
      cellOutput: {
        lock: deployerLock,
        type: null,
        capacity: typeCapacity,
      },
    },
    ccc.hexFrom(typeScriptBin)
  );

  const lockCapacity = calcCapacity(20, 0, lockScriptBin.length);
  tx.addOutput(
    {
      cellOutput: {
        lock: deployerLock,
        type: null,
        capacity: lockCapacity,
      },
    },
    ccc.hexFrom(lockScriptBin)
  );

  // Add change output
  tx.addOutput(
    {
      cellOutput: {
        lock: deployerLock,
        type: null,
        capacity: "0x0",
      },
    },
    "0x"
  );

  await tx.completeInputsByCapacity(signer);
  await tx.completeFeeBy(signer, 1000);
  await tx.addCellDepsOfKnownScripts(client, ccc.KnownScript.Secp256k1Blake160);
  await signer.signTransaction(tx);

  const txHash = await client.sendTransaction(tx);
  console.log("Deployment TX:", txHash);

  const typeHash = ccc.hashCkb(ccc.hexFrom(typeScriptBin));
  const lockHash = ccc.hashCkb(ccc.hexFrom(lockScriptBin));

  console.log("\n=== Deployment Results ===");
  console.log("Billboard Type Script:");
  console.log("  Code Hash:", typeHash);
  console.log("  Hash Type: data2");
  console.log("  TX Hash:", txHash);
  console.log("  Output Index: 0");
  console.log("\nBillboard Lock Script:");
  console.log("  Code Hash:", lockHash);
  console.log("  Hash Type: data2");
  console.log("  TX Hash:", txHash);
  console.log("  Output Index: 1");

  const envContent = `BILLBOARD_TYPE_CODE_HASH=${typeHash}
BILLBOARD_TYPE_HASH_TYPE=data2
BILLBOARD_LOCK_CODE_HASH=${lockHash}
BILLBOARD_LOCK_HASH_TYPE=data2
`;
  fs.writeFileSync(path.join(__dirname, "../backend/.env"), envContent);
  fs.writeFileSync(path.join(__dirname, "../frontend/.env.local"), envContent.replace(/_/g, "NEXT_PUBLIC_"));
  console.log("\n.env files written.");
}

deploy().catch((e) => {
  console.error(e);
  process.exit(1);
});
