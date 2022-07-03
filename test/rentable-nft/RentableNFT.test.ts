import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import dayjs from 'dayjs'
import { BigNumber, constants } from 'ethers'
import { ethers, network } from 'hardhat'

import { RentableNFT, RentableNFT__factory } from '../../typechain-types'

describe('Rentable NFT', () => {
  let owner: SignerWithAddress,
    lord: SignerWithAddress,
    renter: SignerWithAddress,
    guy: SignerWithAddress

  let token: RentableNFT

  beforeEach(async () => {
    const signers = await ethers.getSigners()

    owner = signers[0]

    lord = signers[1]

    renter = signers[2]

    guy = signers[3]

    token = await new RentableNFT__factory(owner).deploy()
  })

  it('Mint & Transfer', async () => {
    expect((await token.totalSupply())._hex).to.eql(constants.Zero._hex)

    await token.safeMint(lord.address)

    expect((await token.totalSupply())._hex)
      .to.eql((await token.balanceOf(lord.address))._hex)
      .to.eql(constants.One._hex)

    expect(
      await token.connect(lord).transferFrom(lord.address, renter.address, 0)
    )
      .to.emit(token, 'Transfer')
      .withArgs(lord.address, renter.address, 0)

    expect((await token.totalSupply())._hex)
      .to.eql((await token.balanceOf(renter.address))._hex)
      .to.eql(constants.One._hex)

    expect((await token.balanceOf(lord.address))._hex).to.eql(
      constants.Zero._hex
    )
  })

  describe('Rent Out & Finish Renting', () => {
    const expiresAt = dayjs().add(1, 'day').unix()

    beforeEach(async () => {
      await token.safeMint(lord.address)
      await token.safeMint(lord.address)
      await token.safeMint(lord.address)

      expect((await token.totalSupply())._hex)
        .to.eql((await token.balanceOf(lord.address))._hex)
        .to.eql(BigNumber.from(3)._hex)

      await expect(
        token.rentOut(renter.address, 1, expiresAt)
      ).to.be.revertedWith('ERC721: transfer from incorrect owner')

      await expect(token.connect(lord).rentOut(renter.address, 1, expiresAt))
        .to.emit(token, 'Rented')
        .withArgs(1, lord.address, renter.address, expiresAt)

      expect(
        await Promise.all([
          (await token.totalSupply())._hex,
          (await token.balanceOf(lord.address))._hex,
          (await token.balanceOf(renter.address))._hex,
          token.ownerOf(1)
        ])
      ).to.eql([
        BigNumber.from(3)._hex,
        constants.Two._hex,
        constants.One._hex,
        renter.address
      ])

      const rental = await token.rental(1)

      expect([
        rental.isActive,
        rental.lord,
        rental.renter,
        rental.expiresAt._hex
      ]).to.eql([
        true,
        lord.address,
        renter.address,
        BigNumber.from(expiresAt)._hex
      ])

      await expect(
        token.connect(renter).transferFrom(renter.address, guy.address, 1)
      ).to.be.revertedWith('RentableNFT: this token is rented')
    })

    it('Early Finish', async () => {
      await expect(token.finishRenting(1)).to.be.revertedWith(
        'RentableNFT: this token is rented'
      )

      await expect(token.connect(renter).finishRenting(1))
        .to.emit(token, 'FinishedRent')
        .withArgs(1, lord.address, renter.address, expiresAt)
    })

    it('After Expiration', async () => {
      await network.provider.send('evm_setNextBlockTimestamp', [expiresAt])

      await expect(token.connect(guy).finishRenting(1))
        .to.emit(token, 'FinishedRent')
        .withArgs(1, lord.address, renter.address, expiresAt)
    })

    it('Revert abuse finishRenting to return transfered token', async () => {
      await network.provider.send('evm_setNextBlockTimestamp', [expiresAt * 10])
      await token.connect(guy).finishRenting(1)

      await token.connect(lord).transferFrom(lord.address, renter.address, 1)

      await expect(token.connect(guy).finishRenting(1)).to.be.revertedWith(
        'RentableNFT: this token is not rented'
      )

      await token.connect(renter).transferFrom(renter.address, lord.address, 1)
    })

    afterEach(async () => {
      expect(
        await Promise.all([
          (await token.totalSupply())._hex,
          (await token.balanceOf(lord.address))._hex,
          (await token.balanceOf(renter.address))._hex,
          token.ownerOf(1)
        ])
      ).to.eql([
        BigNumber.from(3)._hex,
        BigNumber.from(3)._hex,
        constants.Zero._hex,
        lord.address
      ])

      const rental = await token.rental(1)

      expect([
        rental.isActive,
        rental.lord,
        rental.renter,
        rental.expiresAt._hex
      ]).to.eql([
        false,
        constants.AddressZero,
        constants.AddressZero,
        BigNumber.from(0)._hex
      ])
    })
  })
})
