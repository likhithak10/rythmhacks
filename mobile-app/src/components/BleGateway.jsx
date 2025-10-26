import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const FALL_SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0'
const FALL_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef2'
const PERIPHERAL_NAME = 'Nano33BLE-Fall'

export default function BleGateway() {
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('gateway.apiUrl') || 'http://localhost:3000/api/fall')
  const [status, setStatus] = useState('Idle')
  const [deviceName, setDeviceName] = useState('')
  const [logs, setLogs] = useState([])
  const [connected, setConnected] = useState(false)
  const deviceRef = useRef(null)
  const charRef = useRef(null)

  const log = useCallback((msg) => {
    setLogs((prev) => [msg, ...prev].slice(0, 200))
  }, [])

  useEffect(() => {
    localStorage.setItem('gateway.apiUrl', apiUrl)
  }, [apiUrl])

  const requestDevice = useCallback(async () => {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth not supported in this browser. Use Chrome/Edge on desktop.')
    }

    // Some adapters/OSes are picky with filters; try by service first, then accept-all with name.
    try {
      return await navigator.bluetooth.requestDevice({
        filters: [{ services: [FALL_SERVICE_UUID] }],
        optionalServices: [FALL_SERVICE_UUID],
      })
    } catch (e) {
      // If user didn’t pick or no devices matched, rethrow
      if (e?.name !== 'NotFoundError') throw e
      return await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [FALL_SERVICE_UUID],
      })
    }
  }, [])

  const connect = useCallback(async () => {
    try {
      setStatus('Requesting device…')
      const device = await requestDevice()
      if (!device) return
      setDeviceName(device.name || device.id || 'Unknown')
      deviceRef.current = device

      setStatus('Connecting…')
      const server = await device.gatt.connect()
      setStatus('Getting service…')
      const service = await server.getPrimaryService(FALL_SERVICE_UUID)
      setStatus('Getting characteristic…')
      const characteristic = await service.getCharacteristic(FALL_CHAR_UUID)
      charRef.current = characteristic

      const onNotify = (event) => {
        try {
          const value = event.target.value // DataView
          const bytes = new Uint8Array(value.buffer)
          const text = new TextDecoder('utf-8').decode(bytes)
          log(`BLE: ${text}`)
          forwardToApi(text)
            .then(() => log('Forwarded to API.'))
            .catch((err) => log(`POST error: ${err.message}`))
        } catch (err) {
          log(`Decode error: ${err.message}`)
        }
      }

      characteristic.addEventListener('characteristicvaluechanged', onNotify)
      await characteristic.startNotifications()

      // Clean up on disconnect
      const onDisconnected = () => {
        setConnected(false)
        setStatus('Disconnected')
        try {
          characteristic.removeEventListener('characteristicvaluechanged', onNotify)
        } catch {}
      }
      device.addEventListener('gattserverdisconnected', onDisconnected)

      setConnected(true)
      setStatus('Connected and subscribed')
      log(`Connected to ${device.name || device.id}`)
    } catch (e) {
      setStatus('Error')
      log(`Error: ${e.message}`)
    }
  }, [log, requestDevice])

  const disconnect = useCallback(async () => {
    try {
      const device = deviceRef.current
      const characteristic = charRef.current
      if (characteristic) {
        try {
          await characteristic.stopNotifications()
        } catch {}
      }
      if (device?.gatt?.connected) {
        await device.gatt.disconnect()
      }
    } finally {
      setConnected(false)
      setStatus('Disconnected')
    }
  }, [])

  const forwardToApi = useCallback(async (jsonText) => {
    const payload = JSON.parse(jsonText)
    const body = {
      ...payload,
      gateway: { platform: 'web-bluetooth', receivedAt: Date.now() },
    }
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  }, [apiUrl])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2>Web Bluetooth Gateway</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label htmlFor="api-url">API URL</label>
        <input
          id="api-url"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          style={{ width: 360 }}
          placeholder="https://your-next-app/api/fall"
        />
        <button onClick={connect} disabled={connected}>Connect</button>
        <button onClick={disconnect} disabled={!connected}>Disconnect</button>
      </div>
      <div>
        <strong>Status:</strong> {status} {deviceName ? `— ${deviceName}` : ''}
      </div>
      <div style={{ maxHeight: 320, overflow: 'auto', border: '1px solid #ccc', padding: 8 }}>
        {logs.map((l, i) => (
          <div key={i} style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{l}</div>
        ))}
      </div>
      <div style={{ color: '#666' }}>
        <p>
          Tip: Use Chrome/Edge on desktop. Serve over HTTPS or on <code>http://localhost</code>.
          Close nRF Connect while using this gateway (only one central can connect).
        </p>
      </div>
    </div>
  )
}


