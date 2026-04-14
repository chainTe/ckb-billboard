const bip32 = require("bip32");
const { ccc } = require("@ckb-ccc/ccc");

const masterPrivKey = Buffer.from("c7ad8bd4fd17cf3e212b2171f96f78dda4075f2ae6f90660b073c4eb28d7b035", "hex");
const chainCode = Buffer.from("16efdfa535282a0a5be354ef7b408d1f209b3d464384ed71ebfe1bd4e038e273", "hex");
const targetAddress = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqw55dvxd8p25k6q2xr99w42lqzgu8gc3yqmgdt78";

async function findPrivateKey() {
  const node = bip32.BIP32Factory(require("tiny-secp256k1")).fromPrivateKey(masterPrivKey, chainCode);
  
  const paths = [
    "m/44'/309'/0'",
    "m/44'/309'/0'/0",
    "m/44'/309'/0'/0/0",
    "m/44'/309'/1'/0/0",
  ];
  
  for (const path of paths) {
    const child = node.derivePath(path);
    const privKey = "0x" + Buffer.from(child.privateKey).toString("hex");
    const signer = new ccc.SignerCkbPrivateKey(new ccc.ClientPublicTestnet(), privKey);
    const addr = await signer.getRecommendedAddress();
    console.log(`Path: ${path}`);
    console.log(`  Address: ${addr}`);
    console.log(`  Private: ${privKey}`);
    if (addr === targetAddress) {
      console.log("  *** MATCH ***");
    }
  }
}

findPrivateKey().catch(console.error);
