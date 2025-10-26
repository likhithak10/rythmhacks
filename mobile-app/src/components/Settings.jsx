export default function Settings({ isOpen, onClose, userType = 'user' }) {
  if (!isOpen) return null

  return (
    <div className="settings-overlay" onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 1000
    }}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', width: '100%', maxHeight: '85%', borderRadius: '20px 20px 0 0', overflowY: 'auto'
      }}>
        <div className="settings-header" style={{
          position: 'sticky', top: 0, background: '#fff', padding: '1rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ margin: 0 }}>Settings</h2>
          <button className="close-btn" onClick={onClose} style={{
            background: 'rgba(0,0,0,0.05)', border: 'none', width: 36, height: 36, borderRadius: '50%'
          }}>✕</button>
        </div>
        <div className="settings-content" style={{ padding: '1rem 1.5rem 2rem' }}>
          <div style={{ marginBottom: 16 }}>
            <strong>Account type:</strong> {userType === 'user' ? '👤 User' : '❤️ Care Giver'}
          </div>
          <p style={{ color: '#666' }}>Device and API are configured during setup. Profile and advanced settings can be added here later.</p>
        </div>
      </div>
    </div>
  )
}


