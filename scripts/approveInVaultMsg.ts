import { ethers } from "hardhat";

import { signVaultApproveContractMessage } from "../helpers/message";

const main = async () => {
  const vault = await ethers.getContractAt("Vault", "0x67EeB1E1dd79a4ec823256Dd6c5C6474025618f6");
  const lendingPair = "0xb88e0fEB17E3001A2456b571CfD6AE4D467EFfB0"; // lending pair address
  const user = "0xabB6D4a1015e291b1bc71e7e56ff2c9204665b07"; // TODO: replace with test user address

  const vaultDetails = {
    name: await vault.name(),
    address: vault.address,
    chainId: (await ethers.provider.getNetwork()).chainId,
    version: await vault.version(),
  };

  const nonce = (await vault.userApprovalNonce(user)).toNumber();

  const { v, r, s } = await signVaultApproveContractMessage(
    "0x*********", // TODO: replace with test user private key (should start with 0x)
    vaultDetails,
    {
      approve: true,
      user,
      nonce,
      contract: lendingPair,
    }
  );

  console.log("====>res", v, ethers.utils.hexlify(r), ethers.utils.hexlify(s));
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
