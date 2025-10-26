import { useState } from 'react';
import './LoginPage.css';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false); // toggle between login/signup

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let userCredential;
      if (isCreating) {
        // ✨ Sign-up
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        alert('Account created successfully! 🎉');
      } else {
        // 🔐 Login
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      const user = userCredential.user;
      console.log('✅ Auth success:', user.email);
      onLoginSuccess(user);
    } catch (error) {
      console.error('❌ Auth error:', error.code, error.message);
      alert(error.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>{isCreating ? 'Create Account' : 'Welcome Back'}</h1>
        <p>{isCreating ? 'Sign up to get started' : 'Sign in to continue'}</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="login-button">
            {isCreating ? 'Create Account' : 'Sign In'}
          </button>

          <div className="login-footer">
            <button
              type="button"
              className="switch-mode"
              onClick={() => setIsCreating(!isCreating)}
            >
              {isCreating ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
