const { ccc } = require("@ckb-ccc/ccc");

async function createAccount() {
  const privKey = "0x" + require("crypto").randomBytes(32).toString("hex");
  const signer = new ccc.SignerCkbPrivateKey(new ccc.ClientPublicTestnet(), privKey);
  const address = await signer.getRecommendedAddress();
  console.log("New Private Key:", privKey);
  console.log("New Address:", address);
}

createAccount();
