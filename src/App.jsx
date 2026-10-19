import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Home from './components/Home';
import StudentDashboard from './components/StudentDashboard';
import CompanyDashboard from './components/CompanyDashboard';
import PlacementOfficerDashboard from './components/PlacementOfficerDashboard';
import SoftwareMetricsDashboard from './components/SoftwareMetricsDashboard';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import { getNotifications, markAllAsRead, subscribeToNotifications } from './services/notificationService';

// Inner app — has access to AuthContext
function AppInner() {
  const { user, profile, role, loading, signOut } = useAuth();

  // UI navigation state — separate from auth role
  const [currentView, setCurrentView] = useState('home'); // home | student | company | officer | metrics
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authRole, setAuthRole] = useState('student');

  // Real notifications from Supabase
  const [notifications, setNotifications] = useState([]);

  // When auth role changes, redirect to the correct dashboard
  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'student') setCurrentView('student');
      else if (role === 'company') setCurrentView('company');
      else if (role === 'admin') setCurrentView('officer');
    }
    if (!user) {
      setCurrentView('home');
      setNotifications([]);
    }
  }, [user, role, loading]);

  // Load real notifications from Supabase when user logs in
  useEffect(() => {
    if (!user?.id) return;

    // Initial load
    getNotifications(user.id).then(data => {
      if (data && data.length > 0) {
        setNotifications(data.map(n => ({
          id: n.id,
          text: n.message || n.title,
          time: new Date(n.created_at).toLocaleString(),
          unread: !n.is_read
        })));
      }
    });

    // Subscribe to real-time notifications
    const channel = subscribeToNotifications(user.id, (newNotif) => {
      setNotifications(prev => [{
        id: newNotif.id,
        text: newNotif.message || newNotif.title,
        time: 'Just now',
        unread: true
      }, ...prev]);
    });

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    };
  }, [user?.id]);

  const handleOpenAuth = (r = 'student') => {
    setAuthRole(r);
    setIsAuthOpen(true);
  };

  // Called by AuthModal after successful login/register
  const handleAuthSuccess = () => {
    setIsAuthOpen(false);
    // Navigation handled by useEffect above watching role
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentView('home');
  };

  const markNotificationsAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    if (user?.id) {
      try {
        await markAllAsRead(user.id);
      } catch (e) {
        // Non-critical
      }
    }
  };

  // Show a loading screen while session is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      <div>
        {/* Navigation Bar */}
        <Header 
          currentRole={currentView}
          setCurrentRole={setCurrentView}
          notifications={notifications}
          markNotificationsAsRead={markNotificationsAsRead}
          currentUser={user ? { ...profile, id: user.id } : null}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        />

        {/* Auth Modal */}
        <AuthModal 
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          initialRole={authRole}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {currentView === 'home' && (
            <Home 
              onNavigateRole={(r) => {
                if (!user) handleOpenAuth(r === 'officer' ? 'admin' : r);
                else setCurrentView(r);
              }} 
            />
          )}

          {currentView === 'student' && (
            <StudentDashboard />
          )}

          {currentView === 'company' && (
            <CompanyDashboard />
          )}

          {currentView === 'officer' && (
            <PlacementOfficerDashboard />
          )}

          {currentView === 'metrics' && (
            <SoftwareMetricsDashboard 
              onClose={() => setCurrentView(user ? (role === 'admin' ? 'officer' : role) : 'home')} 
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer onNavigateRole={setCurrentView} />
    </div>
  );
}

// Root export — wraps everything in AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
