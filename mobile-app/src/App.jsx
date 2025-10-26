import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import PhoneFrame from './components/PhoneFrame';
import LoadingScreen from './components/LoadingScreen';
import LoginPage from './components/LoginPage';
import UserTypeSelection from './components/UserTypeSelection';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [userCredentials, setUserCredentials] = useState(null);
  const [userType, setUserType] = useState(null);

  const handleLoadComplete = () => {
    setCurrentScreen('login');
  };

  const handleLoginSuccess = (credentials) => {
    setUserCredentials(credentials);
    setCurrentScreen('userTypeSelection');
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setCurrentScreen('dashboard');
  };

  useEffect(() => {
    // Show loading animation first for ~2 seconds
    const loadingTimer = setTimeout(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserCredentials(user);
          setCurrentScreen('dashboard');
        } else {
          setCurrentScreen('login');
        }
      });
      return () => unsubscribe();
    }, 2000); // <-- adjust delay (ms) for how long the animation lasts

    return () => clearTimeout(loadingTimer);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'loading':
        return <LoadingScreen onLoadComplete={handleLoadComplete} />;
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'userTypeSelection':
        return <UserTypeSelection onSelectType={handleUserTypeSelect} />;
      case 'dashboard':
        return <Dashboard userType={userType} />;
      default:
        return <LoadingScreen onLoadComplete={handleLoadComplete} />;
    }
  };

  return <PhoneFrame>{renderScreen()}</PhoneFrame>;
}

export default App;
