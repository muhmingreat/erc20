import {
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { expect } from "chai";
  import hre from "hardhat";

describe("DLToken Contract", function () {

  let DLToken: any;
  let token: any;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let totalSupply: any;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here
    DLToken = await hre.ethers.getContractFactory("DLToken");
    [owner, addr1, addr2] = await hre.ethers.getSigners();

    // Deploy the contract
    token = await DLToken.deploy("DLToken", "DLT");
    await token.deploy();

    // Set the total supply
    totalSupply = await token.getTotalSupply();
  });

  it("should set the correct name, symbol, and owner", async function () {
    expect(await token.getTokenName()).to.equal("DLToken");
    expect(await token.getSymbol()).to.equal("DLT");
    expect(await token.balanceOf(owner.address)).to.equal(totalSupply);
  });

  it("should transfer tokens with 5% burn", async function () {
    const transferAmount = hre.ethers.utils.parseEther("1000");
    const burnAmount = transferAmount.mul(5).div(100); // 5% burn
    const expectedTransferAmount = transferAmount.sub(burnAmount); // 95%

    // Transfer 1000 tokens from owner to addr1
    await token.transfer(addr1.address, transferAmount);

    // Check balances after transfer
    const ownerBalance = await token.balanceOf(owner.address);
    const addr1Balance = await token.balanceOf(addr1.address);

    // Ensure owner has 1000 tokens less (without the burn)
    expect(ownerBalance).to.equal(totalSupply.sub(transferAmount));

    // Ensure addr1 has 950 tokens (95% of 1000)
    expect(addr1Balance).to.equal(expectedTransferAmount);

    // Ensure total supply is reduced by the burn amount
    const updatedSupply = await token.getTotalSupply();
    expect(updatedSupply).to.equal(totalSupply.sub(burnAmount));
  });

  it("should approve and allow delegated transfer with 5% burn", async function () {
    const transferAmount = hre.ethers.utils.parseEther("1000");
    const burnAmount = transferAmount.mul(5).div(100); // 5% burn
    const expectedTransferAmount = transferAmount.sub(burnAmount); // 95%

    // Approve addr1 to spend 1000 tokens from the owner's account
    await token.approve(addr1.address, transferAmount);

    // Check allowance
    expect(await token.allowance(owner.address, addr1.address)).to.equal(transferAmount);

    // addr1 transfers 1000 tokens from owner to addr2
    await token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

    // Check balances after transferFrom
    const ownerBalance = await token.balanceOf(owner.address);
    const addr2Balance = await token.balanceOf(addr2.address);

    // Ensure owner has 1000 tokens less
    expect(ownerBalance).to.equal(totalSupply.sub(transferAmount));

    // Ensure addr2 has 950 tokens (95% of 1000)
    expect(addr2Balance).to.equal(expectedTransferAmount);

    // Ensure total supply is reduced by the burn amount
    const updatedSupply = await token.getTotalSupply();
    expect(updatedSupply).to.equal(totalSupply.sub(burnAmount));
  });

  it("should fail to transfer more tokens than available", async function () {
    const balance = await token.balanceOf(addr1.address);
    expect(balance).to.equal(0); // addr1 has no tokens yet

    // Try transferring more than the available balance
    await expect(token.connect(addr1).transfer(owner.address, 1000)).to.be.revertedWith("You can't transfer more than what is available");
  });

  it("should burn 5% of tokens during transferFrom", async function () {
    const transferAmount = ethers.utils.parseEther("2000");
    const burnAmount = transferAmount.mul(5).div(100);
    const expectedTransferAmount = transferAmount.sub(burnAmount);

    // Approve addr1 to spend 2000 tokens from the owner's account
    await token.approve(addr1.address, transferAmount);

    // addr1 transfers 2000 tokens from owner to addr2
    await token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

    // Check balances after transfer
    const addr2Balance = await token.balanceOf(addr2.address);
    const updatedSupply = await token.getTotalSupply();

    // Ensure addr2 has 1900 tokens (95% of 2000)
    expect(addr2Balance).to.equal(expectedTransferAmount);

    // Ensure total supply is reduced by the burn amount
    expect(updatedSupply).to.equal(totalSupply.sub(burnAmount));
  });
});
