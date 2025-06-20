import { useState, useCallback } from 'react';
import { GitHubUser, GitHubRepository, ApiError } from '../types/github';

const GITHUB_API_BASE = 'https://api.github.com';

export const useGithubApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<Response>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall();
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError({ message: errorMessage });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUser = useCallback(async (username: string): Promise<GitHubUser | null> => {
    return handleApiCall<GitHubUser>(() => 
      fetch(`${GITHUB_API_BASE}/users/${username}`)
    );
  }, [handleApiCall]);

  const fetchUserRepositories = useCallback(async (
    username: string, 
    sort: 'created' | 'updated' | 'pushed' | 'full_name' = 'updated',
    perPage: number = 30
  ): Promise<GitHubRepository[] | null> => {
    return handleApiCall<GitHubRepository[]>(() => 
      fetch(`${GITHUB_API_BASE}/users/${username}/repos?sort=${sort}&per_page=${perPage}`)
    );
  }, [handleApiCall]);

  const searchUsers = useCallback(async (query: string): Promise<{ items: GitHubUser[] } | null> => {
    if (!query.trim()) return null;
    
    return handleApiCall<{ items: GitHubUser[] }>(() => 
      fetch(`${GITHUB_API_BASE}/search/users?q=${encodeURIComponent(query)}&per_page=10`)
    );
  }, [handleApiCall]);

  return {
    loading,
    error,
    fetchUser,
    fetchUserRepositories,
    searchUsers,
  };
};