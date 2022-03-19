import { expect } from 'chai'
import { arrayify, id } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

import { SignatureChecker__factory } from '../../typechain-types'

describe('Signature Checker', () => {
  it('Full Cycle', async () => {
    const [claimer, friend] = await ethers.getSigners()

    const signatureChecker = await new SignatureChecker__factory(
      claimer
    ).deploy()

    const catHash = await signatureChecker.CAT()

    expect(catHash).to.eq(id('Cat'))

    expect(await signatureChecker.claimer()).to.eq(claimer.address)

    const claimerSignature = await claimer.signMessage(arrayify(catHash))

    expect(await signatureChecker.isValidSignature(claimerSignature)).to.eq(
      true
    )

    const friendSignature = await friend.signMessage(arrayify(catHash))

    expect(await signatureChecker.isValidSignature(friendSignature)).to.eq(
      false
    )

    expect(await signatureChecker.giftsClaimed()).to.eq(0)

    await signatureChecker.claimGift(claimerSignature)

    expect(await signatureChecker.giftsClaimed()).to.eq(1)

    await expect(
      signatureChecker.claimGift(friendSignature)
    ).to.be.revertedWith('SignatureChecker: Invalid Signature')
  })
})
