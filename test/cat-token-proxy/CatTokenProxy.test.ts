import { expect } from 'chai'
import { constants } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { ethers, upgrades } from 'hardhat'

import { LegacyCatToken, ModernCatToken } from '../../typechain-types'

describe('Cat Token Proxy', () => {
  it('Full Cycle', async () => {
    const [signer] = await ethers.getSigners()

    const LegacyCatTokenFactory = await ethers.getContractFactory(
      'LegacyCatToken'
    )

    const legacyCatToken = (await upgrades.deployProxy(
      LegacyCatTokenFactory
    )) as LegacyCatToken

    await legacyCatToken.deployed()

    expect((await legacyCatToken.totalSupply())._hex).to.eql(
      constants.Zero._hex
    )

    const ModernCatTokenFactory = await ethers.getContractFactory(
      'ModernCatToken'
    )

    const modernCatToken = (await upgrades.upgradeProxy(
      legacyCatToken.address,
      ModernCatTokenFactory
    )) as ModernCatToken

    expect(modernCatToken.address).to.eq(legacyCatToken.address)

    expect((await modernCatToken.totalSupply())._hex).to.eql(
      constants.Zero._hex
    )

    await modernCatToken.mint(signer.address, parseEther('1'))

    expect((await modernCatToken.totalSupply())._hex)
      .to.eql((await modernCatToken.balanceOf(signer.address))._hex)
      .to.eql(parseEther('1')._hex)
  })
})
