import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import OceanBackground from './components/OceanBackground';
import WatchlistModal from './components/WatchlistModal';
import LocationPermissionModal from './components/auth/LocationPermissionModal';
import AlertSettingsModal from './components/user/AlertSettingsModal';
import Home from './pages/Home';
import Explore from './pages/Explore';
import OceanData from './pages/OceanData';
import SignalInspect from './pages/SignalInspect';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import { queryClimateIntelligence, checkSystemHealth } from './api/climateApi';
import { useAuth } from './context/useAuth';
import { Activity, Radio } from 'lucide-react';

const INITIAL_MISSION_LOGS = [
  {
    id: "conv-01",
    title: "Chennai Cyclone Risk & Ocean Heat Assessment",
    basin: "Bay of Bengal",
    time: "Today, 10:42 AM",
    query: "Is Chennai at increased cyclone risk due to ocean warming and barrier layers?"
  },
  {
    id: "conv-02",
    title: "Comparative Analysis: Chennai vs Mumbai Coastal Basins",
    basin: "Comparative",
    time: "Yesterday, 04:15 PM",
    query: "Compare climate risk and environmental conditions between Chennai and Mumbai."
  },
  {
    id: "conv-03",
    title: "Andaman Sea Marine Heatwave & Ecological Stress",
    basin: "Andaman Sea",
    time: "2 days ago",
    query: "Analyze thermal anomalies and marine heatwave potential in the Andaman Sea."
  },
  {
    id: "conv-04",
    title: "Kolkata & Ganges Plume Halocline Stratification",
    basin: "Bay of Bengal",
    time: "3 days ago",
    query: "What environmental signals indicate increased coastal flooding risk in the northern Bay of Bengal?"
  }
];

function inferBasinFromQuery(text) {
  const t = (text || "").toLowerCase();
  if (t.includes('compare') || (t.includes('chennai') && t.includes('mumbai'))) return 'Comparative';
  if (t.includes('chennai') || t.includes('bengal') || t.includes('kolkata') || t.includes('bob')) return 'Bay of Bengal';
  if (t.includes('mumbai') || t.includes('arabian') || t.includes('goa') || t.includes('kochi')) return 'Arabian Sea';
  if (t.includes('andaman') || t.includes('nicobar')) return 'Andaman Sea';
  if (t.includes('equatorial')) return 'Equatorial';
  return 'Regional Basin';
}

export default function App() {
  const { user, isAuthenticated, loading: authLoading, locationPreference } = useAuth();

  // Authentication view state: 'login' | 'signup' | 'forgot-password'
  const [authView, setAuthView] = useState(() => {
    const path = window.location.pathname;
    if (path === '/signup') return 'signup';
    if (path === '/forgot-password') return 'forgot-password';
    return 'login';
  });

  // Application page state: 'chat' | 'explore' | 'data' | 'about' | 'inspect'
  const [activePage, setActivePage] = useState('chat');
  const [inspectedSignal, setInspectedSignal] = useState(null);
  const [inspectPreviousPage, setInspectPreviousPage] = useState('data');
  const [messages, setMessages] = useState([]);
  const [investigationState, setInvestigationState] = useState('idle'); // 'idle' | 'searching' | 'retrieving' | 'analyzing' | 'success' | 'error'
  const [currentQuery, setCurrentQuery] = useState('');
  const [selectedFloat, setSelectedFloat] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('floatchat_sidebar_expanded');
      return saved !== null ? JSON.parse(saved) : false; // DEFAULT IS COLLAPSED (false)
    } catch {
      return false;
    }
  });
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAlertSettingsOpen, setIsAlertSettingsOpen] = useState(false);

  // Dynamic Mission Logs synced with localStorage
  const [missionLogs, setMissionLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('floatchat_mission_logs');
      return saved ? JSON.parse(saved) : INITIAL_MISSION_LOGS;
    } catch {
      return INITIAL_MISSION_LOGS;
    }
  });

  // Backend Live Status State
  const [backendStatus, setBackendStatus] = useState({ isLive: false, mode: 'mock' });

  // Sync Sidebar Expanded State to localStorage
  useEffect(() => {
    localStorage.setItem('floatchat_sidebar_expanded', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  // Sync Mission Logs to localStorage
  useEffect(() => {
    localStorage.setItem('floatchat_mission_logs', JSON.stringify(missionLogs));
  }, [missionLogs]);

  // Periodic Backend Health Polling
  useEffect(() => {
    checkSystemHealth().then(setBackendStatus);
    const interval = setInterval(() => {
      checkSystemHealth().then(setBackendStatus);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sync browser path
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/signup') setAuthView('signup');
      else if (path === '/forgot-password') setAuthView('forgot-password');
      else if (path === '/login') setAuthView('login');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Post-Authentication Location Check: Show prompt if status is unknown
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      if (!locationPreference || locationPreference.status === 'unknown') {
        const timer = setTimeout(() => {
          setIsLocationModalOpen(true);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, authLoading, locationPreference]);

  const navigateAuth = (view) => {
    setAuthView(view);
    const path = view === 'login' ? '/login' : view === 'signup' ? '/signup' : '/forgot-password';
    window.history.pushState({}, '', path);
  };

  const handleLoginSuccess = () => {
    window.history.pushState({}, '', '/');
    if (!locationPreference || locationPreference.status === 'unknown') {
      setIsLocationModalOpen(true);
    }
  };

  const isLoading = investigationState !== 'idle' && investigationState !== 'success' && investigationState !== 'error';

  // Send query to Climate Intelligence API
  const handleSendMessage = async (queryText) => {
    if (!queryText || isLoading) return;

    if (activePage !== 'chat') {
      setActivePage('chat');
    }

    const convId = `conv-${Date.now()}`;
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentQuery(queryText);
    setInvestigationState('searching');
    setActiveConversationId(convId);

    // Append to dynamic mission logs
    const newLogItem = {
      id: convId,
      title: queryText.length > 55 ? queryText.slice(0, 52) + "..." : queryText,
      basin: inferBasinFromQuery(queryText),
      time: "Just now",
      query: queryText
    };
    setMissionLogs((prev) => [newLogItem, ...prev.filter(l => l.query !== queryText)]);

    try {
      // Progressive Loading Sequencer
      setTimeout(() => {
        setInvestigationState('retrieving');
      }, 350);

      setTimeout(() => {
        setInvestigationState('analyzing');
      }, 700);

      const result = await queryClimateIntelligence({
        query: queryText,
        conversationId: convId,
        context: { user: user?.email }
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to retrieve climate intelligence.');
      }

      const aiData = result.data;
      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        query: queryText,
        text: aiData.text,
        queryIntent: aiData.queryIntent,
        riskLevel: aiData.riskLevel,
        riskTitle: aiData.riskTitle,
        riskSummary: aiData.riskSummary,
        confidence: aiData.confidence,
        comparison: aiData.comparison,
        hazards: aiData.hazards || [],
        actions: aiData.actions || [],
        kpis: aiData.kpis || [],
        floats: aiData.floats || [],
        relevantFloatId: aiData.relevantFloatId,
        chartData: aiData.chartData || [],
        chartType: aiData.chartType || 'temperature',
        mapFocus: aiData.mapFocus,
        followUps: aiData.followUps || [],
        source: aiData.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMock: result.isMock
      };

      setMessages((prev) => [...prev, aiMessage]);
      setInvestigationState('success');
    } catch (err) {
      console.error('[FloatChat] Query execution error:', err);
      setInvestigationState('error');

      const errorMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        isError: true,
        text: "Unable to retrieve the latest environmental intelligence. Please check your backend connection or retry the inquiry.",
        failedQuery: queryText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setTimeout(() => {
        setInvestigationState('idle');
        setCurrentQuery('');
      }, 250);
    }
  };

  const handleRetryQuery = (failedQuery) => {
    if (failedQuery) {
      handleSendMessage(failedQuery);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setActiveConversationId(null);
    setSelectedFloat(null);
    setInvestigationState('idle');
    setActivePage('chat');
  };

  const handleSelectConversation = (conv) => {
    setActiveConversationId(conv.id);
    setActivePage('chat');
    handleSendMessage(conv.query || conv.title);
  };

  const handleDeleteMissionLog = (id) => {
    setMissionLogs((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAllMissionLogs = () => {
    setMissionLogs([]);
  };

  const handleAskAboutFloat = (float) => {
    setActivePage('chat');
    handleSendMessage(`Provide an in-depth climate risk and environmental indicator assessment for Float ${float.id} (${float.name}) in ${float.region}.`);
  };

  const handleSelectWatchlistRegion = (regionName) => {
    setActivePage('chat');
    handleSendMessage(`Analyze current climate risk, thermal energy, and environmental anomalies for ${regionName}.`);
  };

  const handleInspectSignal = (signalData, fromPage = 'data') => {
    setInspectedSignal(signalData);
    setInspectPreviousPage(fromPage);
    setActivePage('inspect');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromInspect = () => {
    setActivePage(inspectPreviousPage || 'data');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Initial Session Verification Loading Splash
  if (authLoading) {
    return (
      <div className="auth-loading-splash font-mono">
        <OceanBackground />
        <div className="loading-splash-content">
          <div className="splash-radar-logo">
            <img src="/ocean-logo.svg" alt="FloatChat Logo" className="splash-logo" />
            <span className="splash-sonar-ring" />
          </div>
          <div className="splash-status-row">
            <Activity size={16} className="text-cyan animate-pulse" />
            <span>INITIALIZING CLIMATE MISSION SESSION...</span>
          </div>
        </div>

        <style>{`
          .auth-loading-splash {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-abyss);
            color: var(--text-primary);
            position: relative;
            overflow: hidden;
          }

          .loading-splash-content {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }

          .splash-radar-logo {
            position: relative;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .splash-logo {
            width: 40px;
            height: 40px;
            filter: drop-shadow(0 0 10px rgba(0, 229, 255, 0.6));
            position: relative;
            z-index: 2;
          }

          .splash-sonar-ring {
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 1.5px solid var(--cyan-primary);
            animation: sonarPulse 2s infinite;
          }

          .splash-status-row {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11.5px;
            letter-spacing: 0.08em;
            color: var(--text-secondary);
            background: var(--glass-panel);
            border: 1px solid var(--border-light);
            padding: 8px 16px;
            border-radius: var(--radius-full);
            backdrop-filter: blur(14px);
          }
        `}</style>
      </div>
    );
  }

  // 2. Unauthenticated Routes (Login, Signup, Forgot Password)
  if (!isAuthenticated) {
    if (authView === 'signup') {
      return (
        <Signup
          onNavigateToLogin={() => navigateAuth('login')}
          onSignupSuccess={handleLoginSuccess}
        />
      );
    }

    if (authView === 'forgot-password') {
      return (
        <ForgotPassword
          onNavigateToLogin={() => navigateAuth('login')}
        />
      );
    }

    return (
      <Login
        onNavigateToSignup={() => navigateAuth('signup')}
        onNavigateToForgotPassword={() => navigateAuth('forgot-password')}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // 3. Authenticated FloatChat Dashboard
  return (
    <div className="floatchat-observatory-app">
      {/* LAYER 1: Ambient Earth System Background */}
      <OceanBackground />

      {/* LAYER 3: Clean Top Navigation Bar with User Profile Menu */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        onNewChat={handleNewChat}
        onOpenWatchlist={() => setIsWatchlistOpen(true)}
        onOpenAlertSettings={() => setIsAlertSettingsOpen(true)}
      />

      {/* Main Layout Grid */}
      <div className="app-workspace-layout">
        {/* Minimal Secondary Instrument Rail Sidebar */}
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          conversations={missionLogs}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteMissionLog}
          onClearAllConversations={handleClearAllMissionLogs}
          activeConversationId={activeConversationId}
          onNewChat={handleNewChat}
          onOpenWatchlist={() => setIsWatchlistOpen(true)}
          onOpenAlertSettings={() => setIsAlertSettingsOpen(true)}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        {/* Primary Viewport */}
        <main className="observatory-main-viewport">
          {activePage === 'chat' && (
            <Home
              messages={messages}
              isLoading={isLoading}
              currentQuery={currentQuery}
              onSendMessage={handleSendMessage}
              onRetryQuery={handleRetryQuery}
              selectedFloat={selectedFloat}
              setSelectedFloat={setSelectedFloat}
              onNavigate={(page) => setActivePage(page)}
              onInspectSignal={handleInspectSignal}
            />
          )}

          {activePage === 'explore' && (
            <Explore
              onAskAboutFloat={handleAskAboutFloat}
              onInspectSignal={handleInspectSignal}
            />
          )}

          {activePage === 'data' && (
            <OceanData 
              onNavigateToChat={(q) => {
                setActivePage('chat');
                if (q) handleSendMessage(q);
              }}
              onInspectSignal={handleInspectSignal}
            />
          )}

          {activePage === 'about' && (
            <About
              onNavigateToChat={(q) => {
                setActivePage('chat');
                if (q) handleSendMessage(q);
              }}
              onOpenAlertSettings={() => setIsAlertSettingsOpen(true)}
              onInspectSignal={handleInspectSignal}
            />
          )}

          {activePage === 'inspect' && (
            <SignalInspect
              signal={inspectedSignal}
              onBack={handleBackFromInspect}
              onNavigateToChat={(q) => {
                setActivePage('chat');
                if (q) handleSendMessage(q);
              }}
            />
          )}
        </main>
      </div>

      {/* User Watchlist Modal */}
      <WatchlistModal
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        onSelectRegionInvestigation={handleSelectWatchlistRegion}
      />

      {/* Post-Login Location Permission Modal */}
      <LocationPermissionModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onComplete={() => setIsLocationModalOpen(false)}
      />

      {/* Alert & Proximity Radius Settings Modal */}
      <AlertSettingsModal
        isOpen={isAlertSettingsOpen}
        onClose={() => setIsAlertSettingsOpen(false)}
      />

      {/* Persistent System Telemetry Pill at Bottom Left */}
      <div className="global-system-telemetry-pill font-mono">
        <Radio size={11} className={backendStatus.isLive ? "text-emerald animate-pulse" : "text-cyan animate-pulse"} />
        <span>
          {backendStatus.isLive 
            ? "FASTAPI CLIMATE AI LIVE • 3,842 IN-SITU SENSORS ASSIMILATED" 
            : "IN-SITU SENSOR SIMULATION ENGINE • 3,842 ARGO FLOATS ACTIVE"}
        </span>
      </div>

      <style>{`
        .floatchat-observatory-app {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: transparent;
          color: var(--text-primary);
          position: relative;
        }

        .app-workspace-layout {
          display: flex;
          flex: 1;
          height: calc(100vh - 68px);
          overflow: hidden;
          position: relative;
          z-index: 10;
        }

        .observatory-main-viewport {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          min-width: 0;
          position: relative;
          z-index: 5;
        }

        .global-system-telemetry-pill {
          position: fixed;
          bottom: 12px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--glass-panel-elevated);
          border: 1px solid var(--border-light);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          font-size: 9.5px;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          z-index: 100;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        @media (max-width: 768px) {
          .global-system-telemetry-pill {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .app-workspace-layout {
            height: calc(100vh - 60px);
          }
        }
      `}</style>
    </div>
  );
}
