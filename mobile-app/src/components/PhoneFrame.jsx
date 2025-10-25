import './PhoneFrame.css'

export default function PhoneFrame({ children }) {
  return (
    <div className="phone-frame-wrapper">
      <div className="phone-frame">
        <div className="phone-notch"></div>
        <div className="phone-screen">
          {children}
        </div>
        <div className="phone-home-indicator"></div>
      </div>
    </div>
  )
}
