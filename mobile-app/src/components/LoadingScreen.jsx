import { useEffect } from 'react'
import './LoadingScreen.css'

export default function LoadingScreen({ onLoadComplete }) {
  useEffect(() => {
    // Simulate loading time, then transition to login
    const timer = setTimeout(() => {
      onLoadComplete()
    }, 2500) // 2.5 seconds

    return () => clearTimeout(timer)
  }, [onLoadComplete])

  return (
    <div className="loading-screen">
      <div className="loading-content">
        <img
          src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=400&fit=crop"
          alt="Loading"
          className="loading-image"
        />
        <h1 className="loading-title">Welcome</h1>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    </div>
  )
}
