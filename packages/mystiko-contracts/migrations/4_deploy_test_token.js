const TestToken = artifacts.require('TestToken');
const holders = [
  '0x0710f785E1835E1713fF6d9ccD0Aca2Ad2013022',
  '0x90Dacf39bB9Bf2da9A94933868cB7936f4F08027',
  '0x9135eF7AAFFb20e3fa7E8d7B7910184BE97ABD1E',
];

function toDecimals(amount, decimals) {
  let padDecimals = '';
  for (var i = 0; i < decimals; i++) {
    padDecimals = padDecimals + '0';
  }
  return amount + padDecimals;
}

module.exports = async function (deployer, network) {
  if (network != 'development') {
    const mtt = await TestToken.new('Mystiko Test Token', 'MTT', 18);
    console.log('MTT address ', mtt.address);

    const usd = await TestToken.new('Mystiko Test Token', 'mUSD', 6);
    console.log('mUSD address ', usd.address);

    const mETH = await TestToken.new('Mystiko Test Token', 'mETH', 18);
    console.log('mETH address ', mETH.address);

    const baseAmount = 200000000;
    for (const holder of holders) {
      let amount = toDecimals(baseAmount, 18);
      await mtt.transfer(holder, amount);
      console.log('transfer MTT to ', holder);

      await mETH.transfer(holder, amount);
      console.log('transfer mETH to ', holder);

      amount = toDecimals(baseAmount, 6);
      await usd.transfer(holder, amount);
      console.log('transfer mUSD to ', holder);
    }
  }

  await deployer.deploy(TestToken, 'Mystiko Test Token', 'MTT', 18);
};
