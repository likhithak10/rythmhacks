import { useState } from 'react'
import './Settings.css'

export default function Settings({ isOpen, onClose, userType }) {
  const [locationSharing, setLocationSharing] = useState(true)
  const [autoShareLocation, setAutoShareLocation] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [emergencyAlerts, setEmergencyAlerts] = useState(true)

  if (!isOpen) return null

  const handleSaveLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('Saved location:', { latitude, longitude })
          alert('Location saved successfully!')
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
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3>📍 Location Settings</h3>

            <div className="setting-item">
              <div className="setting-info">
                <label>Enable Location Sharing</label>
                <p>Share your location with emergency contacts</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={locationSharing}
                  onChange={(e) => setLocationSharing(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Auto-Share in Emergency</label>
                <p>Automatically share location when emergency button is pressed</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={autoShareLocation}
                  onChange={(e) => setAutoShareLocation(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <button className="save-location-btn" onClick={handleSaveLocation}>
              Save Current Location
            </button>
          </div>

          <div className="settings-section">
            <h3>🔔 Notifications</h3>

            <div className="setting-item">
              <div className="setting-info">
                <label>Push Notifications</label>
                <p>Receive app notifications</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Emergency Alerts</label>
                <p>Get notified of emergency situations</p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={emergencyAlerts}
                  onChange={(e) => setEmergencyAlerts(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-section">
            <h3>👤 Account</h3>

            <div className="setting-item clickable">
              <div className="setting-info">
                <label>User Type</label>
                <p>{userType === 'user' ? '👤 User' : '❤️ Care Member'}</p>
              </div>
              <span className="arrow">›</span>
            </div>

            <div className="setting-item clickable">
              <div className="setting-info">
                <label>Emergency Contacts</label>
                <p>Manage your emergency contacts</p>
              </div>
              <span className="arrow">›</span>
            </div>

            <div className="setting-item clickable">
              <div className="setting-info">
                <label>Privacy & Security</label>
                <p>Manage your privacy settings</p>
              </div>
              <span className="arrow">›</span>
            </div>
          </div>

          <button className="logout-btn" onClick={onClose}>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
