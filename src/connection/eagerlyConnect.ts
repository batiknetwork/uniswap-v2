import { Connector } from '@web3-react/types'

import { getConnection, gnosisSafeConnection, networkConnection } from './index'
import { ConnectionType, selectedWalletKey, toConnectionType } from './types'

/**
 * This may be thrown (as a promise) by components to suspend rendering until a wallet connection is attempted.
 * @example
 *     if (connectionReady instanceof Promise) throw connectionReady
 */
export let connectionReady: Promise<void> | true

async function connect(connector: Connector, type: ConnectionType) {
  performance.mark(`web3:connect:${type}:start`)
  try {
    if (connector.connectEagerly) {
      await connector.connectEagerly()
    } else {
      await connector.activate()
    }
    return true
  } catch (error) {
    console.debug(`web3-react eager connection error: ${error}`)
    return false
  } finally {
    performance.measure(`web3:connect:${type}`, `web3:connect:${type}:start`)
  }
}

connect(gnosisSafeConnection.connector, ConnectionType.GNOSIS_SAFE)
connect(networkConnection.connector, ConnectionType.NETWORK)
const selectedWallet = toConnectionType(localStorage.getItem(selectedWalletKey) ?? undefined)
if (selectedWallet) {
  const selectedConnection = getConnection(selectedWallet)
  if (selectedConnection) {
    connectionReady = connect(selectedConnection.connector, selectedWallet)
      .then((connected) => {
        if (!connected) {
          // only clear the persisted wallet type if it failed to connect.
          localStorage.removeItem(selectedWalletKey)
        }
      })
      .finally(() => {
        connectionReady = true
      })
  }
}
