import { useEffect, useRef, useState } from 'react'
import Settings from './Settings'
import './Dashboard.css'

export default function Dashboard({ userType = 'user', fallDetected = false }) {
  const [locationSent, setLocationSent] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const fallPrev = useRef(false)
  const [emergencyContact, setEmergencyContact] = useState(() => localStorage.getItem('emergency.contact') || '')

  const handleEmergencyCall = async () => {
    console.log('Calling EMS...')
    alert('Emergency call to EMS initiated!')
    const to = emergencyContact || prompt('Enter emergency contact phone number (E.164, e.g. +15551234567):')
    if (to) {
      localStorage.setItem('emergency.contact', to)
      setEmergencyContact(to)
      try {
        const res = await fetch('http://localhost:5000/call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to }),
        })
        if (!res.ok) throw new Error(await res.text())
      } catch (e) {
        console.error('Call failed:', e)
        alert('Failed to place emergency call. Please verify the Twilio server is running.')
      }
    }
  }

  const handleCallCarePerson = async () => {
    console.log('Calling care person...')
    const to = '+14167686446'
    try {
      const res = await fetch('http://localhost:5000/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message: 'This is a quick call from your care recipient.' }),
      })
      if (!res.ok) throw new Error(await res.text())
      alert('Calling your care person...')
    } catch (e) {
      console.error('Care call failed:', e)
      alert('Failed to call care person. Ensure the Twilio server is running.')
    }
  }

  const handleSendLocation = () => {
    console.log('Sending location to emergency contact...')

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('Location:', { latitude, longitude })
          setLocationSent(true)
          const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
          const to = emergencyContact
          if (!to) {
            alert('Please set the Emergency Contact number to send SMS location.')
          } else {
            fetch('http://localhost:5000/sms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to, body: `Shared location: ${mapsUrl}` }),
            }).catch((e) => console.error('SMS failed:', e))
          }
          alert(`Location sent!\nLat: ${latitude.toFixed(6)}\nLong: ${longitude.toFixed(6)}`)

          setTimeout(() => setLocationSent(false), 3000)
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Unable to get location. Please enable location services.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser.')
    }
  }

  const handleViewLocations = () => {
    console.log('Viewing care recipient locations...')
    alert('Opening location map for your care recipients...')
  }

  const handleViewAlerts = () => {
    console.log('Viewing emergency alerts...')
    alert('Viewing recent emergency alerts from care recipients...')
  }

  const handleViewHistory = () => {
    console.log('Viewing emergency history...')
    alert('Opening emergency history and logs...')
  }

  const handleManageRecipients = () => {
    console.log('Managing care recipients...')
    alert('Manage your care recipients list...')
  }

  useEffect(() => {
    if (!fallPrev.current && fallDetected) {
      handleEmergencyCall()
    }
    fallPrev.current = fallDetected
  }, [fallDetected])

  const renderUserDashboard = () => (
    <>
      <div className="emergency-grid">
        <button
          className="emergency-btn ems-btn"
          onClick={handleEmergencyCall}
          aria-live="polite"
        >
          <div className="btn-icon">🚨</div>
          <h2>{fallDetected ? 'EMERGENCY' : 'Emergency'}</h2>
          <p>{fallDetected ? 'Calling…' : 'Call EMS'}</p>
        </button>

        <button
          className="emergency-btn care-btn"
          onClick={handleCallCarePerson}
        >
          <div className="btn-icon">📞</div>
          <h2>Care Person</h2>
          <p>Quick Call</p>
        </button>

        <button
          className={`emergency-btn location-btn ${locationSent ? 'sent' : ''}`}
          onClick={handleSendLocation}
        >
          <div className="btn-icon">📍</div>
          <h2>Share Location</h2>
          <p>{locationSent ? 'Sent!' : 'Send to Contact'}</p>
        </button>
      </div>

      <div className="dashboard-info">
        <div className="info-card">
          <h3>Quick Actions</h3>
          <ul>
            <li>🚨 Emergency button connects to 911</li>
            <li>📞 Call your designated care person</li>
            <li>📍 Share your current location instantly</li>
          </ul>
          <div style={{ marginTop: 12, textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Emergency Contact</label>
            <input
              type="tel"
              value={emergencyContact}
              onChange={(e) => { setEmergencyContact(e.target.value); localStorage.setItem('emergency.contact', e.target.value) }}
              placeholder="+15551234567"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #ddd' }}
            />
            <p style={{ color: '#666', marginTop: 6 }}>Used when Emergency is triggered.</p>
          </div>
        </div>
      </div>
    </>
  )

  const renderCareGiverDashboard = () => (
    <>
      <div className="emergency-grid">
        <button
          className="emergency-btn location-btn"
          onClick={handleViewLocations}
        >
          <div className="btn-icon">🗺️</div>
          <h2>View Locations</h2>
          <p>Track Care Recipients</p>
        </button>

        <button
          className="emergency-btn ems-btn"
          onClick={handleViewAlerts}
        >
          <div className="btn-icon">🔔</div>
          <h2>Emergency Alerts</h2>
          <p>Recent Notifications</p>
        </button>

        <button
          className="emergency-btn care-btn"
          onClick={handleViewHistory}
        >
          <div className="btn-icon">📋</div>
          <h2>History</h2>
          <p>Emergency Logs</p>
        </button>

        <button
          className="emergency-btn location-btn"
          onClick={handleManageRecipients}
        >
          <div className="btn-icon">👥</div>
          <h2>Manage Recipients</h2>
          <p>Care List</p>
        </button>
      </div>

      <div className="dashboard-info">
        <div className="info-card">
          <h3>Care Giver Features</h3>
          <ul>
            <li>🗺️ View real-time locations of care recipients</li>
            <li>🔔 Receive instant emergency alerts</li>
            <li>📋 Access emergency history and logs</li>
            <li>👥 Manage your care recipients list</li>
          </ul>
        </div>
      </div>
    </>
  )

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
          ⚙️
        </button>
        <div className="header-content">
          <h1>{userType === 'user' ? 'Emergency Dashboard' : 'Care Giver Dashboard'}</h1>
          <p className="user-type-badge">
            {userType === 'user' ? '👤 User' : '❤️ Care Giver'}
          </p>
        </div>
        <div className="header-spacer"></div>
      </div>

      <div className="dashboard-content">
        {userType === 'user' ? renderUserDashboard() : renderCareGiverDashboard()}
      </div>

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userType={userType}
      />
    </div>
  )
}


