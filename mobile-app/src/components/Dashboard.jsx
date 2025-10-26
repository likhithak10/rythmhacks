import { useState } from 'react'
import Settings from './Settings'
import './Dashboard.css'

export default function Dashboard({ userType }) {
  const [locationSent, setLocationSent] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // User-specific handlers
  const handleEmergencyCall = () => {
    console.log('Calling EMS...')
    alert('Emergency call to EMS initiated!')
  }

  const handleCallCarePerson = () => {
    console.log('Calling care person...')
    alert('Calling your care person...')
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

  // Care-giver specific handlers
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

  // Render user dashboard
  const renderUserDashboard = () => (
    <>
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
    </>
  )

  // Render care-giver dashboard
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
