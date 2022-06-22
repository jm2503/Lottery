const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const { interface, bytecode } = require("../compile");

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: "1000000" });
});

describe("Lottery Contract", () => {
  it("Contract deployed successfully", () => {
    assert.ok(lottery.options.address);
  });

  it("Is one account added to lottery?", async () => {
    await lottery.methods.addNewPlayer().send({
      from: accounts[1],
      value: web3.utils.toWei("1", "ether"),
    });

    const players = await lottery.methods.getPlayersArray().call({
      from: accounts[0],
    });

    assert.equal(accounts[1], players[0]);
    assert.equal(1, players.length);
  });

  it("Are three accounts added to lottery?", async () => {
    await lottery.methods.addNewPlayer().send({
      from: accounts[1],
      value: web3.utils.toWei("1", "ether"),
    });

    await lottery.methods.addNewPlayer().send({
      from: accounts[2],
      value: web3.utils.toWei("1", "ether"),
    });

    await lottery.methods.addNewPlayer().send({
      from: accounts[3],
      value: web3.utils.toWei("1", "ether"),
    });

    const players = await lottery.methods.getPlayersArray().call({
      from: accounts[0],
    });

    assert.equal(accounts[1], players[0]);
    assert.equal(accounts[2], players[1]);
    assert.equal(accounts[3], players[2]);

    assert.equal(3, players.length);
  });

  it("Is minimum ether amount required to join a lottery?", async () => {
    try {
      await lottery.methods.addNewPlayer().send({
        from: accounts[1],
        value: web3.utils.toWei("0.1", "ether"),
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("Are users other than manager restricted from picking a winner?", async () => {
    try {
      await lottery.methods.selectWinner().send({
        from: accounts[1],
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("Is the lottery winner receiving his prize and lottery state being reset?", async () => {
    await lottery.methods.addNewPlayer().send({
      from: accounts[0],
      value: web3.utils.toWei("1", "ether"),
    });

    const balanceBefore = await web3.eth.getBalance(accounts[0]);

    await lottery.methods.selectWinner().send({
      from: accounts[0],
    });

    const balanceAfter = await web3.eth.getBalance(accounts[0]);
    const balanceDifference = balanceAfter - balanceBefore;
    assert(balanceDifference > web3.utils.toWei("0.9", "ether"));

    const players = await lottery.methods.getPlayersArray().call({
      from: accounts[0],
    });

    const prizePoolAfter = await lottery.methods.getBalance().call({
      from: accounts[0],
    });

    assert.equal(players.length, 0);
    assert.equal(prizePoolAfter, 0);
  });
});
