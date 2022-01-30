import { expect } from 'chai'
import { randomBytes } from 'crypto'
import { Wallet } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import keccak256 from 'keccak256'
import { MerkleTree } from 'merkletreejs'

import {
  MerkleAirdrop__factory,
  MerkleAirdropToken__factory
} from '../../typechain-types'

describe('Merkle Airdrop', () => {
  it('Full Cycle', async () => {
    const [signer, guy] = await ethers.getSigners()

    const token = await new MerkleAirdropToken__factory(signer).deploy()

    const randomAddresses = new Array(15)
      .fill(0)
      .map(() => new Wallet(randomBytes(32).toString('hex')).address)

    const merkleTree = new MerkleTree(
      randomAddresses.concat(signer.address),
      keccak256,
      { hashLeaves: true, sortPairs: true }
    )

    const root = merkleTree.getHexRoot()

    const airdrop = await new MerkleAirdrop__factory(signer).deploy(
      token.address,
      root
    )

    await token.transfer(airdrop.address, parseEther('10'))

    const proof = merkleTree.getHexProof(keccak256(signer.address))

    expect(await airdrop.claimed(signer.address)).to.eq(false)

    expect(await airdrop.canClaim(signer.address, proof)).to.eq(true)

    await expect(() => airdrop.claim(proof)).to.changeTokenBalances(
      token,
      [airdrop, signer],
      [parseEther('-1'), parseEther('1')]
    )

    expect(await airdrop.claimed(signer.address)).to.eq(true)

    expect(await airdrop.canClaim(signer.address, proof)).to.eq(false)

    await expect(airdrop.claim(proof)).to.be.revertedWith(
      'MerkleAirdrop: Address is not a candidate for claim'
    )

    expect(await airdrop.claimed(guy.address)).to.eq(false)

    expect(await airdrop.canClaim(guy.address, proof)).to.eq(false)

    await expect(airdrop.connect(guy).claim(proof)).to.be.revertedWith(
      'MerkleAirdrop: Address is not a candidate for claim'
    )

    const badProof = merkleTree.getHexProof(keccak256(guy.address))

    expect(badProof).to.eql([])

    expect(await airdrop.canClaim(guy.address, badProof)).to.eq(false)

    await expect(airdrop.connect(guy).claim(badProof)).to.be.revertedWith(
      'MerkleAirdrop: Address is not a candidate for claim'
    )
  })
})
