import { task } from "hardhat/config";
import { _PAIRS } from "../helpers/deploy/constants";
import { ContractId } from "../helpers/types";
import { Event } from "ethers";

const getPairAddressFromTx = (ev: Array<Event>) => {
  const v = ev?.find((x) => x.event === "NewLendingPair");
  return v!.args!.pair;
};

task("deploypair", "Deploy New Lending-Pair")
  .addParam("pair", "The LendingPair's name")
  .setAction(async (taskArgs, hre) => {
    const pairName = taskArgs["pair"];
    const pair = _PAIRS[pairName];

    const [admin] = await hre.ethers.getSigners();

    const lendingPairContract = await hre.ethers.getContractAt(
      ContractId.LendingPairFactory,
      (await hre.deployments.get(ContractId.LendingPairFactory)).address
    );

    const tx = await (
      await lendingPairContract
        .connect(admin)
        .createLendingPairWithProxy(
          pairName,
          pair.symbol,
          pair.pauseGuardian,
          pair.collateralAsset,
          pair.borrowVars
        )
    ).wait();

    console.log(`tx hash:`, `https://etherscan.io/tx/${tx.transactionHash}`);
    console.log("NewLendingPair: ", getPairAddressFromTx(tx.events));
  });
