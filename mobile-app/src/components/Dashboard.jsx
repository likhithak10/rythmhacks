import { useState } from 'react'
import Settings from './Settings'
import './Dashboard.css'

export default function Dashboard({ userType }) {
  const [locationSent, setLocationSent] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleEmergencyCall = () => {
    console.log('Calling EMS...')
    // In a real app, this would trigger emergency services
    alert('Emergency call to EMS initiated!')
    // On mobile, you could use: window.location.href = 'tel:911'
  }

  const handleCallCarePerson = () => {
    console.log('Calling care person...')
    // In a real app, this would call the designated care person
    alert('Calling your care person...')
    // On mobile, you could use: window.location.href = 'tel:+1234567890'
  }

  const handleSendLocation = () => {
    console.log('Sending location to emergency contact...')

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('Location:', { latitude, longitude })
          setLocationSent(true)
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

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <button className="settings-btn" onClick={() => setSettingsOpen(true)}>
          ⚙️
        </button>
        <div className="header-content">
          <h1>Emergency Dashboard</h1>
          <p className="user-type-badge">
            {userType === 'user' ? '👤 User' : '❤️ Care Member'}
          </p>
        </div>
        <div className="header-spacer"></div>
      </div>

      <div className="dashboard-content">
        <div className="emergency-grid">
          <button
            className="emergency-btn ems-btn"
            onClick={handleEmergencyCall}
          >
            <div className="btn-icon">🚨</div>
            <h2>Emergency</h2>
            <p>Call EMS</p>
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
          </div>
        </div>
      </div>

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userType={userType}
      />
    </div>
  )
}
