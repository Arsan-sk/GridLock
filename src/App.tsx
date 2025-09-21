import React, { useState, useEffect } from 'react';
import { Shield, Grid3X3 } from 'lucide-react';
import { AuthMode, User, RegistrationData } from './types';
import { RegistrationFlow } from './components/RegistrationFlow';
import { LoginFlow } from './components/LoginFlow';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Database } from './services/database';

function App() {
  const [redirectUri, setRedirectUri] = useState<string | null>(null);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const uri = params.get("redirect-uri");
  setRedirectUri(uri);
  console.log("Redirect URI from URL:", uri);
}, []);

  const [currentMode, setCurrentMode] = useState<AuthMode>('login');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const allUsers = await Database.getUsers();
        setUsers(allUsers);
        await Database.initializeDemoData();
      } catch (err) {
        console.error('Failed to initialize app:', err);
        setError('Failed to initialize application');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleRegistrationComplete = async (data: RegistrationData) => {
    try {
      setError('');
      const newUser = await Database.createUser(data);
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      setCurrentMode('welcome');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const handleLoginComplete = (user: User) => {
    setCurrentUser(user);
    setCurrentMode('welcome');
    if (!redirectUri) {
      return;
    }
    const token = btoa(JSON.stringify(user)); // ⚠️ demo only
    window.location.href = `${redirectUri}?token=${encodeURIComponent(token)}`;
    
  };

  const handleModeChange = (mode: AuthMode) => {
    setCurrentMode(mode);
    setError('');
    if (mode !== 'welcome') {
      setCurrentUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing Grid Auth System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-3">
              <Grid3X3 className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              GridAuth System
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Experience next-generation security with our innovative grid-based authentication. 
            Create unique password grids and color patterns for ultimate protection.
          </p>
          
          {users.length > 0 && currentMode !== 'welcome' && (
            <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200 max-w-md mx-auto">
              <div className="flex items-center gap-2 justify-center">
                <Shield size={16} className="text-blue-600" />
                <span className="text-blue-800 text-sm font-medium">
                  Demo user available: john123 / john@example.com
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-medium">Error: {error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {currentMode === 'register' && (
          <RegistrationFlow
            onComplete={handleRegistrationComplete}
            onModeChange={handleModeChange}
          />
        )}

        {currentMode === 'login' && (
          <LoginFlow
            users={users}
            onComplete={handleLoginComplete}
            onModeChange={handleModeChange}
          />
        )}

        {currentMode === 'welcome' && currentUser && (
          <WelcomeScreen
            user={currentUser}
            onModeChange={handleModeChange}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Powered by React + TypeScript • Secure Grid Authentication System</p>
        <p className="mt-1">
          Users registered: {users.length} • 
          Current mode: <span className="font-medium capitalize">{currentMode}</span>
        </p>
      </footer>
    </div>
  );
}

export default App;