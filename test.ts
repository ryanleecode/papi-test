import { westend2_people } from '@polkadot-api/descriptors'
import { Binary, createClient } from 'polkadot-api'
import { getWsProvider } from 'polkadot-api/ws-provider/node'
import { sr25519CreateDerive } from '@polkadot-labs/hdkd'
import {
  entropyToMiniSecret,
  mnemonicToEntropy,
  ss58Address,
} from '@polkadot-labs/hdkd-helpers'
import { getPolkadotSigner } from '@polkadot-api/signer'
import { toHex } from '@polkadot-api/utils'
import { withLogsRecorder } from '@polkadot-api/logs-provider'
import * as fs from "node:fs"

const f = fs.createWriteStream("test.log")

;(async () => {
  const mnemonic =
    'XXXXXXXXXXXXXXXX'

  const client = createClient(
    withLogsRecorder(
      (l) => f.write(`${l}\n`),
      getWsProvider('wss://westend-people-rpc.polkadot.io'),
    ),
  )
  const peopleApi = client.getTypedApi(westend2_people)

  const entropy = mnemonicToEntropy(mnemonic)
  const miniSecret = entropyToMiniSecret(entropy)
  const derive = sr25519CreateDerive(miniSecret)

  const alice = derive('//Alice')
  const bob = derive('//Bob')

  const ss58Prefix = peopleApi.constants.System.SS58Prefix(
    await peopleApi.compatibilityToken,
  )

  peopleApi.tx.Identity.set_username_for({
    who: { type: 'Id', value: ss58Address(bob.publicKey, ss58Prefix) },
    username: Binary.fromText('asdf19'),
    signature: {
      type: 'Sr25519',
      value: Binary.fromBytes(
        bob.sign(new TextEncoder().encode('asdf19.ryan123')),
      ),
    },
  })
    .signSubmitAndWatch(
      getPolkadotSigner(alice.publicKey, 'Sr25519', alice.sign),
    )
    .subscribe(console.log)
})()
