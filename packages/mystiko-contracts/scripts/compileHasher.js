// Generates Hasher artifact at compile-time using Truffle's external compiler
// mechanism
const path = require('path');
const fs = require('fs');
const genContract = require('circomlibjs/src/poseidon_gencontract.js');

// where Truffle will expect to find the results of the external compiler
// command
const hasher2OutputPath = path.join(__dirname, '..', 'build', 'Hasher2.json');
const hasher3OutputPath = path.join(__dirname, '..', 'build', 'Hasher3.json');

function main() {
  const hasher2Contract = {
    contractName: 'Hasher2',
    abi: genContract.generateABI(2),
    bytecode: genContract.createCode(2),
  };

  const hasher3Contract = {
    contractName: 'Hasher3',
    abi: genContract.generateABI(3),
    bytecode: genContract.createCode(3),
  };

  fs.writeFileSync(hasher2OutputPath, JSON.stringify(hasher2Contract));
  fs.writeFileSync(hasher3OutputPath, JSON.stringify(hasher3Contract));
}

main();
