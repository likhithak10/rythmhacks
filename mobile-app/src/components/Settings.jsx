import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import './Settings.css'

export default function Settings({ isOpen, onClose, userType }) {
  const [locationSharing, setLocationSharing] = useState(true)
  const [autoShareLocation, setAutoShareLocation] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [emergencyAlerts, setEmergencyAlerts] = useState(true)

  // User profile data
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Edit mode
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phoneNumber: '',
    birthday: '',
    street: '',
    city: '',
    state: '',
    zipCode: ''
  })

  useEffect(() => {
    if (isOpen && auth.currentUser) {
      fetchUserData()
    }
  }, [isOpen])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))

      if (userDoc.exists()) {
        const data = userDoc.data()
        setUserData(data)

        // Fetch home address from subcollection
        const addressDoc = await getDoc(doc(db, 'users', auth.currentUser.uid, 'home address', 'address'))
        if (addressDoc.exists()) {
          const addressData = addressDoc.data()
          setUserData(prev => ({ ...prev, address: addressData }))

          // Populate edit form
          setEditForm({
            name: data.name || '',
            phoneNumber: data['phone number'] || '',
            birthday: data.birthday || '',
            street: addressData.street || '',
            city: addressData.city || '',
            state: addressData.state || '',
            zipCode: addressData.zipCode || ''
          })
        } else {
          // Populate edit form without address
          setEditForm({
            name: data.name || '',
            phoneNumber: data['phone number'] || '',
            birthday: data.birthday || '',
            street: '',
            city: '',
            state: '',
            zipCode: ''
          })
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleLogout = async () => {
    try {
      await signOut(auth)
      console.log('User logged out successfully')
      onClose()
    } catch (error) {
      console.error('Error logging out:', error)
      alert('Failed to log out. Please try again.')
    }
  }

  const handleEditProfile = () => {
    setIsEditMode(true)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    // Reset form to original data
    if (userData) {
      setEditForm({
        name: userData.name || '',
        phoneNumber: userData['phone number'] || '',
        birthday: userData.birthday || '',
        street: userData.address?.street || '',
        city: userData.address?.city || '',
        state: userData.address?.state || '',
        zipCode: userData.address?.zipCode || ''
      })
    }
  }

  const handleSaveProfile = async () => {
    try {
      // Update main user document
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        ...userData,
        name: editForm.name,
        'phone number': editForm.phoneNumber,
        birthday: editForm.birthday,
      }, { merge: true })

      // Update home address subcollection
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'home address', 'address'), {
        street: editForm.street,
        city: editForm.city,
        state: editForm.state,
        zipCode: editForm.zipCode,
      })

      alert('Profile updated successfully!')
      setIsEditMode(false)
      fetchUserData() // Refresh data
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    }
  }

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  // Render user settings
  const renderUserSettings = () => (
    <>
      <div className="settings-section">
        <div className="section-header">
          <h3>👤 Profile</h3>
          {!isEditMode && !loading && userData && (
            <button className="edit-btn" onClick={handleEditProfile}>Edit</button>
          )}
        </div>

        {loading ? (
          <p>Loading profile...</p>
        ) : userData ? (
          <>
            {isEditMode ? (
              // Edit mode
              <>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Name</label>
                    <input
                      type="text"
                      className="edit-input"
                      value={editForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Email</label>
                    <p className="readonly">{userData.email || 'Not set'}</p>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      className="edit-input"
                      value={editForm.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    />
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Birthday</label>
                    <input
                      type="date"
                      className="edit-input"
                      value={editForm.birthday}
                      onChange={(e) => handleInputChange('birthday', e.target.value)}
                    />
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Street Address</label>
                    <input
                      type="text"
                      className="edit-input"
                      value={editForm.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                    />
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>City</label>
                    <input
                      type="text"
                      className="edit-input"
                      value={editForm.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                </div>

                <div className="edit-address-row">
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>State</label>
                      <input
                        type="text"
                        className="edit-input"
                        value={editForm.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        maxLength="2"
                      />
                    </div>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Zip Code</label>
                      <input
                        type="text"
                        className="edit-input"
                        value={editForm.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        maxLength="5"
                      />
                    </div>
                  </div>
                </div>

                <div className="edit-buttons">
                  <button className="save-btn" onClick={handleSaveProfile}>Save Changes</button>
                  <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                </div>
              </>
            ) : (
              // View mode
              <>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Name</label>
                    <p>{userData.name || 'Not set'}</p>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Email</label>
                    <p>{userData.email || 'Not set'}</p>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Phone Number</label>
                    <p>{userData['phone number'] || 'Not set'}</p>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Birthday</label>
                    <p>{userData.birthday || 'Not set'}</p>
                  </div>
                </div>

                {userData.address && (
                  <div className="setting-item">
                    <div className="setting-info">
                      <label>Home Address</label>
                      <p>
                        {userData.address.street}<br />
                        {userData.address.city}, {userData.address.state} {userData.address.zipCode}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <p>Unable to load profile data</p>
        )}
      </div>

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
        <h3>👤 Account</h3>

        <div className="setting-item clickable">
          <div className="setting-info">
            <label>User Type</label>
            <p>👤 User</p>
          </div>
          <span className="arrow">›</span>
        </div>

        <div className="setting-item clickable">
          <div className="setting-info">
            <label>Emergency Contacts</label>
            <p>Manage your care person</p>
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
    </>
  )

  // Render care-giver settings
  const renderCareGiverSettings = () => (
    <>
      <div className="settings-section">
        <div className="section-header">
          <h3>👤 Profile</h3>
          {!isEditMode && !loading && userData && (
            <button className="edit-btn" onClick={handleEditProfile}>Edit</button>
          )}
        </div>

        {loading ? (
          <p>Loading profile...</p>
        ) : userData ? (
          <>
            {isEditMode ? (
              // Edit mode
              <>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Name</label>
                    <input
                      type="text"
                      className="edit-input"
                      value={editForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Email</label>
                    <p className="readonly">{userData.email || 'Not set'}</p>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      className="edit-input"
                      value={editForm.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    />
                  </div>
                </div>

                <div className="edit-buttons">
                  <button className="save-btn" onClick={handleSaveProfile}>Save Changes</button>
                  <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                </div>
              </>
            ) : (
              // View mode
              <>
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Name</label>
                    <p>{userData.name || 'Not set'}</p>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Email</label>
                    <p>{userData.email || 'Not set'}</p>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Phone Number</label>
                    <p>{userData['phone number'] || 'Not set'}</p>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <p>Unable to load profile data</p>
        )}
      </div>

      <div className="settings-section">
        <h3>🔔 Alert Settings</h3>

        <div className="setting-item">
          <div className="setting-info">
            <label>Emergency Alerts</label>
            <p>Get notified when care recipients send emergencies</p>
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

        <div className="setting-item">
          <div className="setting-info">
            <label>Location Updates</label>
            <p>Receive location updates from care recipients</p>
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
            <label>Sound Alerts</label>
            <p>Play sound for critical emergencies</p>
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
      </div>

      <div className="settings-section">
        <h3>👥 Care Recipients</h3>

        <div className="setting-item clickable">
          <div className="setting-info">
            <label>Manage Recipients</label>
            <p>Add or remove people you care for</p>
          </div>
          <span className="arrow">›</span>
        </div>

        <div className="setting-item clickable">
          <div className="setting-info">
            <label>Location Permissions</label>
            <p>Control location tracking settings</p>
          </div>
          <span className="arrow">›</span>
        </div>
      </div>

      <div className="settings-section">
        <h3>👤 Account</h3>

        <div className="setting-item clickable">
          <div className="setting-info">
            <label>User Type</label>
            <p>❤️ Care Giver</p>
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
    </>
  )

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          {userType === 'user' ? renderUserSettings() : renderCareGiverSettings()}

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
