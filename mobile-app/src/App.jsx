import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header className="header">
        <h1>Mobile App</h1>
      </header>

      <main className="main">
        <div className="card">
          <h2>Welcome to your mobile app</h2>
          <p>Built with React + Vite</p>

          <div className="counter">
            <button onClick={() => setCount((count) => count - 1)}>-</button>
            <span className="count">{count}</span>
            <button onClick={() => setCount((count) => count + 1)}>+</button>
          </div>

          <p className="hint">
            Edit <code>src/App.jsx</code> to get started
          </p>
        </div>
      </main>

      <footer className="footer">
        <p>React + Vite Mobile Template</p>
      </footer>
    </div>
  )
}

export default App
