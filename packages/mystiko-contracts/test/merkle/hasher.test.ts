import { Hasher2 } from '../../typechain';
import { deployExternalContracts, loadFixture } from '../util/common';

const { expect } = require('chai');

describe('Hasher', () => {
  async function fixture() {
    const { hasher2 } = await deployExternalContracts();
    return { hasher2 };
  }

  let hasher2: Hasher2;

  beforeEach(async () => {
    const res = await loadFixture(fixture);
    hasher2 = res.hasher2;
  });

  it('should return correct hash value', async () => {
    const zero = '0x09f658457775074ff4c842032a5ec2f1134c32784cca59d594caac8c503b7923';
    const hash = await hasher2['poseidon(bytes32[2])']([zero, zero]);
    expect(hash).to.equal('0x1a77569b79cb7c2eaf9368de9e3b1efc0a606561e5ab299c2337340f3cdd576a');
  });
});
