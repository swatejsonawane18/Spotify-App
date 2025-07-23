import React from "react";
import { supabase } from "../utils/supabase";
import { useRouter } from "expo-router";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import LoadingScreen from "../components/LoadingScreen";

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at?: string;
}

interface Like {
  id: string;
  user_id: string;
  video_id: string;
  video_user_id: string;
  created_at: string;
}

interface Follower {
  id: string;
  user_id: string;
  follower_user_id: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  likes: Like[];
  getLikes: (userId: string) => Promise<void>;
  following: Follower[];
  getFollowing: (userId: string) => Promise<void>;
  followers: Follower[];
  getFollowers: (userId: string) => Promise<void>;
  friends: string[];
  getFriends: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  likes: [],
  getLikes: async () => {},
  following: [],
  getFollowing: async () => {},
  followers: [],
  getFollowers: async () => {},
  friends: [],
  getFriends: async () => {},
  loading: true,
});

export const useAuth = () => React.useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [likes, setLikes] = React.useState<Like[]>([]);
  const [following, setFollowing] = React.useState<Follower[]>([]);
  const [followers, setFollowers] = React.useState<Follower[]>([]);
  const [friends, setFriends] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hasNavigated, setHasNavigated] = React.useState(false);
  const router = useRouter();

  const getUser = async (userId: string): Promise<void> => {
    try {
      console.log('Fetching user data for ID:', userId);
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Database error fetching user:', error);
        // If user doesn't exist in database, this is an error but don't prevent navigation
        if (error.code === 'PGRST116') {
          console.log('User not found in database, this might be expected for new users');
          // Don't throw error, just log it and continue
          return;
        }
        throw error;
      }

      console.log('User data fetched successfully:', data);
      setUser(data);
      console.log('User data set, navigation will be handled by auth state change');
    } catch (error) {
      console.error('Error fetching user:', error);
      // Don't re-throw the error to prevent blocking navigation
      console.log('Continuing despite getUser error...');
    }
  };

  const getLikes = async (userId: string): Promise<void> => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('Like')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      setLikes(data || []);
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const getFollowing = async (userId: string): Promise<void> => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('Follower')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      setFollowing(data || []);
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const getFollowers = async (userId: string): Promise<void> => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('Follower')
        .select('*')
        .eq('follower_user_id', userId);
      
      if (error) throw error;
      setFollowers(data || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const getFriends = async (): Promise<void> => {
    try {
      const followingIds = following.map((f: Follower) => f.follower_user_id);
      const followerIds = followers.map((f: Follower) => f.user_id);
      const mutualFriends = followingIds.filter((id: string) => followerIds.includes(id));
      setFriends(mutualFriends);
    } catch (error) {
      console.error('Error calculating friends:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      console.log('Attempting to sign in with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        throw new Error(error.message || 'Authentication failed');
      }

      if (data.user?.id) {
        console.log('User authenticated successfully:', data.user.id);

        // Get user data and navigate directly
        try {
          await getUser(data.user.id);
        } catch (getUserError) {
          console.log('getUser failed during signIn, but continuing with navigation');
        }

        console.log('Navigating to tabs from signIn...');
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 500);
      } else {
        throw new Error('No user data received after authentication');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (username: string, email: string, password: string): Promise<void> => {
    try {
      console.log('Attempting to sign up with email:', email, 'username:', username);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw new Error(error.message || 'Sign up failed');
      }

      if (data.user?.id) {
        console.log('User created in auth, creating profile:', data.user.id);
        const { error: userError } = await supabase
          .from('User')
          .insert({
            id: data.user.id,
            username: username,
            email: email,
          });

        if (userError) {
          console.error('Error creating user profile:', userError);
          throw new Error('Failed to create user profile: ' + userError.message);
        }

        console.log('User profile created successfully');

        // Set user data and navigate directly
        setUser({
          id: data.user.id,
          username,
          email,
        });

        console.log('Navigating to tabs from signUp...');
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 500);
      } else {
        throw new Error('No user data received after signup');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setLikes([]);
      setFollowing([]);
      setFollowers([]);
      setFriends([]);
      router.push('/(auth)');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  React.useEffect(() => {
    const { data: authData } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state change event:', event, 'Session exists:', !!session);

        // Only handle session cleanup, not navigation
        if (!session) {
          console.log('No session, clearing user data');
          setUser(null);
          setLikes([]);
          setFollowing([]);
          setFollowers([]);
          setFriends([]);
          setHasNavigated(false);
          setLoading(false);
        } else {
          console.log('Session exists, auth state change handler not navigating');
          setLoading(false);
        }
      }
    );

    return () => {
      authData.subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (user?.id) {
      getFollowing(user.id);
      getFollowers(user.id);
      getLikes(user.id);
    }
  }, [user?.id]);

  React.useEffect(() => {
    if (following.length > 0 || followers.length > 0) {
      getFriends();
    }
  }, [following, followers]);

  // Temporarily disable loading screen to test navigation
  // if (loading) {
  //   return <LoadingScreen message="Initializing..." />;
  // }

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signUp,
        signOut,
        likes,
        getLikes,
        following,
        getFollowing,
        followers,
        getFollowers,
        friends,
        getFriends,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
