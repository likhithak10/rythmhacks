import { useState } from 'react';
import './LoginPage.css';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false); // toggle between login/signup
  const [userType, setUserType] = useState('user'); // 'user' or 'care-giver'

  // Additional signup fields
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let userCredential;
      if (isCreating) {
        // ✨ Sign-up
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Save user data to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          'account-type': userType,
          name: name,
          birthday: birthday,
          'phone number': phoneNumber,
          createdAt: new Date().toISOString(),
        });

        // Save home address as a subcollection
        await setDoc(doc(db, 'users', userCredential.user.uid, 'home address', 'address'), {
          street: street,
          city: city,
          state: state,
          zipCode: zipCode,
        });

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

          {isCreating && (
            <>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="birthday">Birthday</label>
                <input
                  type="date"
                  id="birthday"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="(123) 456-7890"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="street">Street Address</label>
                <input
                  type="text"
                  id="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="123 Main St"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="CA"
                    maxLength="2"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="zipCode">Zip Code</label>
                  <input
                    type="text"
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="12345"
                    maxLength="5"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="userType">I am a:</label>
                <select
                  id="userType"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  required
                >
                  <option value="user">User</option>
                  <option value="care-giver">Care Giver</option>
                </select>
              </div>
            </>
          )}

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
