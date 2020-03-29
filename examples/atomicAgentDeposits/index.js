const { encodeCallScript } = require('@aragon/test-helpers/evmScript')
const { encodeActCall } = require('@aragon/toolkit')

const {
  daoAddress,
  votingAddress,
  agentAddress,
  payments,
  environment,
} = require('./payments.json')

async function main() {
  // Encode a bunch of deposits.
  const approveSignature = 'approve(address,uint256)'
  const depositSignature = 'deposit(address,uint256,string)'
  const forwardSignature = 'forward(bytes)'

  const scripts = [
    ...(await Promise.all(
      payments.map(async ({ tokenAddress, receiverAddress, amount }) =>
        encodeCallScript([
          {
            to: tokenAddress,
            calldata: await encodeActCall(approveSignature, [
              receiverAddress,
              amount,
            ]),
          },
        ])
      )
    )),
    ...(await Promise.all(
      payments.map(async ({ tokenAddress, receiverAddress, amount, receipt }) =>
        encodeCallScript([
          {
            to: receiverAddress,
            calldata: await encodeActCall(depositSignature, [
              tokenAddress,
              amount,
              receipt,
            ]),
          },
        ])
      )
    )),
  ]

  const actions = await Promise.all(
    scripts.map(async script => ({
      to: agentAddress,
      calldata: await encodeActCall(forwardSignature, [script]),
    }))
  )

  // Encode all actions into a single EVM script.
  const script = encodeCallScript(actions)
  console.log(
    `npx dao exec ${daoAddress} ${votingAddress} newVote ${script} Payments --environment aragon:${environment} --use-frame`
  )

  process.exit()
}

main()
