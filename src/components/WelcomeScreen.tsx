import React from 'react';
import { LogOut, User, Calendar, Grid } from 'lucide-react';
import { User as UserType, AuthMode } from '../types';
import { useCookies } from 'react-cookie';
import { Database } from '../services/database';
import { PasswordReveal } from './PasswordReveal.tsx';

interface WelcomeScreenProps {
  user: UserType;
  onModeChange: (mode: AuthMode) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user, onModeChange }) => {
  const [cookies, setCookie, removeCookie] = useCookies(["user"]);
  const [showReveal, setShowReveal] = React.useState(false);

  const handleLogout = () => {  
    // Removing the Cookies
    removeCookie("user", { path: "/" });
    // Deleting Database Entry
    Database.deleteUserSession(user.id);
    onModeChange('login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const countFilledGridCells = () => {
    const passwordCells = Array.isArray(user.grid_password)
      ? (user.grid_password as string[][]).flat().filter(cell => cell !== '').length
      : 0;

    const patternCells = Array.isArray(user.grid_pattern)
      ? (user.grid_pattern as string[][]).flat().filter(cell => cell !== 'white').length
      : 0;

    return { password: passwordCells, pattern: patternCells };
  };

  const gridStats = countFilledGridCells();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome back, {user.full_name}! 🎉
            </h1>
            <p className="text-gray-600 text-lg">
              You've successfully logged in with your unique grid authentication system.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReveal(true)}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium transition-all"
              title="Show stored grids (verification required)"
            >
              <Grid size={16} />
              Show Password
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-all"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500 rounded-full p-2">
                <User className="text-white" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Account Details</h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Full Name:</span>
                <p className="text-gray-800 font-medium">{user.full_name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Username:</span>
                <p className="text-gray-800 font-medium">{user.username}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Email:</span>
                <p className="text-gray-800 font-medium">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-500 rounded-full p-2">
                <Grid className="text-white" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Security Stats</h3>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Grid Password Cells:</span>
                <p className="text-gray-800 font-medium">
                  {gridStats.password} of {(user.password_grid_size || (user.grid_password?.length || 3)) ** 2} filled
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Color Pattern Cells:</span>
                <p className="text-gray-800 font-medium">
                  {gridStats.pattern} of {(user.pattern_grid_size || (user.grid_pattern?.length || 3)) ** 2} colored
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Secure Authentication Active</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-500 rounded-full p-2">
                <Calendar className="text-white" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Account Information</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Account Created:</span>
                <p className="text-gray-800 font-medium">{formatDate(user.created_at)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">User ID:</span>
                <p className="text-gray-800 font-mono text-sm">{user.id}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">🔐 Security Notice</h4>
          <p className="text-blue-700 text-sm">
            Your account is protected by our advanced grid-based authentication system. 
            Never share your grid password or color pattern with anyone. If you suspect 
            unauthorized access, please contact support immediately.
          </p>
        </div>
      </div>

      {showReveal && (
        <PasswordReveal
          user={user}
          onClose={() => setShowReveal(false)}
        />
      )}
    </div>
  );
};