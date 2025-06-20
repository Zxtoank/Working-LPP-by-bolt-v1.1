import React from 'react';
import { Heart, User, LogOut, Settings } from 'lucide-react';

interface HeaderProps {
  user: { email: string; isPremium: boolean } | null;
  onLogin: () => void;
  onLogout: () => void;
  onProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogin, onLogout, onProfile }) => {
  const hasSubscription = user && localStorage.getItem(`subscription-${user.email}`);

  return (
    <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white shadow-2xl">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <Heart className="h-8 w-8 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Locket Photo Print</h1>
              <p className="text-blue-100 text-sm font-medium">Custom Photo Prints for Your Lockets</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{user.email}</span>
                  {(user.isPremium || hasSubscription) && (
                    <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                      PREMIUM
                    </span>
                  )}
                </div>
                <button
                  onClick={onProfile}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all duration-200 backdrop-blur-sm"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-all duration-200 backdrop-blur-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Login / Sign Up
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};