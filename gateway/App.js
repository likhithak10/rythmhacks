import React, { useEffect, useState } from 'react';
import { Button, FlatList, PermissionsAndroid, Platform, SafeAreaView, Text, View } from 'react-native';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer';

global.Buffer = global.Buffer || Buffer;

const FALL_SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
const FALL_CHAR_UUID = '12345678-1234-5678-1234-56789abcdef2';
const API_URL = 'http://YOUR_NEXTJS_HOST/api/fall';

const manager = new BleManager();

export default function App() {
  const [logs, setLogs] = useState([]);
  const [device, setDevice] = useState(null);
  const [notifSub, setNotifSub] = useState(null);

  const log = (m) => setLogs((prev) => [m, ...prev].slice(0, 300));

  useEffect(() => {
    return () => {
      try { notifSub?.remove(); } catch {}
      try { device?.cancelConnection(); } catch {}
      manager.destroy();
    };
  }, [device, notifSub]);

  const ensureAndroidPerms = async () => {
    if (Platform.OS !== 'android') return;
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
  };

  const startScanAndConnect = async () => {
    await ensureAndroidPerms();
    log('Scanning for Nano33BLE-Fall...');
    manager.startDeviceScan([FALL_SERVICE_UUID], null, async (err, dev) => {
      if (err) {
        log(`Scan error: ${err.message}`);
        manager.stopDeviceScan();
        return;
      }
      if (!dev) return;
      if (dev.name === 'Nano33BLE-Fall') {
        log(`Found ${dev.name} (${dev.id}), connecting...`);
        manager.stopDeviceScan();
        try {
          const d = await dev.connect();
          setDevice(d);
          await d.discoverAllServicesAndCharacteristics();
          log('Connected and discovered, subscribing to notifications...');
          const sub = d.monitorCharacteristicForService(
            FALL_SERVICE_UUID,
            FALL_CHAR_UUID,
            (error, characteristic) => {
              if (error) {
                log(`Notify error: ${error.message}`);
                return;
              }
              const base64 = characteristic?.value;
              if (!base64) return;
              try {
                const text = Buffer.from(base64, 'base64').toString('utf8');
                log(`BLE: ${text}`);
                forwardToApi(text).catch(e => log(`POST error: ${e.message}`));
              } catch (e) {
                log(`Decode error: ${e.message}`);
              }
            }
          );
          setNotifSub(sub);
          log('Subscribed.');
        } catch (e) {
          log(`Connect error: ${e.message}`);
        }
      }
    });
  };

  const forwardToApi = async (jsonText) => {
    const payload = JSON.parse(jsonText);
    const body = {
      ...payload,
      gateway: { platform: Platform.OS, receivedAt: Date.now() },
    };
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button title="Scan & Connect" onPress={startScanAndConnect} />
      </View>
      <FlatList
        data={logs}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => <Text style={{ fontFamily: 'monospace' }}>{item}</Text>}
      />
    </SafeAreaView>
  );
}


