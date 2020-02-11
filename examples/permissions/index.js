const { encodeCallScript } = require('@aragon/test-helpers/evmScript')
const { encodeActCall } = require('@aragon/toolkit')
const { keccak256 } = require('web3-utils')

const {
  daoAddress,
  aclAddress,
  votingAddress,
  create,
  grant,
  revoke,
  environment,
} = require('./assignations.json')

async function main() {
  // Encode a bunch of acl changes.
  const createSignature = 'createPermission(address,address,bytes32,address)'
  const grantSignature = 'grantPermission(address,address,bytes32)'
  const revokeSignature = 'revokePermission(address,address,bytes32)'
  const calldatum = await Promise.all([
    ...create.map(([entity, app, role, manager]) =>
      encodeActCall(createSignature, [entity, app, keccak256(role), manager])
    ),
    ...grant.map(([entity, app, role]) =>
      encodeActCall(grantSignature, [entity, app, keccak256(role)])
    ),
    ...revoke.map(([entity, app, role]) =>
      encodeActCall(revokeSignature, [entity, app, keccak256(role)])
    ),
  ])

  const actions = calldatum.map(calldata => ({
    to: aclAddress,
    calldata,
  }))

  // Encode all actions into a single EVM script.
  const script = encodeCallScript(actions)
  console.log(
    `npx dao exec ${daoAddress} ${votingAddress} newVote ${script} MintsAndBurns --environment aragon:${environment} `
  )

  process.exit()
}

main()
