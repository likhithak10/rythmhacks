import { useMemo, useRef, useState } from 'react'
import PhoneFrame from './components/PhoneFrame'
import LoadingScreen from './components/LoadingScreen'
import LoginPage from './components/LoginPage'
import UserTypeSelection from './components/UserTypeSelection'
import BleGateway from './components/BleGateway'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState('loading')
  const [userCredentials, setUserCredentials] = useState(null)
  const [userType, setUserType] = useState(null)
  const [fallDetected, setFallDetected] = useState(false)
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('gateway.apiUrl') || 'http://localhost:3000/api/fall')
  const [deviceSelection, setDeviceSelection] = useState(() => localStorage.getItem('gateway.device') || 'arduino-nano33ble')
  const fallTimerRef = useRef(null)
  const [lastProximityTs, setLastProximityTs] = useState(0)

  const handleLoadComplete = () => {
    setCurrentScreen('login')
  }

  const handleLoginSuccess = (credentials) => {
    setUserCredentials(credentials)
    setCurrentScreen('deviceConfig')
  }

  const handleUserTypeSelect = (type) => {
    setUserType(type)
    console.log('User logged in as:', type, 'with credentials:', userCredentials)
    setCurrentScreen('dashboard')
  }

  const isGateway = useMemo(() => new URLSearchParams(window.location.search).get('gateway') === '1', [])

  const handleFallFromGateway = (payload) => {
    console.log('Fall detected:', payload)
    setFallDetected(true)
    clearTimeout(fallTimerRef.current)
    fallTimerRef.current = setTimeout(() => setFallDetected(false), 10000)
  }

  const handleProximityFromGateway = (payload) => {
    const now = Date.now()
    if (now - lastProximityTs < 5000) return
    setLastProximityTs(now)
    try {
      const utt = new SpeechSynthesisUtterance('Suhani is here')
      utt.rate = 1
      window.speechSynthesis?.speak(utt)
    } catch (e) {
      console.log('Speech synthesis not available')
    }
  }

  const renderScreen = () => {
    if (isGateway) return (
      <div style={{ padding: 12 }}>
        <BleGateway
          onFall={handleFallFromGateway}
          onProximity={handleProximityFromGateway}
          initialApiUrl={apiUrl}
          onApiUrlChange={(v) => { setApiUrl(v); localStorage.setItem('gateway.apiUrl', v) }}
          deviceSelection={deviceSelection}
          onDeviceSelectionChange={(v) => { setDeviceSelection(v); localStorage.setItem('gateway.device', v) }}
        />
      </div>
    )
    switch (currentScreen) {
      case 'loading':
        return <LoadingScreen onLoadComplete={handleLoadComplete} />
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} />
      case 'deviceConfig':
        return (
          <div className="main" style={{ gap: 16 }}>
            <div className="card">
              <h2>Connect Device</h2>
              <p>Enter your API URL and select the device, then connect.</p>
              <div style={{ marginTop: 12 }}>
                <BleGateway
                  compact
                  onFall={handleFallFromGateway}
                  onProximity={handleProximityFromGateway}
                  initialApiUrl={apiUrl}
                  onApiUrlChange={(v) => { setApiUrl(v); localStorage.setItem('gateway.apiUrl', v) }}
                  deviceSelection={deviceSelection}
                  onDeviceSelectionChange={(v) => { setDeviceSelection(v); localStorage.setItem('gateway.device', v) }}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <button onClick={() => setCurrentScreen('userTypeSelection')}>Continue</button>
              </div>
            </div>
          </div>
        )
      case 'userTypeSelection':
        return <UserTypeSelection onSelectType={handleUserTypeSelect} />
      case 'dashboard':
        return <Dashboard userType={userType || 'user'} fallDetected={fallDetected} />
      default:
        return <LoadingScreen onLoadComplete={handleLoadComplete} />
    }
  }

  return (
    <PhoneFrame>
      {renderScreen()}
    </PhoneFrame>
  )
}

export default App
