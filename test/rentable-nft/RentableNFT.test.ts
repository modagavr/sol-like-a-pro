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
    expect(await token.totalSupply()).to.eql(constants.Zero)

    await token.safeMint(lord.address)

    expect(await token.totalSupply())
      .to.eql(await token.balanceOf(lord.address))
      .to.eql(constants.One)

    expect(
      await token.connect(lord).transferFrom(lord.address, renter.address, 0)
    )
      .to.emit(token, 'Transfer')
      .withArgs(lord.address, renter.address, 0)

    expect(await token.totalSupply())
      .to.eql(await token.balanceOf(renter.address))
      .to.eql(constants.One)

    expect(await token.balanceOf(lord.address)).to.eql(constants.Zero)
  })

  describe('Rent Out & Finish Renting', () => {
    const expiresAt = dayjs().add(1, 'day').unix()

    beforeEach(async () => {
      await token.safeMint(lord.address)
      await token.safeMint(lord.address)
      await token.safeMint(lord.address)

      expect(await token.totalSupply())
        .to.eql(await token.balanceOf(lord.address))
        .to.eql(BigNumber.from(3))

      await expect(
        token.rentOut(renter.address, 1, expiresAt)
      ).to.be.revertedWith('ERC721: transfer from incorrect owner')

      await expect(token.connect(lord).rentOut(renter.address, 1, expiresAt))
        .to.emit(token, 'Rented')
        .withArgs(1, lord.address, renter.address, expiresAt)

      expect(
        await Promise.all([
          token.totalSupply(),
          token.balanceOf(lord.address),
          token.balanceOf(renter.address),
          token.ownerOf(1)
        ])
      ).to.eql([
        BigNumber.from(3),
        constants.Two,
        constants.One,
        renter.address
      ])

      const rental = await token.rental(1)

      expect([
        rental.isActive,
        rental.lord,
        rental.renter,
        rental.expiresAt
      ]).to.eql([true, lord.address, renter.address, BigNumber.from(expiresAt)])

      await expect(
        token.connect(renter).transferFrom(renter.address, guy.address, 1)
      ).to.be.revertedWith('RentableNFT: this token is rented')

      await expect(token.finishRenting(1)).to.be.revertedWith(
        'RentableNFT: this token is rented'
      )
    })

    it('Early Finish', async () => {
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

    afterEach(async () => {
      expect(
        await Promise.all([
          token.totalSupply(),
          token.balanceOf(lord.address),
          token.balanceOf(renter.address),
          token.ownerOf(1)
        ])
      ).to.eql([
        BigNumber.from(3),
        BigNumber.from(3),
        constants.Zero,
        lord.address
      ])

      const rental = await token.rental(1)

      expect([
        rental.isActive,
        rental.lord,
        rental.renter,
        rental.expiresAt
      ]).to.eql([
        false,
        lord.address,
        renter.address,
        BigNumber.from(expiresAt)
      ])
    })
  })
})
