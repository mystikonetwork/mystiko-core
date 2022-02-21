const TestToken = artifacts.require('TestToken');

module.exports = async function (deployer) {
  const mtt = await TestToken.new('Mystiko Test Token', 'MTT', 18);
  const usd = await TestToken.new('Mystiko Test Token', 'mUSD', 6);
  const bnb = await TestToken.new('Mystiko Test Token', 'mBNB', 18);
  const eth = await TestToken.new('Mystiko Test Token', 'mETH', 18);

  await deployer.deploy(TestToken, 'Mystiko Test Token', 'MTT', 18);

  console.log('MTT address ', mtt.address);
  console.log('mUSD address ', usd.address);
  console.log('mBNB address ', bnb.address);
  console.log('mETH address ', eth.address);
};
