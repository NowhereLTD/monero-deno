import {Monero} from "../src/Monero.class.js";

export class Tests {
  constructor() {
    return (async function () {
      this.monero = await new Monero();
      console.log(await this.monero.handler.ready);
      return this;
    }.bind(this)());
  }

  async run() {
    await this.initWallet();
  }

  async initWallet() {
    /*
    {
      path: "sample_wallet_full",
      password: "supersecretpassword123",
      networkType: "stagenet",
      serverUri: "http://localhost:38081",
      serverUsername: "superuser",
      serverPassword: "abctesting123",
      mnemonic: "hefty value scenic...",
      restoreHeight: 573936,
    }
    */

    let password = "supersecretpassword123";
    let networkType = "stagenet";
    let daemonUri = "http://localhost:38081";
    let daemonUsername = "superuser";
    let daemonPassword = "abctesting123";
    let mnemonic = "ability acidic adult altitude altitude ability acidic adult altitude altitude ability acidic adult altitude altitude ability acidic adult altitude altitude ability acidic adult altitude altitude";
    let restoreHeight = 573936;
    let rejectUnauthorizedFnId = "";
    let seedOffset = "";
    let callbackFn = async function(cppAddress) {
      if (typeof cppAddress === "string") console.error("error: " + cppAddress);
      else console.log("yes" + cppAddress);
    };

    await this.monero.handler.create_full_wallet_from_mnemonic(password, networkType, mnemonic, daemonUri, daemonUsername, daemonPassword, rejectUnauthorizedFnId, restoreHeight, seedOffset, callbackFn);
  }
}
