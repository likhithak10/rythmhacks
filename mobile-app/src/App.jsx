import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

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

  const handleLoginSuccess = async (credentials) => {
    setUserCredentials(credentials);

    // Fetch user type from Firestore
    try {
      const userDoc = await getDoc(doc(db, 'users', credentials.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserType(userData['account-type']);
        setCurrentScreen('dashboard');
      } else {
        // If no user document exists (old users), show type selection
        setCurrentScreen('userTypeSelection');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setCurrentScreen('userTypeSelection');
    }
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setCurrentScreen('dashboard');
  };

  useEffect(() => {
    // Show loading animation first for ~2 seconds
    const loadingTimer = setTimeout(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setUserCredentials(user);

          // Fetch user type from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserType(userData['account-type']);
              setCurrentScreen('dashboard');
            } else {
              // If no user document exists (old users), show type selection
              setCurrentScreen('userTypeSelection');
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            setCurrentScreen('userTypeSelection');
          }
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
