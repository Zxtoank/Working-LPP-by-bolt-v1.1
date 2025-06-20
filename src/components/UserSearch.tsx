import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, Loader2 } from 'lucide-react';
import { useGithubApi } from '../hooks/useGithubApi';
import { GitHubUser } from '../types/github';

interface UserSearchProps {
  onUserSelect: (username: string) => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GitHubUser[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { searchUsers, loading } = useGithubApi();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchForUsers = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const results = await searchUsers(query);
      if (results) {
        setSuggestions(results.items);
        setShowSuggestions(true);
      }
    };

    const timeoutId = setTimeout(searchForUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [query, searchUsers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onUserSelect(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (username: string) => {
    setQuery(username);
    onUserSelect(username);
    setShowSuggestions(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search GitHub users..."
            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200 bg-white shadow-lg"
          />
          {loading && (
            <Loader2 className="absolute right-4 h-5 w-5 text-gray-400 animate-spin" />
          )}
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="py-2">
            {suggestions.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSuggestionClick(user.login)}
                className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors duration-150 text-left"
              >
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="w-10 h-10 rounded-full border border-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {user.name || user.login}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    @{user.login}
                  </div>
                </div>
                <Users className="h-4 w-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};