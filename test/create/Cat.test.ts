import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { constants } from 'ethers'
import { getContractAddress, id } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

import {
  Create2CatFactory__factory,
  CreateCat__factory,
  CreateCatFactory__factory
} from '../../typechain-types'

describe('Create Cat', () => {
  let signer: SignerWithAddress

  beforeEach(async () => {
    signer = (await ethers.getSigners())[0]
  })

  it('Using Create', async () => {
    const factory = await new CreateCatFactory__factory(signer).deploy()

    expect(await factory.cat()).to.eq(constants.AddressZero)

    const precomputedCatAddress = getContractAddress({
      from: factory.address,
      nonce: 1
    })

    await factory.deployCat(2)

    expect(await factory.cat()).to.eq(precomputedCatAddress)

    expect(
      await CreateCat__factory.connect(precomputedCatAddress, signer).age()
    ).to.eq(2)

    for (const nonce of [2, 3, 4, 5]) {
      await factory.deployCat(3)

      expect(await factory.cat()).to.eq(
        getContractAddress({
          from: factory.address,
          nonce
        })
      )
    }
  })

  it('Using Create2', async () => {
    const factory = await new Create2CatFactory__factory(signer).deploy()

    expect(await factory.cat()).to.eq(constants.AddressZero)

    const precomputedCatAddress = await factory.computeCatAddress(
      id('🐱Tom'),
      5
    )

    await factory.deployCat(id('🐱Tom'), 5)

    expect(await factory.cat()).to.eq(precomputedCatAddress)

    expect(
      await CreateCat__factory.connect(precomputedCatAddress, signer).age()
    ).to.eq(5)

    await factory.deployCat(id('🍯Honey'), 7)
    await factory.deployCat(id('🐱Tom'), 7)

    await expect(factory.deployCat(id('🐱Tom'), 5)).to.be.revertedWith(
      'Create2: Failed on deploy'
    )
  })
})
