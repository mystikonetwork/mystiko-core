const MystikoWithLoop = artifacts.require('MystikoWithLoop');
const TestToken = artifacts.require('TestToken');
const Verifier = artifacts.require('Verifier');
const Hasher = artifacts.require('Hasher');

contract('MystikoWithLoop', () => {
  it('should set token correctly information correctly', async () => {
    const tokenContract = await TestToken.deployed();
    const loopContract = await MystikoWithLoop.deployed();
    expect(await loopContract.getToken.call()).to.equal(tokenContract.address);
    expect(await loopContract.getTokenName.call()).to.equal(await tokenContract.name.call());
    expect(await loopContract.getTokenSymbol.call()).to.equal(await tokenContract.symbol.call());
    const actualDecimals = (await loopContract.getTokenDecimals.call()).toString();
    const expectedDecimals = (await tokenContract.decimals.call()).toString();
    expect(actualDecimals).to.equal(expectedDecimals);
  });

  it('should set verifier information correctly', async () => {
    const loopContract = await MystikoWithLoop.deployed();
    const verifierContract = await Verifier.deployed();
    expect(await loopContract.getVerifierAddress.call()).to.equal(verifierContract.address);
  });

  it('should set hasher information correctly', async () => {
    const loopContract = await MystikoWithLoop.deployed();
    const hasherContract = await Hasher.deployed();
    expect(await loopContract.getHasherAddress.call()).to.equal(hasherContract.address);
  });
});
