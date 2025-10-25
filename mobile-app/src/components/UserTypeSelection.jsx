import './UserTypeSelection.css'

export default function UserTypeSelection({ onSelectType }) {
  return (
    <div className="user-type-selection">
      <div className="selection-container">
        <div className="selection-header">
          <h1>Welcome!</h1>
          <p>Please select your role to continue</p>
        </div>

        <div className="selection-options">
          <button
            className="type-option user-option"
            onClick={() => onSelectType('user')}
          >
            <div className="option-icon">👤</div>
            <h2>I'm a User</h2>
            <p>Access your personal care and wellness journey</p>
          </button>

          <button
            className="type-option care-option"
            onClick={() => onSelectType('care-member')}
          >
            <div className="option-icon">❤️</div>
            <h2>I'm a Care Member</h2>
            <p>Support and monitor your loved one's care</p>
          </button>
        </div>
      </div>
    </div>
  )
}
