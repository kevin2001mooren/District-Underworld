import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Game.css';
import { createClient } from '@supabase/supabase-js';
import { Shield, Skull, Zap, Swords, Coins, User, Lock, Loader2, Award, Clock } from 'lucide-react';
const SUPABASE_URL = "https://utqwbqymcbgoqunpjfff.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cXdicXltY2Jnb3F1bnBqZmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMTAyMTUsImV4cCI6MjA5ODc4NjIxNX0.jirvlYKUSSmXDT-OC50zOR5TKVYEwT8NFAIFOBGhxSY";
const APP_PUBLIC_URL = "https://district-underworld.vercel.app/";
const DEFAULT_MALE_PROFILE_PHOTO = '/default-male-profile.jpeg';
const DEFAULT_FEMALE_PROFILE_PHOTO = '/default-female-profile.jpeg';

const getEmailRedirectUrl = () => {
  const host = window.location.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';
  return isLocalhost ? APP_PUBLIC_URL : `${window.location.origin}/`;
};
const ADMIN_EMAILS = ['kevin2001mooren@gmail.com'];
const VALID_ROLES = ['admin', 'moderator', 'helper', 'lid'];
const STAFF_ROLES = ['admin', 'moderator', 'helper'];
const PRISON_BRIBE_BASE_COST = 500;
const PRISON_BRIBE_COST_PER_SECOND = 75;
const PRISON_ESCAPE_NERVE_COST = 5;
const PRISON_ESCAPE_SUCCESS_CHANCE = 0.35;
const PRISON_RESCUE_NERVE_COST = 5;
const ADMIN_JAIL_SECONDS = 60;
const ENERGY_RECOVERY_INTERVAL_SECONDS = 60;
const NERVE_RECOVERY_INTERVAL_SECONDS = 300;
const CASH_INTEGER_MAX = 2147483647;
const CHAT_MAX_VISIBLE_LINES = 20;
const CHAT_LINE_HEIGHT = 1.45;
const CHAT_FONT_SIZE_PX = 12;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const NAV_TABS = ['overzicht', 'mijn items', 'woning', 'stad', 'misdaad', 'sporten', 'reizen'];
const PROFILE_PHOTO_FIELD_CANDIDATES = [
  'profile_photo_url',
  'avatar_url',
  'photo_url',
  'avatar',
  'profile_photo',
  'profile_image_url',
  'image_url',
  'photo'
];
const PHOTO_FIELD_NAME_PATTERN = /(photo|avatar|image|pfp)/i;

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('lid');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Game state
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [jailTime, setJailTime] = useState(0);
  const [activeTab, setActiveTab] = useState('overzicht');
  const [currentView, setCurrentView] = useState('game');
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [selectedMemberProfile, setSelectedMemberProfile] = useState(null);
  const [adminMembers, setAdminMembers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminActionLoadingId, setAdminActionLoadingId] = useState(null);
  const [adminCashInputs, setAdminCashInputs] = useState({});
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [membersSearchTerm, setMembersSearchTerm] = useState('');
  const [membersLoadError, setMembersLoadError] = useState('');
  const [rankMenuOpenId, setRankMenuOpenId] = useState(null);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [prisonMembers, setPrisonMembers] = useState([]);
  const [prisonLoading, setPrisonLoading] = useState(false);
  const [prisonActionLoadingId, setPrisonActionLoadingId] = useState(null);
  const [prisonActionWarning, setPrisonActionWarning] = useState('');
  const [recoveryTimers, setRecoveryTimers] = useState({ energy: null, nerve: null });
  const [actionNotice, setActionNotice] = useState(null);
  const [adminNotice, setAdminNotice] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatDeletingId, setChatDeletingId] = useState(null);
  const [chatDeleteHoverId, setChatDeleteHoverId] = useState(null);
  const [chatUserRoles, setChatUserRoles] = useState({});
  const [isChatWidgetOpen, setIsChatWidgetOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [profilePhotoDraft, setProfilePhotoDraft] = useState('');
  const [profilePhotoError, setProfilePhotoError] = useState('');
  const [usernameDraft, setUsernameDraft] = useState('');
  const [usernameChangeError, setUsernameChangeError] = useState('');
  const [usernameChangeLoading, setUsernameChangeLoading] = useState(false);
  const dashboardScrollRef = useRef(null);
  const chatScrollRef = useRef(null);
  const shouldAutoScrollChatRef = useRef(true);
  const didInitialChatScrollRef = useRef(false);
  const chatUserRolesRef = useRef({});
  const forceChatBottomRef = useRef(false);
  const isChatWidgetOpenRef = useRef(false);
  const lastCloudNetworkLogAtRef = useRef(0);

  const scrollChatToBottom = (remainingPasses = 4) => {
    const container = chatScrollRef.current;
    if (!container) return false;
    container.scrollTo({ top: container.scrollHeight, behavior: 'auto' });

    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;
    if (atBottom) return true;

    if (remainingPasses <= 0) return false;
    requestAnimationFrame(() => {
      scrollChatToBottom(remainingPasses - 1);
    });

    return false;
  };

  const scrollDashboardToTop = (remainingPasses = 4) => {
    const container = dashboardScrollRef.current;
    if (!container) return;
    container.scrollTo({ top: 0, behavior: 'auto' });

    if (container.scrollTop <= 0) return;
    if (remainingPasses <= 0) return;

    requestAnimationFrame(() => {
      scrollDashboardToTop(remainingPasses - 1);
    });
  };

  const normalizeRole = (value) => {
    const roleValue = (value || '').toString().trim().toLowerCase();
    return VALID_ROLES.includes(roleValue) ? roleValue : 'lid';
  };

  const isLikelyNetworkFetchError = (error) => {
    const message = String(error?.message || '').toLowerCase();
    const name = String(error?.name || '').toLowerCase();
    return (
      message.includes('failed to fetch') ||
      message.includes('networkerror') ||
      message.includes('load failed') ||
      (name === 'typeerror' && message.includes('fetch'))
    );
  };

  const summarizeCloudError = (error) => {
    const values = [error?.code, error?.message, error?.details, error?.hint]
      .filter(Boolean)
      .map((value) => String(value).replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .map((value) => {
        const atIndex = value.toLowerCase().indexOf(' at ');
        return atIndex > 0 ? value.slice(0, atIndex).trim() : value;
      })
      .filter(Boolean);

    const deduped = [];
    values.forEach((value) => {
      const lowered = value.toLowerCase();
      if (!deduped.some((item) => item.toLowerCase() === lowered)) {
        deduped.push(value);
      }
    });

    if (deduped.length === 0) return 'onbekende fout';
    return deduped.join(' | ');
  };

  const logCloudNetworkIssueThrottled = () => {
    const now = Date.now();
    if (now - lastCloudNetworkLogAtRef.current < 15000) {
      return;
    }

    lastCloudNetworkLogAtRef.current = now;
    const offlineHint = typeof navigator !== 'undefined' && navigator.onLine === false
      ? ' (apparaat lijkt offline)'
      : '';
    addLog(`🚨 Synchronisatie met cloud database mislukt: netwerkfout (fetch)${offlineHint}.`, 'error');
  };

  const isMissingPlayerStatsColumnError = (error, columnName) => {
    const message = String(error?.message || '').toLowerCase();
    const targetColumn = String(columnName || '').toLowerCase();
    const missingColumnPattern =
      message.includes('does not exist') ||
      message.includes('could not find') ||
      (message.includes('schema cache') && message.includes('column'));

    return (
      missingColumnPattern &&
      message.includes('player_stats') &&
      message.includes(targetColumn)
    );
  };

  const refreshAdminMembers = async () => {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .order('level', { ascending: false });

    if (error) throw error;
    setAdminMembers(data || []);
  };

  const resolveUserRole = (authUser) => {
    if (!authUser) return 'lid';
    const metadataRole = normalizeRole(authUser.user_metadata?.role);
    if (metadataRole !== 'lid') return metadataRole;
    const emailValue = (authUser.email || '').toLowerCase();
    return ADMIN_EMAILS.includes(emailValue) ? 'admin' : 'lid';
  };

  // Check active session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setUserRole(resolveUserRole(session?.user));
      if (session?.user) {
        fetchPlayerStats(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setUserRole(resolveUserRole(session?.user));
      if (session?.user) {
        fetchPlayerStats(session.user);
      } else {
        setSelectedMemberProfile(null);
        setCurrentView('game');
        setStats(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentView !== 'admin' || !STAFF_ROLES.includes(userRole)) return;

    const fetchAdminMembersForPage = async () => {
      setAdminLoading(true);
      try {
        await refreshAdminMembers();
      } catch (_error) {
        addLog('❌ Admin leden laden mislukt.', 'error');
        setAdminMembers([]);
      } finally {
        setAdminLoading(false);
      }
    };

    fetchAdminMembersForPage();
  }, [currentView, userRole]);

  // Jail Timer countdown logic
  useEffect(() => {
    if (!stats?.jail_until) {
      if (jailTime !== 0) setJailTime(0);
      return;
    }

    const computeRemainingSeconds = () => {
      const msRemaining = new Date(stats.jail_until).getTime() - Date.now();
      return Math.max(0, Math.ceil(msRemaining / 1000));
    };

    setJailTime(computeRemainingSeconds());

    const interval = setInterval(() => {
      const remaining = computeRemainingSeconds();
      setJailTime(remaining);
      if (remaining <= 0) {
        setStats(prev => (prev ? { ...prev, jail_until: null } : prev));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stats?.jail_until, jailTime]);

  useEffect(() => {
    if (!user) return;

    const syncOwnJailStatus = async () => {
      const { data } = await supabase
        .from('player_stats')
        .select('jail_until')
        .eq('id', user.id)
        .maybeSingle();

      if (data && stats && data.jail_until !== stats.jail_until) {
        setStats(prev => (prev ? { ...prev, jail_until: data.jail_until } : prev));
      }
    };

    const interval = setInterval(syncOwnJailStatus, 5000);
    return () => clearInterval(interval);
  }, [user, stats]);

  useEffect(() => {
    if (currentView !== 'online-members' || !user) return;

    const fetchOnlineMembers = async () => {
      setOnlineLoading(true);
      setMembersLoadError('');

      try {
        const pageSize = 1000;
        let from = 0;
        let allMembers = [];

        while (true) {
          const to = from + pageSize - 1;
          const { data, error } = await supabase
            .from('player_stats')
            .select('*')
            .order('username', { ascending: true })
            .range(from, to);

          if (error) {
            throw error;
          }

          const batch = (data || []).map((member) => ({
            ...member,
            role: normalizeRole(member?.role)
          }));

          allMembers = [...allMembers, ...batch];

          if (batch.length < pageSize) break;
          from += pageSize;
        }

        setOnlineMembers(allMembers);
      } catch (error) {
        const message = error?.message || 'Onbekende fout tijdens laden van ledenlijst.';
        const lowered = String(message).toLowerCase();
        const policyHint =
          lowered.includes('permission denied') ||
          lowered.includes('row-level security') ||
          lowered.includes('not allowed') ||
          lowered.includes('not authorized');

        setMembersLoadError(
          policyHint
            ? `Ledenlijst geblokkeerd door Supabase policy/RLS: ${message}`
            : `Ledenlijst laden mislukt: ${message}`
        );
        addLog(`❌ Ledenlijst laden mislukt: ${message}`, 'error');
        setOnlineMembers([]);
      } finally {
        setOnlineLoading(false);
      }
    };

    fetchOnlineMembers();
    const interval = setInterval(fetchOnlineMembers, 30000);
    return () => clearInterval(interval);
  }, [currentView, user]);

  // Activity logger helper
  const addLog = (text, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ time, text, type }, ...prev].slice(0, 15));
  };

  const formatDisplayUsername = (value) => {
    if (!value || typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };

  const formatGenderLabel = (value) => {
    if (!value || typeof value !== 'string') return 'Onbekend';
    const normalized = value.trim().toLowerCase();
    if (normalized === 'liever-niet-zeggen') return 'Liever niet zeggen';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const getProfilePhotoStorageKey = (playerId) => `district-underworld-profile-photo-${playerId}`;

  const normalizeProfilePhotoValue = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    const isHttp = /^https?:\/\//i.test(normalized);
    const isDataImage = /^data:image\//i.test(normalized);
    const isRootRelative = normalized.startsWith('/');
    const isBlob = /^blob:/i.test(normalized);
    return isHttp || isDataImage || isRootRelative || isBlob ? normalized : '';
  };

  const getStoredProfilePhoto = (playerId) => {
    if (!playerId) return '';
    try {
      return normalizeProfilePhotoValue(window.localStorage.getItem(getProfilePhotoStorageKey(playerId)) || '');
    } catch (_error) {
      return '';
    }
  };

  const resolveProfilePhoto = (playerStats, fallbackId) => {
    const dynamicPhotoFields = Object.keys(playerStats || {}).filter((field) => PHOTO_FIELD_NAME_PATTERN.test(field));
    const photoFieldsToCheck = Array.from(new Set([...PROFILE_PHOTO_FIELD_CANDIDATES, ...dynamicPhotoFields]));
    const hasKnownPhotoField = photoFieldsToCheck.some((field) => Object.prototype.hasOwnProperty.call(playerStats || {}, field));

    const dbPhoto = photoFieldsToCheck
      .map((field) => normalizeProfilePhotoValue(playerStats?.[field]))
      .find(Boolean) || '';

    if (dbPhoto) return dbPhoto;

    // Als de speler een echte fotokolom in de DB heeft maar die is leeg/null,
    // respecteer dat expliciet en gebruik geen oude lokale cachewaarde.
    if (!dbPhoto && hasKnownPhotoField) {
      const genderValue = String(playerStats?.gender || '').trim().toLowerCase();
      if (genderValue === 'vrouw' || genderValue === 'female') return DEFAULT_FEMALE_PROFILE_PHOTO;
      if (genderValue === 'man' || genderValue === 'male') return DEFAULT_MALE_PROFILE_PHOTO;
      return '';
    }

    const targetId = playerStats?.id || fallbackId;
    const storedPhoto = getStoredProfilePhoto(targetId);
    if (storedPhoto) return storedPhoto;

    const genderValue = String(playerStats?.gender || '').trim().toLowerCase();
    if (genderValue === 'vrouw' || genderValue === 'female') {
      return DEFAULT_FEMALE_PROFILE_PHOTO;
    }

    if (genderValue === 'man' || genderValue === 'male') {
      return DEFAULT_MALE_PROFILE_PHOTO;
    }

    return '';
  };

  const formatCountdown = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || totalSeconds <= 0) return '00:00';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const formatChatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChatDayKey = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const formatChatDayLabel = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    if (isToday) return 'Today';
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const isOwnChatMessage = (messageUsername) => {
    const own = (stats?.username || '').trim().toLowerCase();
    const incoming = (messageUsername || '').trim().toLowerCase();
    return Boolean(own) && own === incoming;
  };

  const getChatUsernameKey = (value) => (value || '').trim().toLowerCase();

  const mergeChatUserRoles = (entries) => {
    if (!entries || entries.length === 0) return;
    setChatUserRoles((prev) => {
      const next = { ...prev };
      entries.forEach(({ username, role }) => {
        const key = getChatUsernameKey(username);
        if (!key) return;
        next[key] = normalizeRole(role);
      });
      return next;
    });
  };

  useEffect(() => {
    chatUserRolesRef.current = chatUserRoles;
  }, [chatUserRoles]);

  useEffect(() => {
    isChatWidgetOpenRef.current = isChatWidgetOpen;
    if (isChatWidgetOpen) {
      setChatUnreadCount(0);
    }
  }, [isChatWidgetOpen]);

  const fetchRolesForChatUsernames = async (usernames) => {
    const normalized = Array.from(new Set((usernames || [])
      .map((name) => (name || '').trim())
      .filter(Boolean)
      .filter((name) => {
        const key = name.toLowerCase();
        return key !== 'systeem' && key !== 'system';
      })));

    if (normalized.length === 0) return;

    try {
      const lookups = await Promise.all(
        normalized.map(async (usernameValue) => {
          const { data, error } = await supabase
            .from('player_stats')
            .select('username, role')
            .ilike('username', usernameValue)
            .limit(1)
            .maybeSingle();

          if (error || !data) return null;
          return data;
        })
      );

      mergeChatUserRoles(lookups.filter(Boolean));
    } catch (_error) {
      // Chat blijft werken; alleen staffkleur kan ontbreken als lookup faalt.
    }
  };

  const ensureChatUserRole = async (username) => {
    const key = getChatUsernameKey(username);
    if (!key || key === 'systeem' || key === 'system' || chatUserRolesRef.current[key]) return;

    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('username, role')
        .ilike('username', username)
        .limit(1)
        .maybeSingle();

      if (error || !data) return;
      mergeChatUserRoles([data]);
    } catch (_error) {
      // Stil: alleen kleuraccent kan ontbreken.
    }
  };

  const calculatePrisonBribeCost = (remainingJailSeconds) => {
    const safeSeconds = Math.max(0, Number(remainingJailSeconds) || 0);
    return PRISON_BRIBE_BASE_COST + safeSeconds * PRISON_BRIBE_COST_PER_SECOND;
  };

  const getRemainingJailSeconds = (jailUntilValue) => {
    if (!jailUntilValue) return 0;
    const msRemaining = new Date(jailUntilValue).getTime() - Date.now();
    return Math.max(0, Math.ceil(msRemaining / 1000));
  };

  const calculateRescueChance = (remainingJailSeconds) => {
    const penaltySteps = Math.floor(Math.max(0, remainingJailSeconds) / 30);
    const chance = 0.6 - penaltySteps * 0.05;
    return Math.max(0.1, Math.min(0.6, chance));
  };

  const refreshChatMessages = async () => {
    setChatLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, username, content, created_at')
        .order('created_at', { ascending: false })
        .limit(80);

      if (error) throw error;

      const sorted = [...(data || [])].reverse();
      void fetchRolesForChatUsernames(sorted.map((message) => message.username));
      shouldAutoScrollChatRef.current = true;
      setChatMessages(sorted);
    } catch (error) {
      addLog(`❌ Chat laden mislukt: ${error.message}`, 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChatMessage = async (event) => {
    event.preventDefault();
    if (!user || !stats || chatSending) return;

    const content = chatInput.trim();
    if (!content) return;

    const messageUsername = stats?.username || user?.email?.split('@')[0] || 'Onbekend';

    setChatSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ username: messageUsername, content }]);

      if (error) throw error;
      setChatInput('');
    } catch (error) {
      addLog(`❌ Bericht verzenden mislukt: ${error.message}`, 'error');
    } finally {
      setChatSending(false);
    }
  };

  const handleDeleteChatMessage = async (messageId) => {
    if (userRole !== 'admin' || !messageId || chatDeletingId) return;

    setChatDeletingId(messageId);
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      const { data: remainingMessage, error: verifyError } = await supabase
        .from('messages')
        .select('id')
        .eq('id', messageId)
        .maybeSingle();

      if (verifyError) throw verifyError;
      if (remainingMessage) {
        addLog('❌ Bericht niet verwijderd. Controleer admin rechten/RLS voor chat DELETE.', 'error');
        return;
      }

      setChatMessages((prev) => prev.filter((message) => message.id !== messageId));
    } catch (error) {
      addLog(`❌ Bericht verwijderen mislukt: ${error.message}`, 'error');
    } finally {
      setChatDeletingId(null);
    }
  };

  const handleChatInputKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (!chatInput.trim() || chatSending) return;
    void handleSendChatMessage(event);
  };

  const handleOpenChatProfile = async (messageUsername) => {
    const targetUsername = (messageUsername || '').trim();
    if (!targetUsername) return;

    const normalizedTarget = targetUsername.toLowerCase();
    if (normalizedTarget === 'systeem' || normalizedTarget === 'system') return;

    const ownUsername = (stats?.username || '').trim().toLowerCase();
    if (ownUsername && ownUsername === normalizedTarget) {
      setCurrentView('profile');
      return;
    }

    const onlineMatch = onlineMembers.find(
      (member) => (member?.username || '').trim().toLowerCase() === normalizedTarget
    );

    const fetchMemberProfileById = async (memberId) => {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('id', memberId)
        .maybeSingle();

      if (error || !data) return null;
      return { ...data, role: normalizeRole(data?.role) };
    };

    const openMemberProfile = async (memberData) => {
      if (!memberData?.id) return false;

      try {
        const data = await fetchMemberProfileById(memberData.id);
        setSelectedMemberProfile(data || memberData);
        setCurrentView('member-profile');
        return true;
      } catch (_error) {
        setSelectedMemberProfile(memberData);
        setCurrentView('member-profile');
        return false;
      }
    };

    if (onlineMatch) {
      await openMemberProfile(onlineMatch);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .ilike('username', targetUsername)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        addLog(`⚠️ Profiel van ${formatDisplayUsername(targetUsername)} niet gevonden.`, 'error');
        return;
      }

      setSelectedMemberProfile(data);
      setCurrentView('member-profile');
    } catch (error) {
      addLog(`❌ Profiel laden mislukt: ${error.message}`, 'error');
    }
  };

  const handleChatScroll = () => {
    const container = chatScrollRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollChatRef.current = distanceFromBottom <= 80;
  };

  const showActionNotice = (text, type = 'info') => {
    setActionNotice({ text, type });
  };

  const showAdminNotice = (text, type = 'info') => {
    setAdminNotice({ text, type });
  };

  const formatAmountWithDots = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseAmountInput = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return 0;
    return Number(digits);
  };

  const isMissingPrisonRpc = (error) => {
    const message = (error?.message || '').toLowerCase();
    return message.includes('function') && message.includes('prison_help_player');
  };

  // Fetch or initialize player stats in database
  const fetchPlayerStats = async (user) => {
    try {
      setLoading(true);

      // Haal de naam uit de metadata (als die bestaat)
      const metaUsername = user.user_metadata?.username;
      const metaGender = user.user_metadata?.gender;

      let { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('id', user.id) // Gebruik user.id hier
        .single();

      if (error && error.code === 'PGRST116') {
        const defaultUsername = email.split('@')[0] + "_" + Math.floor(Math.random() * 1000);
        const { data: newRecord, error: createError } = await supabase
          .from('player_stats')
          .insert([
            { 
              id: user.id, 
              username: metaUsername || username || defaultUsername, // Prioriteit: Metadata > Formulier > Random
              gender: metaGender || gender || null,
              cash: 1000,
              energy: 100,
              max_energy: 100,
              nerve: 20,
              max_nerve: 20,
              strength: 10,
              xp: 0,
              level: 1,
              jail_until: null,
              last_updated: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (createError) throw createError;
        data = newRecord;
        addLog(`🆕 Karakter aangemaakt! Welkom in het District, ${formatDisplayUsername(data.username)}!`, 'success');
      } else if (error) {
        throw error;
      }

      if (data) {
        const dbRole = normalizeRole(data.role);
        const fallbackRole = resolveUserRole(user);
        const effectiveRole = dbRole !== 'lid' ? dbRole : fallbackRole;

        if (dbRole !== effectiveRole) {
          const { data: roleUpdatedData, error: roleUpdateError } = await supabase
            .from('player_stats')
            .update({ role: effectiveRole })
            .eq('id', user.id)
            .select('*')
            .maybeSingle();

          if (!roleUpdateError && roleUpdatedData) {
            data = roleUpdatedData;
          }
        }

        setUserRole(effectiveRole);
        setStats(data);
        calculateOfflineRecovery(data);
      }
    } catch (err) {
      console.error(err);
      addLog("❌ Database verbindingsfout.", "error");
    } finally {
      setLoading(false);
    }
  };

  const ownResolvedProfilePhoto = resolveProfilePhoto(stats, user?.id);

  useEffect(() => {
    if (!user || !stats) return;
    setProfilePhotoDraft((prev) => (prev === ownResolvedProfilePhoto ? prev : ownResolvedProfilePhoto));
  }, [user?.id, stats?.id, ownResolvedProfilePhoto]);

  useEffect(() => {
    if (!stats?.username) return;
    setUsernameDraft(stats.username);
    setUsernameChangeError('');
  }, [stats?.username]);

  const handleProfilePhotoFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfilePhotoError('Kies een geldig afbeeldingsbestand.');
      return;
    }

    if (file.size > 1_500_000) {
      setProfilePhotoError('Afbeelding is te groot (max 1.5 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = normalizeProfilePhotoValue(reader.result);
      if (!dataUrl) {
        setProfilePhotoError('Kon de afbeelding niet verwerken.');
        return;
      }
      setProfilePhotoDraft(dataUrl);
      setProfilePhotoError('');
    };
    reader.onerror = () => {
      setProfilePhotoError('Uploaden mislukt. Probeer opnieuw.');
    };
    reader.readAsDataURL(file);
  };

  const saveProfilePhoto = async (nextPhotoDraft = null) => {
    if (!user || !stats) return;

    const draftSource = typeof nextPhotoDraft === 'string' ? nextPhotoDraft : profilePhotoDraft;
    const normalized = normalizeProfilePhotoValue(draftSource);
    if (draftSource.trim() && !normalized) {
      setProfilePhotoError('Gebruik een geldige afbeelding-URL (http/https) of upload een foto.');
      return;
    }

    let savedInDatabase = false;
    let savedPhotoField = null;
    const expectedPhotoValue = normalized || '';
    let blockedByPolicy = false;

    try {
      const existingFields = PROFILE_PHOTO_FIELD_CANDIDATES.filter((field) => Object.prototype.hasOwnProperty.call(stats, field));
      const discoveredFields = Object.keys(stats || {}).filter((field) => PHOTO_FIELD_NAME_PATTERN.test(field));
      const fieldsToTry = Array.from(new Set([...existingFields, ...discoveredFields, ...PROFILE_PHOTO_FIELD_CANDIDATES]));

      const fieldsPresentInRow = Array.from(new Set([...existingFields, ...discoveredFields]));
      if (fieldsPresentInRow.length > 0) {
        const bulkPayload = fieldsPresentInRow.reduce((acc, fieldName) => {
          acc[fieldName] = normalized || null;
          return acc;
        }, {});

        const { data: updatedRow, error: bulkError } = await supabase
          .from('player_stats')
          .update(bulkPayload)
          .eq('id', user.id)
          .select(`id, ${fieldsPresentInRow.join(', ')}`)
          .maybeSingle();

        if (!bulkError) {
          const allFieldsSynced = fieldsPresentInRow.every(
            (fieldName) => normalizeProfilePhotoValue(updatedRow?.[fieldName]) === expectedPhotoValue
          );

          if (updatedRow && allFieldsSynced) {
            savedInDatabase = true;
            savedPhotoField = fieldsPresentInRow[0] || null;
          } else {
            blockedByPolicy = true;
          }
        } else if (!isMissingPlayerStatsColumnError(bulkError, fieldsPresentInRow[0])) {
          addLog(`⚠️ Profielfoto cloud-opslag mislukt: ${bulkError.message}`, 'error');
        }
      }

      if (savedInDatabase) {
        // Klaar: alle bekende fotovelden zijn in 1x bijgewerkt.
        // Geen extra per-veld fallback nodig.
      } else {
        // Fallback voor databases waar nog geen bekend fotoveld op de row aanwezig is.
        for (const fieldName of fieldsToTry) {
          const payload = { [fieldName]: normalized || null };
          const { data: updatedRow, error: dbError } = await supabase
            .from('player_stats')
            .update(payload)
            .eq('id', user.id)
            .select(`id, ${fieldName}`)
            .maybeSingle();

          if (!dbError) {
            const resolvedFromDb = normalizeProfilePhotoValue(updatedRow?.[fieldName]);
            if (updatedRow && resolvedFromDb === expectedPhotoValue) {
              savedInDatabase = true;
              savedPhotoField = fieldName;
              break;
            }

            blockedByPolicy = true;
            continue;
          }

          if (!isMissingPlayerStatsColumnError(dbError, fieldName)) {
            addLog(`⚠️ Profielfoto cloud-opslag mislukt: ${dbError.message}`, 'error');
            break;
          }
        }
      }
    } catch (_error) {
      // Fallback naar localStorage als databaseveld (nog) niet beschikbaar is.
    }

    try {
      const key = getProfilePhotoStorageKey(user.id);
      if (normalized) {
        window.localStorage.setItem(key, normalized);
      } else {
        window.localStorage.removeItem(key);
      }
    } catch (_error) {
      // Lokale opslag kan falen in private mode; UI blijft wel werken in-memory.
    }

    setStats((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      const dynamicFields = Object.keys(next).filter((field) => PHOTO_FIELD_NAME_PATTERN.test(field));
      const fieldsToOverwrite = Array.from(new Set([...PROFILE_PHOTO_FIELD_CANDIDATES, ...dynamicFields]));

      fieldsToOverwrite.forEach((field) => {
        if (!Object.prototype.hasOwnProperty.call(next, field)) return;
        next[field] = normalized || null;
      });

      if (savedPhotoField && !Object.prototype.hasOwnProperty.call(next, savedPhotoField)) {
        next[savedPhotoField] = normalized || null;
      }
      return next;
    });
    setProfilePhotoError('');
    setProfilePhotoDraft(normalized);
    setOnlineMembers((prev) => prev.map((member) => {
      if (!member || member.id !== user.id) return member;
      const nextMember = { ...member };
      const dynamicFields = Object.keys(nextMember).filter((field) => PHOTO_FIELD_NAME_PATTERN.test(field));
      const fieldsToOverwrite = Array.from(new Set([...PROFILE_PHOTO_FIELD_CANDIDATES, ...dynamicFields]));

      fieldsToOverwrite.forEach((field) => {
        if (!Object.prototype.hasOwnProperty.call(nextMember, field)) return;
        nextMember[field] = normalized || null;
      });

      if (savedPhotoField && !Object.prototype.hasOwnProperty.call(nextMember, savedPhotoField)) {
        nextMember[savedPhotoField] = normalized || null;
      }

      return nextMember;
    }));

    setSelectedMemberProfile((prev) => {
      if (!prev || prev.id !== user.id) return prev;
      const next = { ...prev };
      const dynamicFields = Object.keys(next).filter((field) => PHOTO_FIELD_NAME_PATTERN.test(field));
      const fieldsToOverwrite = Array.from(new Set([...PROFILE_PHOTO_FIELD_CANDIDATES, ...dynamicFields]));

      fieldsToOverwrite.forEach((field) => {
        if (!Object.prototype.hasOwnProperty.call(next, field)) return;
        next[field] = normalized || null;
      });

      if (savedPhotoField && !Object.prototype.hasOwnProperty.call(next, savedPhotoField)) {
        next[savedPhotoField] = normalized || null;
      }

      return next;
    });

    if (savedInDatabase) {
      if (savedPhotoField) {
        addLog(`✅ Profielfoto opgeslagen in kolom: ${savedPhotoField}`, 'success');
      }
      showActionNotice('Profielfoto opgeslagen en gesynchroniseerd.', 'success');
    } else {
      if (blockedByPolicy) {
        addLog('⚠️ Profielfoto kon niet naar cloud worden geschreven (mogelijk RLS/policy blokkade).', 'error');
        setProfilePhotoError('Cloud-opslag geblokkeerd. Controleer Supabase update policy voor player_stats.');
      }
      showActionNotice('Profielfoto lokaal opgeslagen op dit apparaat.', 'info');
    }
  };

  const saveUsernameChange = async () => {
    if (!user || !stats) return;

    const normalizedUsername = String(usernameDraft || '').trim();
    if (!normalizedUsername) {
      const message = 'Vul een gebruikersnaam in.';
      setUsernameChangeError(message);
      return;
    }

    if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
      const message = 'Gebruikersnaam moet tussen 3 en 20 tekens zijn.';
      setUsernameChangeError(message);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      const message = 'Gebruik alleen letters, cijfers en underscore (_).';
      setUsernameChangeError(message);
      return;
    }

    const currentUsername = String(stats.username || '').trim();
    if (normalizedUsername.toLowerCase() === currentUsername.toLowerCase()) {
      showActionNotice('Je gebruikt al deze gebruikersnaam.', 'info');
      return;
    }

    setUsernameChangeLoading(true);
    try {
      const { data: existingUsers, error: checkError } = await supabase
        .from('player_stats')
        .select('id')
        .ilike('username', normalizedUsername)
        .neq('id', user.id)
        .limit(1);

      if (checkError) {
        throw new Error('Kon gebruikersnaam niet controleren. Probeer opnieuw.');
      }

      if (existingUsers && existingUsers.length > 0) {
        throw new Error('Deze gebruikersnaam is al in gebruik.');
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('player_stats')
        .update({ username: normalizedUsername })
        .eq('id', user.id)
        .select('*')
        .maybeSingle();

      if (updateError) throw updateError;
      if (!updatedUser) throw new Error('Kon je gebruikersnaam niet opslaan.');

      setStats(updatedUser);
      setUsernameDraft(updatedUser.username || normalizedUsername);
      setLoginUsername(updatedUser.username || normalizedUsername);
      setUsernameChangeError('');

      try {
        await supabase.auth.updateUser({
          data: {
            username: normalizedUsername,
            display_name: normalizedUsername,
            full_name: normalizedUsername
          }
        });
      } catch (_error) {
        // Niet blokkerend: login werkt op player_stats gebruikersnaam.
      }

      showActionNotice('Gebruikersnaam succesvol gewijzigd.', 'success');
      addLog(`👤 Gebruikersnaam gewijzigd naar ${formatDisplayUsername(normalizedUsername)}.`, 'success');
    } catch (error) {
      const message = error?.message || 'Gebruikersnaam wijzigen mislukt.';
      setUsernameChangeError(message);
      showActionNotice(message, 'error');
      addLog(`❌ ${message}`, 'error');
    } finally {
      setUsernameChangeLoading(false);
    }
  };

  // Formula-based offline recovery (+1 Energy/min, +0.2 Nerve/min)
  const calculateOfflineRecovery = async (currentStats) => {
    const lastUpdated = new Date(currentStats.last_updated).getTime();
    const now = Date.now();
    const elapsedMinutes = Math.floor((now - lastUpdated) / 60000);

    if (elapsedMinutes > 0) {
      const energyRecovery = elapsedMinutes * 1;
      const nerveRecovery = Math.floor(elapsedMinutes * 0.2);

      const updatedEnergy = Math.min(currentStats.max_energy, currentStats.energy + energyRecovery);
      const updatedNerve = Math.min(currentStats.max_nerve, currentStats.nerve + nerveRecovery);

      const { data, error } = await supabase
        .from('player_stats')
        .update({
          energy: updatedEnergy,
          nerve: updatedNerve,
          last_updated: new Date().toISOString()
        })
        .eq('id', currentStats.id)
        .select()
        .single();

      if (!error && data) {
        setStats(data);
        if (energyRecovery > 0 || nerveRecovery > 0) {
          addLog(`⏱️ Je bent ${elapsedMinutes} minuten offline geweest!`, 'info');
          addLog(`⚡ Hersteld: +${updatedEnergy - currentStats.energy} Energie, +${updatedNerve - currentStats.nerve} Nerve.`, 'success');
        }
      }
    } else {
      setStats(currentStats);
    }
  };

  // Sync current state to Supabase on actions
  const updateDB = async (updatedFields) => {
    if (!user?.id) {
      addLog('🚨 Synchronisatie overgeslagen: geen actieve sessie.', 'error');
      return false;
    }

    const clampInt = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return min;
      const rounded = Math.round(parsed);
      return Math.max(min, Math.min(max, rounded));
    };

    const payload = {
      ...updatedFields,
      last_updated: new Date().toISOString()
    };

    // Bescherm tegen out-of-range/float issues op integer kolommen.
    if (Object.prototype.hasOwnProperty.call(payload, 'cash')) {
      payload.cash = clampInt(payload.cash, 0, CASH_INTEGER_MAX);
    }

    ['energy', 'max_energy', 'nerve', 'max_nerve', 'xp', 'level', 'strength', 'life', 'max_life', 'hp', 'max_hp']
      .forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(payload, key)) return;
        payload[key] = clampInt(payload[key], 0);
      });

    setStats(prev => ({ ...prev, ...payload }));

    const runCloudUpdate = async () => {
      return supabase
        .from('player_stats')
        .update(payload)
        .eq('id', user.id);
    };

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const { error } = await runCloudUpdate();

        if (!error) {
          return true;
        }

        if (attempt === 1 && isLikelyNetworkFetchError(error)) {
          continue;
        }

        if (isLikelyNetworkFetchError(error)) {
          logCloudNetworkIssueThrottled();
          return false;
        }

        addLog(`🚨 Synchronisatie met cloud database mislukt: ${summarizeCloudError(error)}`, 'error');
        return false;
      } catch (err) {
        if (attempt === 1 && isLikelyNetworkFetchError(err)) {
          continue;
        }

        if (isLikelyNetworkFetchError(err)) {
          logCloudNetworkIssueThrottled();
          return false;
        }

        addLog(`🚨 Synchronisatie met cloud database mislukt: ${summarizeCloudError(err)}`, 'error');
        return false;
      }
    }

    logCloudNetworkIssueThrottled();
    return false;
  };

  // ==========================================
  // GAMEPLAY ACTIONS
  // ==========================================

  const handleTrain = () => {
    if (jailTime > 0) {
      const message = "❌ Je zit opgesloten! Je kunt nu niet trainen.";
      showActionNotice(message, 'error');
      return addLog(message, 'error');
    }
    if (stats.energy < 10) {
      const message = "❌ Te vermoeid! Je hebt minimaal 10 Energie nodig.";
      showActionNotice(message, 'error');
      return addLog(message, 'error');
    }

    const strengthGain = Math.floor(Math.random() * 3) + 1;
    const xpGain = 15;

    let newXp = stats.xp + xpGain;
    let newLevel = stats.level;
    let newMaxEnergy = stats.max_energy;
    let newMaxNerve = stats.max_nerve;
    const nextLevelXp = stats.level * 100;

    const newStats = {
      energy: stats.energy - 10,
      strength: stats.strength + strengthGain,
    };

    if (newXp >= nextLevelXp) {
      newLevel += 1;
      newXp = newXp - nextLevelXp;
      newMaxEnergy += 10;
      newMaxNerve += 2;
      newStats.energy = newMaxEnergy;
      newStats.nerve = newMaxNerve;
      const message = `🎉 LEVEL UP! Je bent nu Level ${newLevel}! Energie & Nerve hersteld.`;
      showActionNotice(message, 'success');
      addLog(message, 'levelup');
    } else {
      const message = `🏋️ Getraind in de lokale sportschool! Kracht +${strengthGain}, XP +${xpGain}`;
      showActionNotice(message, 'success');
      addLog(message, 'success');
    }

    newStats.xp = newXp;
    newStats.level = newLevel;
    newStats.max_energy = newMaxEnergy;
    newStats.max_nerve = newMaxNerve;

    updateDB(newStats);
  };

  const handlePickpocket = () => {
    if (jailTime > 0) {
      const message = "❌ Gevangenen kunnen geen misdaden plegen!";
      showActionNotice(message, 'error');
      return addLog(message, 'error');
    }
    if (stats.nerve < 4) {
      const message = "❌ Je hebt niet genoeg lef (Nerve). Wacht tot het herstelt.";
      showActionNotice(message, 'error');
      return addLog(message, 'error');
    }

    const success = Math.random() > 0.25; // 75% kans
    const newStats = { nerve: stats.nerve - 4 };

    if (success) {
      const cashLoot = Math.floor(Math.random() * 80) + 20;
      newStats.cash = stats.cash + cashLoot;
      newStats.xp = stats.xp + 10;
      const message = `👛 Succes! Je hebt een toerist gerold voor $${cashLoot}. +10 XP.`;
      showActionNotice(message, 'success');
      addLog(message, 'success');
    } else {
      const message = '👮 Mislukt! De toerist had je door en je moest met lege handen vluchten!';
      showActionNotice(message, 'error');
      addLog(message, 'error');
    }

    updateDB(newStats);
  };

  const handleHeist = () => {
    if (jailTime > 0) {
      const message = '❌ Je zit momenteel in een cel!';
      showActionNotice(message, 'error');
      return addLog(message, 'error');
    }
    if (stats.nerve < 12) {
      const message = '❌ Je hebt minimaal 12 Nerve nodig voor een bankoverval.';
      showActionNotice(message, 'error');
      return addLog(message, 'error');
    }

    const baseSuccess = 0.40;
    const strengthBonus = Math.min(0.20, stats.strength / 200);
    const success = Math.random() < (baseSuccess + strengthBonus);

    const newStats = { nerve: stats.nerve - 12 };

    if (success) {
      const heistLoot = Math.floor(Math.random() * 1500) + 500;
      newStats.cash = stats.cash + heistLoot;
      newStats.xp = stats.xp + 40;
      const message = `🏦 OVERVAL GESLAAGD! De lokale kluis leeggehaald voor $${heistLoot}! +40 XP.`;
      showActionNotice(message, 'success');
      addLog(message, 'success');
    } else {
      if (Math.random() > 0.5) {
        const jailUntil = new Date(Date.now() + 60 * 1000).toISOString();
        newStats.jail_until = jailUntil;
        const message = '🚨 COPS! De SWAT was te snel ter plaatse. 60 seconden gevangenisstraf.';
        showActionNotice(message, 'error');
        addLog(message, 'jail');
      } else {
        const message = '🏃 Alarm ging af! Je bent ternauwernood ontsnapt zonder buit.';
        showActionNotice(message, 'error');
        addLog(message, 'error');
      }
    }

    updateDB(newStats);
  };

  const handlePrisonBribe = async () => {
    if (jailTime <= 0) return addLog('✅ Je bent al vrij.', 'info');
    if (!stats) return;

    const bribeCost = calculatePrisonBribeCost(jailTime);
    const currentCash = stats.cash || 0;
    if (currentCash < bribeCost) {
      setPrisonActionWarning(`Te weinig cash voor vrijkopen. Nodig: $${bribeCost.toLocaleString()}.`);
      return addLog(`❌ Te weinig cash om je vrij te kopen. Nodig: $${bribeCost.toLocaleString()}.`, 'error');
    }

    setPrisonActionWarning('');
    await updateDB({ cash: currentCash - bribeCost });
    await updateDB({ jail_until: null });
    addLog(`💸 Je hebt een bewaker omgekocht voor $${bribeCost.toLocaleString()} en bent vrij.`, 'success');
  };

  const handlePrisonEscape = async () => {
    if (jailTime <= 0) return addLog('✅ Je bent al vrij.', 'info');
    if (!stats) return;

    const currentEnergy = stats.energy || 0;
    const currentNerve = stats.nerve || 0;

    if (currentNerve < PRISON_ESCAPE_NERVE_COST) {
      setPrisonActionWarning(`Te weinig lef voor uitbreken. Nodig: ${PRISON_ESCAPE_NERVE_COST} lef.`);
      return addLog(`❌ Te weinig lef voor een uitbraak. Minimaal ${PRISON_ESCAPE_NERVE_COST} lef nodig.`, 'error');
    }

    setPrisonActionWarning('');
    const escaped = Math.random() < PRISON_ESCAPE_SUCCESS_CHANCE;
    const baseFields = {
      energy: currentEnergy,
      nerve: Math.max(0, currentNerve - PRISON_ESCAPE_NERVE_COST)
    };

    if (escaped) {
      await updateDB(baseFields);
      await updateDB({ jail_until: null });
      addLog('🕳️ Uitbraak gelukt! Je bent ontsnapt uit de gevangenis.', 'success');
      return;
    }

    const extraSentence = Math.floor(Math.random() * 31) + 30;
    const currentJailUntil = stats.jail_until ? new Date(stats.jail_until).getTime() : Date.now();
    const nextJailUntil = new Date(currentJailUntil + extraSentence * 1000).toISOString();
    await updateDB({
      ...baseFields,
      jail_until: nextJailUntil,
      nerve: Math.max(0, currentNerve - PRISON_ESCAPE_NERVE_COST - 3)
    });
    addLog(`🚨 Uitbraak mislukt! Je straf is met ${extraSentence} seconden verlengd.`, 'jail');
  };

  const refreshPrisonMembers = async () => {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('player_stats')
      .select('id, username, level, jail_until')
      .gt('jail_until', nowIso)
      .order('jail_until', { ascending: false });

    if (error) throw error;
    setPrisonMembers(data || []);
  };

  const handleRescueBuyout = async (target) => {
    if (!stats || !user) return;
    const remaining = getRemainingJailSeconds(target.jail_until);
    if (remaining <= 0) return addLog('Deze speler is al vrij.', 'info');

    const cost = calculatePrisonBribeCost(remaining);
    const currentCash = stats.cash || 0;
    if (currentCash < cost) {
      return addLog(`❌ Te weinig cash om ${formatDisplayUsername(target.username)} vrij te kopen. Nodig: $${cost.toLocaleString()}.`, 'error');
    }

    try {
      setPrisonActionLoadingId(target.id);

      const { data, error } = await supabase.rpc('prison_help_player', {
        p_target_id: target.id,
        p_action: 'buyout'
      });

      if (!error) {
        const successMessage = data?.message || `🤝 Je hebt ${formatDisplayUsername(target.username)} vrijgekocht voor $${cost.toLocaleString()}.`;
        addLog(successMessage, 'success');
        await refreshPrisonMembers();
        await fetchPlayerStats(user);
        return;
      }

      if (!isMissingPrisonRpc(error)) {
        throw error;
      }

      // Fallback voor oude setup zonder prison_help_player RPC.
      await updateDB({ cash: currentCash - cost });

      const { data: releasedTarget, error: updateError } = await supabase
        .from('player_stats')
        .update({ jail_until: null })
        .eq('id', target.id)
        .select('id')
        .maybeSingle();

      if (updateError) {
        await updateDB({ cash: currentCash });
        throw updateError;
      }

      if (!releasedTarget) {
        await updateDB({ cash: currentCash });
        throw new Error('Vrijkoop geblokkeerd door RLS policy op player_stats.');
      }

      addLog(`🤝 Je hebt ${formatDisplayUsername(target.username)} vrijgekocht voor $${cost.toLocaleString()}.`, 'success');
      await refreshPrisonMembers();
    } catch (err) {
      addLog(`❌ Vrijkoop voor speler mislukt: ${err.message}`, 'error');
    } finally {
      setPrisonActionLoadingId(null);
    }
  };

  const handleRescueEscape = async (target) => {
    if (!stats || !user) return;
    const remaining = getRemainingJailSeconds(target.jail_until);
    if (remaining <= 0) return addLog('Deze speler is al vrij.', 'info');

    const currentNerve = stats.nerve || 0;
    if (currentNerve < PRISON_RESCUE_NERVE_COST) {
      return addLog(`❌ Je hebt minimaal ${PRISON_RESCUE_NERVE_COST} lef nodig om iemand te helpen ontsnappen.`, 'error');
    }

    try {
      setPrisonActionLoadingId(target.id);

      const { data, error } = await supabase.rpc('prison_help_player', {
        p_target_id: target.id,
        p_action: 'escape'
      });

      if (!error) {
        addLog(data?.message || `🕳️ Uitbraakhulp geprobeerd op ${formatDisplayUsername(target.username)}.`, data?.escaped ? 'success' : 'jail');
        await refreshPrisonMembers();
        await fetchPlayerStats(user);
        return;
      }

      if (!isMissingPrisonRpc(error)) {
        throw error;
      }

      // Fallback voor oude setup zonder prison_help_player RPC.
      const rescueChance = calculateRescueChance(remaining);
      const escaped = Math.random() < rescueChance;
      await updateDB({ nerve: Math.max(0, currentNerve - PRISON_RESCUE_NERVE_COST) });

      if (escaped) {
        const { data: releasedTarget, error: updateError } = await supabase
          .from('player_stats')
          .update({ jail_until: null })
          .eq('id', target.id)
          .select('id')
          .maybeSingle();

        if (updateError) {
          await updateDB({ nerve: currentNerve });
          throw updateError;
        }

        if (!releasedTarget) {
          await updateDB({ nerve: currentNerve });
          throw new Error('Uitbraakhulp geblokkeerd door RLS policy op player_stats.');
        }

        addLog(`🕳️ Uitbraakhulp gelukt! ${formatDisplayUsername(target.username)} is vrij.`, 'success');
      } else {
        const extraSeconds = Math.floor(Math.random() * 21) + 20;
        const targetBase = new Date(target.jail_until).getTime();
        const updatedJailUntil = new Date(targetBase + extraSeconds * 1000).toISOString();

        const { data: updatedTarget, error: updateError } = await supabase
          .from('player_stats')
          .update({ jail_until: updatedJailUntil })
          .eq('id', target.id)
          .select('id')
          .maybeSingle();

        if (updateError) {
          await updateDB({ nerve: currentNerve });
          throw updateError;
        }

        if (!updatedTarget) {
          await updateDB({ nerve: currentNerve });
          throw new Error('Uitbraakhulp geblokkeerd door RLS policy op player_stats.');
        }

        addLog(`🚨 Uitbraakhulp mislukt. Straf van ${formatDisplayUsername(target.username)} +${extraSeconds} sec.`, 'jail');
      }

      await refreshPrisonMembers();
    } catch (err) {
      addLog(`❌ Uitbraakhulp mislukt: ${err.message}`, 'error');
    } finally {
      setPrisonActionLoadingId(null);
    }
  };

  // ==========================================
  // AUTH OPERATIONS
  // ==========================================

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (isRegistering) {
      if (!email || !password || !username || !gender) return;
    } else {
      if (!loginUsername || !password) return;
    }

    setAuthLoading(true);

    try {
      if (isRegistering) {
        const normalizedUsername = username.trim();

        const { data: existingUsers, error: usernameCheckError } = await supabase
          .from('player_stats')
          .select('id')
          .ilike('username', normalizedUsername)
          .limit(1);

        if (usernameCheckError) {
          throw new Error('Kon gebruikersnaam niet controleren. Probeer het opnieuw.');
        }

        if (existingUsers && existingUsers.length > 0) {
          throw new Error('Deze gebruikersnaam bestaat al. Kies een andere.');
        }

        const { data: signUpData, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            ...(getEmailRedirectUrl() ? { emailRedirectTo: getEmailRedirectUrl() } : {}),
            data: {
              username: normalizedUsername,
              display_name: normalizedUsername,
              full_name: normalizedUsername,
              gender
            }
          }
        });

        if (error?.message?.toLowerCase().includes('already registered')) {
          throw new Error('Dit e-mailadres is al in gebruik.');
        }

        if (error) throw error;

        // Supabase kan bij duplicate email soms geen error geven maar wel een user zonder identities.
        if (signUpData?.user && Array.isArray(signUpData.user.identities) && signUpData.user.identities.length === 0) {
          throw new Error('Dit e-mailadres is al in gebruik.');
        }

        const needsEmailConfirmation = !signUpData?.session;

        if (needsEmailConfirmation) {
          addLog("✉️ Bevestig eerst je e-mailadres via de link in je inbox.", "info");
          setAuthSuccess('Account aangemaakt. Bevestig eerst je e-mailadres via de link in je inbox, daarna kun je inloggen.');
        } else {
          addLog("✅ Account aangemaakt! Je kunt nu inloggen.", "success");
          setAuthSuccess('Account aangemaakt. Je kunt nu inloggen met je gebruikersnaam en wachtwoord.');
        }

        setIsRegistering(false);
        setLoginUsername(normalizedUsername);
        setGender('');
        setPassword('');
      } else {
        const normalizedLoginUsername = loginUsername.trim();

        const resolveEmailByUsername = async (candidateUsername) => {
          const { data, error } = await supabase.rpc('login_met_gebruikersnaam', {
            p_username: candidateUsername,
            p_password: password
          });

          if (error || !data || data.error || !data.email) return null;
          return data.email;
        };

        // Probeer eerst direct met de ingevoerde gebruikersnaam.
        let loginEmail = await resolveEmailByUsername(normalizedLoginUsername);

        // Fallback: als nodig, haal case-insensitive de opgeslagen variant op en probeer opnieuw.
        if (!loginEmail) {
          const { data: matchedUser } = await supabase
            .from('player_stats')
            .select('username')
            .ilike('username', normalizedLoginUsername)
            .maybeSingle();

          if (matchedUser?.username && matchedUser.username !== normalizedLoginUsername) {
            loginEmail = await resolveEmailByUsername(matchedUser.username);
          }
        }

        if (!loginEmail) {
          throw new Error('Gebruikersnaam onbekend.');
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email: loginEmail,
          password 
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      const rawMessage = err?.message || 'Inloggen mislukt. Controleer je gebruikersnaam en wachtwoord.';
      const lowerMessage = rawMessage.toLowerCase();
      const emailNotConfirmed =
        lowerMessage.includes('email not confirmed') ||
        lowerMessage.includes('email_not_confirmed') ||
        lowerMessage.includes('confirm your email');

      const normalizedMessage = lowerMessage.includes('invalid login credentials')
        ? 'Gebruikersnaam of wachtwoord is onjuist.'
        : lowerMessage.includes('already registered')
          ? 'Dit e-mailadres is al in gebruik.'
          : lowerMessage.includes('email rate limit exceeded')
            ? 'Je hebt te vaak een bevestigingsmail aangevraagd. Wacht even en probeer het later opnieuw.'
          : emailNotConfirmed
            ? 'Bevestig eerst je e-mailadres via de link in je inbox.'
          : rawMessage;

      setAuthError(normalizedMessage);
      addLog(`❌ Fout: ${normalizedMessage}`, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setSelectedMemberProfile(null);
    setRankMenuOpenId(null);
    setCityMenuOpen(false);
    setCurrentView('game');
    supabase.auth.signOut();
  };

  const performAdminAction = async (member, action, payload = {}) => {
    if (!STAFF_ROLES.includes(userRole)) return;

    try {
      setAdminActionLoadingId(member.id);

      if (action === 'cash-adjust') {
        if (userRole !== 'admin' && userRole !== 'moderator') {
          throw new Error('Alleen admins en moderators mogen cash geven.');
        }

        const amount = parseAmountInput(payload.amount);
        if (amount <= 0) {
          throw new Error('Voer een geldig bedrag groter dan 0 in.');
        }
        if (amount > CASH_INTEGER_MAX) {
          throw new Error(`Bedrag te groot. Max per actie: $${CASH_INTEGER_MAX.toLocaleString()}.`);
        }

        const isAdd = payload.mode !== 'remove';
        const delta = isAdd ? amount : -amount;

        if (member.id === user?.id) {
          const currentCash = stats?.cash || 0;
          const nextCash = currentCash + delta;
          if (nextCash < 0) {
            throw new Error('Deze speler heeft niet genoeg cash om dit bedrag af te nemen.');
          }
          if (nextCash > CASH_INTEGER_MAX) {
            throw new Error(`Max cash bereikt. Huidige database limiet is $${CASH_INTEGER_MAX.toLocaleString()}.`);
          }

          await updateDB({ cash: nextCash });
          const message = isAdd
            ? `🛠️ Admin: ${formatDisplayUsername(member.username)} kreeg +$${amount.toLocaleString()}.`
            : `🛠️ Admin: $${amount.toLocaleString()} afgenomen van ${formatDisplayUsername(member.username)}.`;
          showAdminNotice(message, 'success');
          addLog(message, 'success');
          await refreshAdminMembers();
          return;
        }

        const rpcAction = `cash:${delta}`;
        const { error } = await supabase.rpc('admin_apply_action', {
          p_target_id: member.id,
          p_action: rpcAction
        });

        if (error) {
          const rpcMessage = (error.message || '').toLowerCase();
          const outOfRangeError =
            rpcMessage.includes('out of range') ||
            rpcMessage.includes('numeric field overflow') ||
            rpcMessage.includes('integer');

          if (outOfRangeError) {
            throw new Error(`Bedrag te groot voor cash kolom. Huidige limiet: $${CASH_INTEGER_MAX.toLocaleString()}.`);
          }

          const cashActionMissing =
            rpcMessage.includes('onbekende admin actie') ||
            (rpcMessage.includes('unknown') && rpcMessage.includes('cash')) ||
            (rpcMessage.includes('cash') && !rpcMessage.includes('function'));

          if (!cashActionMissing) {
            throw error;
          }

          const { data: targetData, error: targetReadError } = await supabase
            .from('player_stats')
            .select('cash')
            .eq('id', member.id)
            .maybeSingle();

          if (targetReadError || !targetData) {
            throw new Error('Cash aanpassen mislukt. Doelspeler niet gevonden of geen leesrechten.');
          }

          const nextCash = (targetData.cash || 0) + delta;
          if (nextCash < 0) {
            throw new Error('Deze speler heeft niet genoeg cash om dit bedrag af te nemen.');
          }
          if (nextCash > CASH_INTEGER_MAX) {
            throw new Error(`Bedrag te groot voor cash kolom. Huidige limiet: $${CASH_INTEGER_MAX.toLocaleString()}.`);
          }

          const { data: updatedRow, error: fallbackError } = await supabase
            .from('player_stats')
            .update({ cash: nextCash })
            .eq('id', member.id)
            .select('id')
            .maybeSingle();

          if (fallbackError) {
            const fallbackMessage = (fallbackError.message || '').toLowerCase();
            const fallbackOutOfRange =
              fallbackMessage.includes('out of range') ||
              fallbackMessage.includes('numeric field overflow') ||
              fallbackMessage.includes('integer');

            if (fallbackOutOfRange) {
              throw new Error(`Bedrag te groot voor cash kolom. Huidige limiet: $${CASH_INTEGER_MAX.toLocaleString()}.`);
            }

            throw new Error('Cash aanpassen geblokkeerd door RLS policy. Voeg cash support toe in admin_apply_action.');
          }

          if (!updatedRow) {
            throw new Error('Cash aanpassen geblokkeerd door RLS policy. Voeg cash support toe in admin_apply_action.');
          }
        }

        const message = isAdd
          ? `🛠️ Admin: ${formatDisplayUsername(member.username)} kreeg +$${amount.toLocaleString()}.`
          : `🛠️ Admin: $${amount.toLocaleString()} afgenomen van ${formatDisplayUsername(member.username)}.`;
        showAdminNotice(message, 'success');
        addLog(message, 'success');
      }

      if (action === 'recover') {
        if (!STAFF_ROLES.includes(userRole)) {
          throw new Error('Geen rechten voor herstelactie.');
        }

        if (member.id === user?.id) {
          await updateDB({
            energy: stats?.max_energy || stats?.energy || 100,
            nerve: stats?.max_nerve || stats?.nerve || 20
          });
          const message = `🛠️ Admin: ${formatDisplayUsername(member.username)} volledig hersteld.`;
          showAdminNotice(message, 'success');
          addLog(message, 'success');
          await refreshAdminMembers();
          return;
        }

        const { error } = await supabase.rpc('admin_apply_action', {
          p_target_id: member.id,
          p_action: 'recover'
        });
        if (error) throw error;
        const message = `🛠️ Admin: ${formatDisplayUsername(member.username)} volledig hersteld.`;
        showAdminNotice(message, 'success');
        addLog(message, 'success');
      }

      if (action === 'jail') {
        if (userRole !== 'admin' && userRole !== 'moderator') {
          throw new Error('Alleen admins en moderators mogen iemand opsluiten.');
        }

        if (member.id === user?.id) {
          const selfJailUntil = new Date(Date.now() + ADMIN_JAIL_SECONDS * 1000).toISOString();
          await updateDB({ jail_until: selfJailUntil });
          const message = `🚓 Admin: je zit ${ADMIN_JAIL_SECONDS} sec in de cel.`;
          showAdminNotice(message, 'success');
          addLog(message, 'jail');
          await refreshAdminMembers();
          return;
        }

        const { error } = await supabase.rpc('admin_apply_action', {
          p_target_id: member.id,
          p_action: `jail:${ADMIN_JAIL_SECONDS}`
        });

        if (error) {
          const rpcMessage = (error.message || '').toLowerCase();
          const jailActionMissing =
            rpcMessage.includes('onbekende admin actie') ||
            rpcMessage.includes('unknown') ||
            rpcMessage.includes('jail');

          if (jailActionMissing) {
            const jailUntil = new Date(Date.now() + ADMIN_JAIL_SECONDS * 1000).toISOString();
            const { data: fallbackUpdated, error: fallbackError } = await supabase
              .from('player_stats')
              .update({ jail_until: jailUntil })
              .eq('id', member.id)
              .select('id')
              .maybeSingle();

            if (fallbackError) {
              throw new Error('Jail actie mislukt. Voeg jail support toe in admin_apply_action of controleer RLS policies.');
            }

            if (!fallbackUpdated) {
              throw new Error('Jail actie geblokkeerd door RLS policy. Geef admins/moderators update-rechten op jail_until.');
            }
          } else if (rpcMessage.includes('function') && rpcMessage.includes('admin_apply_action')) {
            throw new Error("RPC 'admin_apply_action' ontbreekt. Voeg de SQL setup toe in Supabase SQL Editor.");
          } else {
            throw error;
          }
        }

        const { data: jailedTarget, error: verifyError } = await supabase
          .from('player_stats')
          .select('jail_until')
          .eq('id', member.id)
          .maybeSingle();

        if (verifyError) {
          throw new Error('Kon jail status niet verifiëren. Controleer RLS policies op player_stats.');
        }

        const remainingAfterAction = getRemainingJailSeconds(jailedTarget?.jail_until);
        if (remainingAfterAction <= 0) {
          throw new Error('Jail actie lijkt niet opgeslagen. Voeg jail support toe in admin_apply_action of controleer RLS update policy.');
        }

        const message = `🚓 Admin: ${formatDisplayUsername(member.username)} zit ${ADMIN_JAIL_SECONDS} sec in de cel.`;
        showAdminNotice(message, 'success');
        addLog(message, 'jail');
      }

      if (action.startsWith('set-role:')) {
        if (userRole !== 'admin') {
          throw new Error('Alleen admins mogen rollen wijzigen.');
        }

        if (member.id === user?.id) {
          throw new Error('Je kunt je eigen rank niet wijzigen.');
        }

        const nextRole = normalizeRole(action.replace('set-role:', ''));

        const { error } = await supabase.rpc('admin_apply_action', {
          p_target_id: member.id,
          p_action: `set-role:${nextRole}`
        });

        if (error) {
          const rpcMessage = (error.message || '').toLowerCase();
          if (rpcMessage.includes('function') && rpcMessage.includes('admin_apply_action')) {
            throw new Error("RPC 'admin_apply_action' ontbreekt. Voeg de SQL setup toe in Supabase SQL Editor.");
          }
          throw error;
        }

        const message = `🛠️ Rol aangepast: ${formatDisplayUsername(member.username)} is nu ${nextRole}.`;
        showAdminNotice(message, 'success');
        addLog(message, 'success');
        setRankMenuOpenId(null);
      }

      await refreshAdminMembers();
    } catch (err) {
      const message = `❌ Admin actie mislukt: ${err.message}`;
      showAdminNotice(message, 'error');
      addLog(message, 'error');
    } finally {
      setAdminActionLoadingId(null);
    }
  };

  const renderLiveChatWidget = () => {
    if (!user || typeof document === 'undefined') return null;

    return createPortal(
      <div
        style={{
          position: 'fixed',
          right: '16px',
          bottom: '16px',
          zIndex: 9999,
          width: 'min(420px, calc(100vw - 24px))',
          maxWidth: '420px'
        }}
      >
        {isChatWidgetOpen ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">💬 Live Chat</div>
              <button
                type="button"
                onClick={() => setIsChatWidgetOpen(false)}
                className="px-2 py-1 text-xs rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
                title="Chat inklappen"
              >
                -
              </button>
            </div>

            <div
              ref={chatScrollRef}
              onScroll={handleChatScroll}
              className="overflow-y-auto px-3 py-2.5"
              style={{
                backgroundColor: '#020917',
                maxHeight: `min(${Math.round(CHAT_MAX_VISIBLE_LINES * CHAT_FONT_SIZE_PX * CHAT_LINE_HEIGHT + 24)}px, calc(100vh - 220px))`
              }}
            >
              {chatLoading ? (
                <p className="text-sm text-slate-400">Chat laden...</p>
              ) : chatMessages.length === 0 ? (
                <p className="text-sm text-slate-400">Nog geen berichten. Start de chat!</p>
              ) : (
                chatMessages.map((message) => {
                  const ownMessage = isOwnChatMessage(message.username);
                  const displayName = formatDisplayUsername(message.username || 'Onbekend');
                  const normalizedName = (displayName || '').trim().toLowerCase();
                  const isSystemMessage = normalizedName === 'systeem' || normalizedName === 'system';
                  const chatRole = ownMessage
                    ? userRole
                    : (chatUserRoles[getChatUsernameKey(message.username)] || 'lid');
                  const nameClass = isSystemMessage ? 'text-emerald-400' : '';
                  const nameStyle = isSystemMessage ? undefined : roleNameColorStyle(chatRole);
                  const canOpenProfile = !isSystemMessage;
                  const canDeleteMessage = userRole === 'admin';

                  return (
                    <div
                      key={message.id}
                      className="flex items-start gap-2 mb-0.5 rounded px-1 py-0.5 transition"
                      style={{
                        width: '100%',
                        backgroundColor: chatDeleteHoverId === message.id ? 'rgba(127, 29, 29, 0.22)' : 'transparent',
                        outline: chatDeleteHoverId === message.id ? '1px solid rgba(248, 113, 113, 0.35)' : 'none'
                      }}
                    >
                      <div className="text-xs text-slate-100" style={{ lineHeight: 1.45, flex: '1 1 auto', minWidth: 0, display: 'flex', alignItems: 'flex-start' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'baseline', flexShrink: 0, whiteSpace: 'nowrap' }}>
                          <span
                            className="text-slate-500 mr-2 font-mono"
                            style={{ display: 'inline-block', width: '68px', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
                          >
                            [{formatChatTime(message.created_at)}]
                          </span>
                          {canOpenProfile ? (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                void handleOpenChatProfile(message.username);
                              }}
                              onKeyDown={(event) => {
                                if (event.key !== 'Enter' && event.key !== ' ') return;
                                event.preventDefault();
                                void handleOpenChatProfile(message.username);
                              }}
                              className={`${nameClass} font-semibold mr-2 cursor-pointer hover:underline focus:underline outline-none`}
                              style={{ ...nameStyle, whiteSpace: 'nowrap' }}
                              title={`Open profiel van ${displayName}`}
                            >
                              {displayName}:
                            </span>
                          ) : (
                            <span className={`${nameClass} font-semibold mr-2`} style={{ ...nameStyle, whiteSpace: 'nowrap' }}>{displayName}:</span>
                          )}
                        </div>

                        <span className="text-slate-100 break-words" style={{ flex: '1 1 auto', minWidth: 0 }}>
                          {message.content}
                        </span>
                      </div>

                      {canDeleteMessage && (
                        <button
                          type="button"
                          onClick={() => {
                            void handleDeleteChatMessage(message.id);
                          }}
                          onMouseEnter={() => setChatDeleteHoverId(message.id)}
                          onMouseLeave={() => setChatDeleteHoverId(null)}
                          onFocus={() => setChatDeleteHoverId(message.id)}
                          onBlur={() => setChatDeleteHoverId(null)}
                          disabled={chatDeletingId === message.id}
                          className="text-[10px] px-1.5 py-0.5 border border-red-800/60 text-red-300 rounded hover:bg-red-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition"
                          style={{ flexShrink: 0, alignSelf: 'flex-start' }}
                          title="Verwijder bericht"
                        >
                          {chatDeletingId === message.id ? '...' : 'X'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleSendChatMessage}
              className="border-t border-slate-800 overflow-hidden"
              style={{ display: 'grid', gridTemplateColumns: '1fr auto', width: '100%' }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatInputKeyDown}
                placeholder="Typ hier je bericht en druk Enter..."
                maxLength={280}
                className="min-w-0 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                style={{
                  backgroundColor: '#020917',
                  color: '#e5e7eb',
                  caretColor: '#e5e7eb'
                }}
              />
              <button
                type="submit"
                disabled={chatSending || !chatInput.trim()}
                className="whitespace-nowrap px-4 py-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition"
                style={{ backgroundColor: '#6ee7b7', color: '#0f172a', minWidth: '112px' }}
              >
                Verstuur
              </button>
            </form>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsChatWidgetOpen(true);
              setChatUnreadCount(0);
              shouldAutoScrollChatRef.current = true;
              requestAnimationFrame(() => {
                scrollChatToBottom();
              });
            }}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-sm font-semibold shadow-lg hover:bg-slate-800"
            style={{ marginLeft: 'auto', display: 'block', position: 'relative' }}
          >
            💬 Live Chat
            {chatUnreadCount > 0 && (
              <span
                className="rounded-full"
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#ef4444',
                  border: '1px solid rgba(255,255,255,0.45)',
                  boxShadow: '0 0 0 2px rgba(2, 9, 23, 0.9)'
                }}
                title="Nieuwe chatberichten"
              />
            )}
          </button>
        )}
      </div>,
      document.body
    );
  };

  const renderTopTabs = () => (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 grid grid-cols-7 gap-2 w-full relative" style={{ zIndex: 200 }}>
      {NAV_TABS.map((tab) => {
        if (tab !== 'stad') {
          return (
            <button
              key={tab}
              onClick={() => {
                setCityMenuOpen(false);
                if (tab === 'overzicht') {
                  setActiveTab('overzicht');
                  setCurrentView('game');
                  scrollDashboardToTop();
                  shouldAutoScrollChatRef.current = true;
                  forceChatBottomRef.current = true;
                  return;
                }
                setActiveTab(tab);
                setCurrentView(tab === 'misdaad' ? 'crime' : tab === 'sporten' ? 'sports' : 'game');
              }}
              className={`w-full px-3 py-1 rounded-lg text-base font-bold border transition ${
                activeTab === tab
                  ? 'bg-rose-600 text-white border-rose-500/20'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          );
        }

        return (
          <div key={tab} className="relative">
            <button
              onClick={() => setCityMenuOpen(prev => !prev)}
              className={`w-full px-3 py-1 rounded-lg text-base font-bold border transition ${
                activeTab === tab || currentView === 'prison'
                  ? 'bg-rose-600 text-white border-rose-500/20'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Stad
            </button>

            {cityMenuOpen && (
              <div className="rank-menu absolute top-full left-0 mt-2 min-w-32 z-20 shadow-xl" style={{ zIndex: 9999 }}>
                <button
                  onClick={() => {
                    setCityMenuOpen(false);
                    setActiveTab('stad');
                    setCurrentView('game');
                  }}
                  className="rank-menu-item"
                >
                  Stad
                </button>
                <button
                  onClick={() => {
                    setCityMenuOpen(false);
                    setActiveTab('stad');
                    setCurrentView('prison');
                  }}
                  className="rank-menu-item"
                >
                  Gevangenis
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderLeftUtilityMenu = () => {
    if (!user) return null;

    return (
      <aside className="left-utility-menu" aria-label="Snelle navigatie">
        <div className="left-utility-title">Algemeen</div>
        <button
          type="button"
          className="left-utility-item"
          onClick={() => {
            addLog('🆘 Helpdesk knop ingedrukt.');
            showActionNotice('Helpdesk geopend. Stel je vraag in de live chat.', 'info');
          }}
        >
          Helpdesk
        </button>
        <button
          type="button"
          className="left-utility-item"
          onClick={() => {
            setCityMenuOpen(false);
            setCurrentView('game');
            addLog('ℹ️ instellingen knop ingedrukt.');
          }}
        >
          Instellingen
        </button>
        <button
          type="button"
          className="left-utility-item"
          onClick={() => {
            setCityMenuOpen(false);
            setActiveTab('overzicht');
            setCurrentView('game');
            scrollDashboardToTop();
            addLog('ℹ️ Informatie knop ingedrukt.');
          }}
        >
          Informatie
        </button>
        <button
          type="button"
          className="left-utility-item"
          onClick={handleLogout}
        >
          Uitloggen
        </button>
      </aside>
    );
  };

  // Loader screen
  const canOpenStaffPanel = userRole === 'admin';
  const canManageRoles = userRole === 'admin';
  const canGiveCash = userRole === 'admin' || userRole === 'moderator';
  const canRecover = STAFF_ROLES.includes(userRole);
  const canJail = userRole === 'admin' || userRole === 'moderator';

  const roleLabel = (value) => {
    const role = normalizeRole(value);
    if (role === 'admin') return 'Admin';
    if (role === 'moderator') return 'Moderator';
    if (role === 'helper') return 'Helper';
    return 'Lid';
  };

  const roleColorClass = (value) => {
    const role = normalizeRole(value);
    if (role === 'admin') return 'text-rose-400 font-semibold';
    if (role === 'moderator') return 'text-amber-400 font-semibold';
    if (role === 'helper') return 'text-sky-400 font-semibold';
    return 'text-slate-500';
  };

  const roleNameColorClass = (value) => {
    const role = normalizeRole(value);
    if (role === 'admin') return 'text-rose-300';
    if (role === 'moderator') return 'text-amber-300';
    if (role === 'helper') return 'text-sky-300';
    return 'text-slate-200';
  };

  const roleNameColorStyle = (value) => {
    const role = normalizeRole(value);
    if (role === 'admin') return { color: '#c86f6f' };
    if (role === 'moderator') return { color: '#d4af37' };
    if (role === 'helper') return { color: '#5a93af' };
    return { color: '#89837a' };
  };

  const filteredAdminMembers = adminMembers.filter((member) => {
    const query = adminSearchTerm.trim().toLowerCase();
    if (!query) return true;

    const usernameValue = (member.username || '').toLowerCase();
    return usernameValue.includes(query);
  });

  const renderHeaderPlayerInfo = () => {
    if (!stats) return null;

    const energyCurrent = Number(stats?.energy) || 0;
    const energyMax = Number(stats?.max_energy) || 100;
    const nerveCurrent = Number(stats?.nerve) || 0;
    const nerveMax = Number(stats?.max_nerve) || 20;
    const lifeCurrent = Number(stats?.life ?? stats?.hp) || 100;
    const lifeMax = Number(stats?.max_life ?? stats?.max_hp) || 100;

    const energyPercent = Math.max(0, Math.min(100, (energyCurrent / energyMax) * 100));
    const nervePercent = Math.max(0, Math.min(100, (nerveCurrent / nerveMax) * 100));
    const lifePercent = Math.max(0, Math.min(100, (lifeCurrent / lifeMax) * 100));

    const energyTimerText = energyCurrent >= energyMax ? 'VOL' : formatCountdown(recoveryTimers.energy);
    const nerveTimerText = nerveCurrent >= nerveMax ? 'VOL' : formatCountdown(recoveryTimers.nerve);
    const profilePhoto = resolveProfilePhoto(stats, user?.id);
    const usernameLabel = stats?.username ? formatDisplayUsername(stats.username) : 'Onbekend';
    const usernameInitial = usernameLabel.charAt(0).toUpperCase() || '?';

    return (
      <div style={{ minWidth: '280px', maxWidth: '430px' }}>
        <div
          className="rounded-xl border p-3"
          style={{
            background: 'radial-gradient(circle at 88% 12%, rgba(244, 63, 94, 0.14) 0%, rgba(244, 63, 94, 0) 42%), linear-gradient(180deg, #0b0f16 0%, #070b12 100%)',
            borderColor: '#2a3342',
            boxShadow: '0 10px 24px rgba(2, 6, 23, 0.42), inset 0 1px rgba(255,255,255,0.03)'
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="rounded-xl border overflow-hidden flex-shrink-0"
              style={{ width: '80px', height: '80px', borderColor: '#475569', background: '#0b1220' }}
              title="Profielfoto"
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt={`Profiel van ${usernameLabel}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-base font-black text-slate-300">{usernameInitial}</div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-lg font-black leading-tight truncate" style={roleNameColorStyle(userRole)}>{usernameLabel}</p>
              <p className="text-xs mt-0.5 leading-tight text-slate-400">LVL {stats?.level || 1}</p>
              <p className="text-xs text-emerald-400 font-mono mt-0.5 leading-tight">${stats?.cash?.toLocaleString() || 0}</p>
            </div>
          </div>

          <div className="mt-2 px-2 pb-2" style={{ display: 'grid', gap: '4px' }}>
            <div>
              <div className="flex justify-between items-center text-xs uppercase tracking-wide text-slate-300 leading-tight">
                <span>Energy</span>
                <span className="font-mono text-slate-400 text-xs">{energyCurrent}/{energyMax} • {energyTimerText}</span>
              </div>
              <div className="w-full rounded-sm mt-0.5 overflow-hidden" style={{ height: '6px', background: '#111827', border: '1px solid #374151' }}>
                <div style={{ height: '100%', width: `${energyPercent}%`, background: 'linear-gradient(90deg, #facc15, #f97316)' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs uppercase tracking-wide text-slate-300 leading-tight">
                <span>Nerve</span>
                <span className="font-mono text-slate-400 text-xs">{nerveCurrent}/{nerveMax} • {nerveTimerText}</span>
              </div>
              <div className="w-full rounded-sm mt-0.5 overflow-hidden" style={{ height: '6px', background: '#111827', border: '1px solid #374151' }}>
                <div style={{ height: '100%', width: `${nervePercent}%`, background: 'linear-gradient(90deg, #fb7185, #ef4444)' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs uppercase tracking-wide text-slate-300 leading-tight">
                <span>Life</span>
                <span className="font-mono text-slate-400 text-xs">{lifeCurrent}/{lifeMax}</span>
              </div>
              <div className="w-full rounded-sm mt-0.5 overflow-hidden" style={{ height: '6px', background: '#111827', border: '1px solid #374151' }}>
                <div style={{ height: '100%', width: `${lifePercent}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (currentView !== 'prison' || !user) return;

    const fetchPrisonMembers = async () => {
      setPrisonLoading(true);
      try {
        await refreshPrisonMembers();
      } catch (_error) {
        setPrisonMembers([]);
        addLog('❌ Gevangenisleden laden mislukt.', 'error');
      } finally {
        setPrisonLoading(false);
      }
    };

    fetchPrisonMembers();
    const interval = setInterval(fetchPrisonMembers, 10000);
    return () => clearInterval(interval);
  }, [currentView, user]);

  useEffect(() => {
    if (!stats || !user) return;

    let isSyncing = false;

    const tickRecovery = async () => {
      const currentEnergy = Number(stats.energy) || 0;
      const maxEnergy = Number(stats.max_energy) || 100;
      const currentNerve = Number(stats.nerve) || 0;
      const maxNerve = Number(stats.max_nerve) || 20;

      const lastUpdatedMs = new Date(stats.last_updated || Date.now()).getTime();
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - lastUpdatedMs) / 1000));

      const energyAtCap = currentEnergy >= maxEnergy;
      const nerveAtCap = currentNerve >= maxNerve;

      const energyCountdown = energyAtCap
        ? null
        : ENERGY_RECOVERY_INTERVAL_SECONDS - (elapsedSeconds % ENERGY_RECOVERY_INTERVAL_SECONDS || ENERGY_RECOVERY_INTERVAL_SECONDS);

      const nerveCountdown = nerveAtCap
        ? null
        : NERVE_RECOVERY_INTERVAL_SECONDS - (elapsedSeconds % NERVE_RECOVERY_INTERVAL_SECONDS || NERVE_RECOVERY_INTERVAL_SECONDS);

      setRecoveryTimers({ energy: energyCountdown, nerve: nerveCountdown });

      if (isSyncing || (energyAtCap && nerveAtCap)) return;

      const energyGain = Math.floor(elapsedSeconds / ENERGY_RECOVERY_INTERVAL_SECONDS);
      const nerveGain = Math.floor(elapsedSeconds / NERVE_RECOVERY_INTERVAL_SECONDS);

      if (energyGain <= 0 && nerveGain <= 0) return;

      const nextEnergy = Math.min(maxEnergy, currentEnergy + energyGain);
      const nextNerve = Math.min(maxNerve, currentNerve + nerveGain);

      if (nextEnergy === currentEnergy && nextNerve === currentNerve) return;

      isSyncing = true;
      try {
        await updateDB({ energy: nextEnergy, nerve: nextNerve });
      } finally {
        isSyncing = false;
      }
    };

    void tickRecovery();
    const interval = setInterval(() => {
      void tickRecovery();
    }, 1000);

    return () => clearInterval(interval);
  }, [stats, user]);

  useEffect(() => {
    if (currentView !== 'prison' || jailTime <= 0) {
      setPrisonActionWarning('');
    }
  }, [currentView, jailTime]);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = setTimeout(() => setActionNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  useEffect(() => {
    if (!adminNotice) return;
    const timer = setTimeout(() => setAdminNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [adminNotice]);

  useEffect(() => {
    if (!user) return;

    didInitialChatScrollRef.current = false;
    shouldAutoScrollChatRef.current = true;
    scrollChatToBottom();

    void refreshChatMessages();

    const channel = supabase
      .channel('messages-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const incoming = payload.new;
          void ensureChatUserRole(incoming?.username);

          const incomingIsOwn = isOwnChatMessage(incoming?.username);
          if (!isChatWidgetOpenRef.current && !incomingIsOwn) {
            setChatUnreadCount((prev) => prev + 1);
          }

          const container = chatScrollRef.current;
          if (container) {
            const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
            shouldAutoScrollChatRef.current = distanceFromBottom <= 80;
          }

          setChatMessages((prev) => {
            if (prev.some((msg) => msg.id === incoming.id)) return prev;
            return [...prev, incoming].slice(-100);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          const deletedId = payload.old?.id;
          if (!deletedId) return;
          setChatMessages((prev) => prev.filter((message) => message.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentView]);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container || chatLoading) return;

    if (shouldAutoScrollChatRef.current) {
      scrollChatToBottom();
    }
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (currentView !== 'game' || activeTab !== 'overzicht') return;

    if (!forceChatBottomRef.current) return;
    if (chatLoading) return;

    const container = chatScrollRef.current;
    if (!container) return;

    shouldAutoScrollChatRef.current = true;
    const didReachBottom = scrollChatToBottom();
    if (didReachBottom && chatMessages.length > 0) {
      forceChatBottomRef.current = false;
    }
  }, [currentView, activeTab, chatLoading, chatMessages]);

  useEffect(() => {
    if (currentView !== 'game' || chatLoading || chatMessages.length === 0) return;
    if (didInitialChatScrollRef.current) return;

    scrollChatToBottom();
    shouldAutoScrollChatRef.current = true;
    didInitialChatScrollRef.current = true;
  }, [currentView, chatLoading, chatMessages.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Loader2 className="h-10 w-10 text-rose-500 animate-spin mb-4" />
        <p className="text-slate-400 font-mono text-xs">District Underworld opstarten...</p>
      </div>
    );
  }

  // Auth Screen (Login / Register)
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl"></div>

          <div className="flex flex-col items-center mb-8">
            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 mb-3">
              <Skull className="h-8 w-8 text-rose-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">District Underworld</h1>
            <p className="text-xs text-slate-400 mt-1">Bouw je eigen misdaadimperium op</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Gebruikersnaam</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="bijv. Capone_23" 
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setAuthError('');
                    }}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition"
                    required
                  />
                </div>
              </div>
            )}

            {isRegistering && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Gender</label>
                <div className="relative">
                  <select
                    value={gender}
                    onChange={(e) => {
                      setGender(e.target.value);
                      setAuthError('');
                    }}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-3 pr-4 text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition"
                    required
                  >
                    <option value="">Kies een optie</option>
                    <option value="man">Man</option>
                    <option value="vrouw">Vrouw</option>
                    <option value="anders">Anders</option>
                    <option value="liever-niet-zeggen">Liever niet zeggen</option>
                  </select>
                </div>
              </div>
            )}

            {isRegistering ? (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">E-mailadres</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input 
                    type="email" 
                    placeholder="jouw-email@syndicate.com" 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setAuthError('');
                    }}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Gebruikersnaam</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input 
                    type="text"
                    placeholder="bijv. Capone_23"
                    value={loginUsername}
                    onChange={(e) => {
                      setLoginUsername(e.target.value);
                      setAuthError('');
                    }}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Wachtwoord</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input 
                  type="password" 
                  placeholder="Wachtwoord" 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setAuthError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white py-2.5 rounded-xl font-semibold text-sm transition shadow-lg shadow-rose-950/20 flex justify-center items-center gap-2"
            >
              {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isRegistering ? "Karakter Aanmaken" : "Betreed Underworld"}
            </button>

              {!isRegistering && authSuccess && (
                <p className="text-xs text-emerald-400 bg-slate-950 border border-slate-800 rounded-xl p-3">
                  {authSuccess}
                </p>
              )}

              {authError && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl p-3">
                  {authError}
                </p>
              )}
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            {isRegistering ? (
              <p>Heb je al een syndicaat? <button onClick={() => { setIsRegistering(false); setAuthError(''); }} className="text-rose-400 font-medium hover:underline">Log In</button></p>
            ) : (
              <p>Eerste dag op straat? <button onClick={() => { setIsRegistering(true); setAuthSuccess(''); setAuthError(''); }} className="text-rose-400 font-medium hover:underline">Registreer hier</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'profile') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans app-with-left-utility">
        <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {renderHeaderPlayerInfo()}
          </div>
          <div className="flex items-center gap-2">
            {canOpenStaffPanel && (
              <button
                onClick={() => setCurrentView('admin')}
                className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
                title="Open admin functies"
              >
                Admin
              </button>
            )}
            <button
              onClick={() => setCurrentView('online-members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon online leden"
            >
              Online leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-2xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">👤 Mijn profiel</h3>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between border-b border-slate-800 pb-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-slate-700 overflow-hidden" style={{ width: '72px', height: '72px', background: '#0b1220' }}>
                    {resolveProfilePhoto(stats, user?.id) ? (
                      <img
                        src={resolveProfilePhoto(stats, user?.id)}
                        alt={`Profiel van ${stats?.username || 'speler'}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-black text-slate-300">
                        {(stats?.username ? formatDisplayUsername(stats.username) : 'O').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Profielfoto</p>
                    <p className="text-[11px] text-slate-500 mt-1">Gebruik een URL of upload direct een afbeelding.</p>
                  </div>
                </div>

                <div className="w-full sm:w-auto sm:min-w-[320px] space-y-2">
                  <input
                    type="url"
                    value={profilePhotoDraft}
                    onChange={(e) => {
                      setProfilePhotoDraft(e.target.value);
                      setProfilePhotoError('');
                    }}
                    placeholder="https://.../jouw-foto.jpg"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoFileChange}
                      className="block w-full text-[11px] text-slate-400 file:mr-2 file:rounded-md file:border file:border-slate-700 file:bg-slate-900 file:px-2 file:py-1 file:text-[11px] file:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProfilePhotoDraft('');
                        setProfilePhotoError('');
                        void saveProfilePhoto('');
                      }}
                      className="px-2 py-1 text-xs rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void saveProfilePhoto();
                      }}
                      className="px-2 py-1 text-xs rounded-md border border-emerald-700 text-emerald-300 hover:bg-emerald-950/30"
                    >
                      Opslaan
                    </button>
                  </div>
                  {profilePhotoError && <p className="text-[11px] text-red-300">{profilePhotoError}</p>}
                </div>
              </div>

              <div className="border-b border-slate-800 pb-4 mb-3">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Gebruikersnaam wijzigen</p>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input
                    type="text"
                    value={usernameDraft}
                    onChange={(e) => {
                      setUsernameDraft(e.target.value);
                      setUsernameChangeError('');
                    }}
                    maxLength={20}
                    placeholder="Nieuwe gebruikersnaam"
                    className="w-full sm:max-w-xs bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void saveUsernameChange();
                    }}
                    disabled={usernameChangeLoading || !usernameDraft.trim()}
                    className="px-3 py-2 text-xs rounded-md border border-rose-700 text-rose-300 hover:bg-rose-950/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {usernameChangeLoading ? 'Opslaan...' : 'Opslaan gebruikersnaam'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">3-20 tekens, alleen letters, cijfers en underscore (_).</p>
                {usernameChangeError && <p className="text-[11px] text-red-300 mt-1">{usernameChangeError}</p>}
              </div>

              <p className="text-slate-300"><span className="text-slate-500">Gebruikersnaam:</span> <span style={roleNameColorStyle(userRole)}>{stats?.username ? formatDisplayUsername(stats.username) : 'Onbekend'}</span></p>
              <p className="text-slate-300"><span className="text-slate-500">Rol:</span> <span className={roleColorClass(userRole)}>{roleLabel(userRole)}</span></p>
              <p className="text-slate-300"><span className="text-slate-500">E-mail:</span> {user?.email || email || 'Onbekend'}</p>
              <p className="text-slate-300"><span className="text-slate-500">Gender:</span> {formatGenderLabel(stats?.gender)}</p>
              <p className="text-slate-300"><span className="text-slate-500">Level:</span> {stats?.level || 1}</p>
            </div>
          </div>
        </main>
        {renderLeftUtilityMenu()}
        {renderLiveChatWidget()}
      </div>
    );
  }

  if (currentView === 'admin' && canOpenStaffPanel) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans app-with-left-utility">
        <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {renderHeaderPlayerInfo()}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('online-members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon online leden"
            >
              Online leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-4xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">🛠️ Spelerbeheer</h3>

            <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <input
                type="text"
                value={adminSearchTerm}
                onChange={(e) => setAdminSearchTerm(e.target.value)}
                placeholder="Zoek speler op gebruikersnaam..."
                className="w-full sm:max-w-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition"
              />
              <span className="text-xs text-slate-500">{filteredAdminMembers.length} resultaat{filteredAdminMembers.length === 1 ? '' : 'en'}</span>
            </div>

            {adminNotice && (
              <div className={`mb-4 rounded-xl border p-3 text-xs ${adminNotice.type === 'error' ? 'bg-red-950/30 border-red-800/40 text-red-200' : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'}`}>
                {adminNotice.text}
              </div>
            )}

            {adminLoading ? (
              <p className="text-xs text-slate-400">Spelers laden...</p>
            ) : filteredAdminMembers.length === 0 ? (
              <p className="text-xs text-slate-500">Geen spelers gevonden.</p>
            ) : (
              <div className="space-y-2.5">
                {filteredAdminMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`bg-slate-950 border border-slate-850 rounded-xl p-3 relative ${rankMenuOpenId === member.id ? 'z-20' : ''}`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div>
                        <p className="text-sm font-semibold" style={roleNameColorStyle(member.role)}>{formatDisplayUsername(member.username || 'Onbekend')}</p>
                        <p className="text-xs text-slate-400">
                          Level {member.level || 1} • ${member.cash?.toLocaleString() || 0}
                          {' • '}
                          <span className={roleColorClass(member.role)}>
                            {roleLabel(member.role)}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {canManageRoles && member.id !== user?.id && (
                          <div className="relative">
                            <button
                              onClick={() => setRankMenuOpenId(prev => prev === member.id ? null : member.id)}
                              className="staff-btn staff-btn-rank"
                            >
                              Verander rank
                            </button>

                            {rankMenuOpenId === member.id && (
                              <div className="rank-menu absolute right-0 top-full mt-2 min-w-32 z-20 shadow-xl">
                                <button
                                  onClick={() => performAdminAction(member, 'set-role:lid')}
                                  disabled={adminActionLoadingId === member.id || normalizeRole(member.role) === 'lid'}
                                  className="rank-menu-item"
                                >
                                  Lid
                                </button>
                                <button
                                  onClick={() => performAdminAction(member, 'set-role:helper')}
                                  disabled={adminActionLoadingId === member.id || normalizeRole(member.role) === 'helper'}
                                  className="rank-menu-item"
                                >
                                  Helper
                                </button>
                                <button
                                  onClick={() => performAdminAction(member, 'set-role:moderator')}
                                  disabled={adminActionLoadingId === member.id || normalizeRole(member.role) === 'moderator'}
                                  className="rank-menu-item"
                                >
                                  Moderator
                                </button>
                                <button
                                  onClick={() => performAdminAction(member, 'set-role:admin')}
                                  disabled={adminActionLoadingId === member.id || normalizeRole(member.role) === 'admin'}
                                  className="rank-menu-item"
                                >
                                  Admin
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={adminCashInputs[member.id] ?? '1.000'}
                            onChange={(e) => setAdminCashInputs((prev) => ({ ...prev, [member.id]: formatAmountWithDots(e.target.value) }))}
                            className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-rose-500 transition"
                            placeholder="Bedrag"
                          />
                          <button
                            onClick={() => performAdminAction(member, 'cash-adjust', { mode: 'add', amount: adminCashInputs[member.id] ?? '1.000' })}
                            disabled={adminActionLoadingId === member.id || !canGiveCash}
                            className="staff-btn staff-btn-cash"
                          >
                            Geef
                          </button>
                          <button
                            onClick={() => performAdminAction(member, 'cash-adjust', { mode: 'remove', amount: adminCashInputs[member.id] ?? '1.000' })}
                            disabled={adminActionLoadingId === member.id || !canGiveCash}
                            className="staff-btn staff-btn-rank"
                          >
                            Neem af
                          </button>
                        </div>
                        <button
                          onClick={() => performAdminAction(member, 'recover')}
                          disabled={adminActionLoadingId === member.id || !canRecover}
                          className="staff-btn staff-btn-recover"
                        >
                          Herstel
                        </button>
                        <button
                          onClick={() => performAdminAction(member, 'jail')}
                          disabled={adminActionLoadingId === member.id || !canJail}
                          className="staff-btn staff-btn-rank"
                        >
                          Cel 60s
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        {renderLeftUtilityMenu()}
        {renderLiveChatWidget()}
      </div>
    );
  }

  if (currentView === 'online-members') {
    const membersQuery = membersSearchTerm.trim().toLowerCase();
    const filteredMembers = onlineMembers.filter((member) => {
      if (!membersQuery) return true;
      const usernameValue = (member?.username || '').toLowerCase();
      return usernameValue.includes(membersQuery);
    });

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans app-with-left-utility">
        <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {renderHeaderPlayerInfo()}
          </div>
          <div className="flex items-center gap-2">
            {canOpenStaffPanel && (
              <button
                onClick={() => setCurrentView('admin')}
                className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
                title="Open admin functies"
              >
                Admin
              </button>
            )}
            <button
              onClick={() => setCurrentView('online-members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon online leden"
            >
              Online leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-3 gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">👥 Ledenlijst</h3>
              <span className="text-xs text-slate-500">{onlineMembers.length} spelers</span>
            </div>

            <div className="mb-3">
              <input
                type="text"
                value={membersSearchTerm}
                onChange={(e) => setMembersSearchTerm(e.target.value)}
                placeholder="Zoek speler op gebruikersnaam..."
                className="w-full sm:max-w-xs bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            {onlineLoading ? (
              <p className="text-xs text-slate-400">Ledenlijst laden...</p>
            ) : membersLoadError ? (
              <div className="text-xs rounded-lg border border-red-800/40 bg-red-950/20 text-red-200 px-3 py-2">
                {membersLoadError}
              </div>
            ) : onlineMembers.length === 0 ? (
              <p className="text-xs text-slate-500">Er zijn nog geen spelers gevonden.</p>
            ) : filteredMembers.length === 0 ? (
              <p className="text-xs text-slate-500">Geen spelers gevonden voor "{membersSearchTerm}".</p>
            ) : (
              <div className="space-y-2.5">
                {filteredMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={async () => {
                      try {
                        const { data: profileData } = await supabase
                          .from('player_stats')
                          .select('*')
                          .eq('id', member.id)
                          .maybeSingle();

                        setSelectedMemberProfile(profileData ? { ...profileData, role: normalizeRole(profileData?.role) } : member);
                      } catch (_error) {
                        setSelectedMemberProfile(member);
                      }

                      setCurrentView('member-profile');
                    }}
                    className="w-full text-left bg-slate-950 border border-slate-850 rounded-xl p-3 flex justify-between items-center hover:bg-slate-800 transition"
                    title="Open profiel"
                  >
                    <span className="text-sm font-semibold" style={roleNameColorStyle(member.role)}>{formatDisplayUsername(member.username || 'Onbekend')}</span>
                    <span className="text-xs text-slate-400 font-mono">
                      Level {member.level || 1}
                      {' • '}
                      <span className={roleColorClass(member.role)}>{roleLabel(member.role)}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
        {renderLeftUtilityMenu()}
        {renderLiveChatWidget()}
      </div>
    );
  }

  if (currentView === 'member-profile' && selectedMemberProfile) {
    const selectedMemberPhoto = resolveProfilePhoto(selectedMemberProfile, selectedMemberProfile?.id);
    const selectedMemberName = formatDisplayUsername(selectedMemberProfile.username || 'Onbekend');

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans app-with-left-utility">
        <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {renderHeaderPlayerInfo()}
          </div>
          <div className="flex items-center gap-2">
            {canOpenStaffPanel && (
              <button
                onClick={() => setCurrentView('admin')}
                className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
                title="Open admin functies"
              >
                Admin
              </button>
            )}
            <button
              onClick={() => setCurrentView('online-members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon online leden"
            >
              Online leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-2xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={roleNameColorStyle(selectedMemberProfile.role)}>👤 {selectedMemberName}</h3>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-3">
                <div className="rounded-xl border border-slate-700 overflow-hidden" style={{ width: '72px', height: '72px', background: '#0b1220' }}>
                  {selectedMemberPhoto ? (
                    <img
                      src={selectedMemberPhoto}
                      alt={`Profiel van ${selectedMemberName}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-slate-300">
                      {selectedMemberName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-slate-300"><span className="text-slate-500">Gebruikersnaam:</span> <span style={roleNameColorStyle(selectedMemberProfile.role)}>{selectedMemberName}</span></p>
              <p className="text-slate-300"><span className="text-slate-500">Rol:</span> <span className={roleColorClass(selectedMemberProfile.role)}>{roleLabel(selectedMemberProfile.role)}</span></p>
              <p className="text-slate-300"><span className="text-slate-500">Gender:</span> {formatGenderLabel(selectedMemberProfile.gender)}</p>
              <p className="text-slate-300"><span className="text-slate-500">Level:</span> {selectedMemberProfile.level || 1}</p>
            </div>
          </div>
        </main>
        {renderLeftUtilityMenu()}
        {renderLiveChatWidget()}
      </div>
    );
  }

  if (currentView === 'crime') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans app-with-left-utility">
        <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {renderHeaderPlayerInfo()}
          </div>
          <div className="flex items-center gap-2">
            {canOpenStaffPanel && (
              <button
                onClick={() => setCurrentView('admin')}
                className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
                title="Open admin functies"
              >
                Admin
              </button>
            )}
            <button
              onClick={() => setCurrentView('profile')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon mijn profiel"
            >
              Mijn profiel
            </button>
            <button
              onClick={() => setCurrentView('online-members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon online leden"
            >
              Online leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-3xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">💀 Misdaad operaties</h3>

            {actionNotice && (
              <div className={`mb-4 rounded-xl border p-3 text-xs ${actionNotice.type === 'error' ? 'bg-red-950/30 border-red-800/40 text-red-200' : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'}`}>
                {actionNotice.text}
              </div>
            )}

            {jailTime > 0 && (
              <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-4 mb-4">
                <p className="text-red-300 text-sm font-semibold">Je zit opgesloten.</p>
                <p className="text-red-200/80 text-xs mt-1">Nog {jailTime} seconden. Misdaden zijn tijdelijk geblokkeerd.</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handlePickpocket}
                disabled={jailTime > 0}
                className="w-full bg-slate-950 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3.5 rounded-xl border border-slate-800 flex justify-between items-center transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👛</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold">Toerist Rollen</p>
                    <p className="text-xs text-slate-400">75% kans op succes (Makkelijk)</p>
                  </div>
                </div>
                <span className="bg-purple-550/10 text-purple-400 text-[10px] font-bold px-2 py-1 rounded font-mono border border-purple-500/20">-4 Nerve</span>
              </button>

              <button
                onClick={handleHeist}
                disabled={jailTime > 0}
                className="w-full bg-slate-950 hover:bg-rose-950/20 hover:border-rose-900/40 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3.5 rounded-xl border border-slate-800 flex justify-between items-center transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏦</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-rose-300">Grote Kluis Overvallen</p>
                    <p className="text-xs text-slate-400">Hoog risico op arrestatie, gigantische buit</p>
                  </div>
                </div>
                <span className="bg-purple-550/10 text-purple-400 text-[10px] font-bold px-2 py-1 rounded font-mono border border-purple-500/20">-12 Nerve</span>
              </button>
            </div>
          </div>
        </main>
        {renderLeftUtilityMenu()}
        {renderLiveChatWidget()}
      </div>
    );
  }

  if (currentView === 'sports') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans app-with-left-utility">
        <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {renderHeaderPlayerInfo()}
          </div>
          <div className="flex items-center gap-2">
            {canOpenStaffPanel && (
              <button
                onClick={() => setCurrentView('admin')}
                className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
                title="Open admin functies"
              >
                Admin
              </button>
            )}
            <button
              onClick={() => setCurrentView('profile')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon mijn profiel"
            >
              Mijn profiel
            </button>
            <button
              onClick={() => setCurrentView('online-members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon online leden"
            >
              Online leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-3xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">🏋️ Sporten</h3>

            {actionNotice && (
              <div className={`mb-4 rounded-xl border p-3 text-xs ${actionNotice.type === 'error' ? 'bg-red-950/30 border-red-800/40 text-red-200' : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'}`}>
                {actionNotice.text}
              </div>
            )}

            {jailTime > 0 && (
              <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-4 mb-4">
                <p className="text-red-300 text-sm font-semibold">Je zit opgesloten.</p>
                <p className="text-red-200/80 text-xs mt-1">Nog {jailTime} seconden. Sporten is tijdelijk geblokkeerd.</p>
              </div>
            )}

            <button
              onClick={handleTrain}
              disabled={jailTime > 0}
              className="w-full bg-slate-950 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3.5 rounded-xl border border-slate-800 flex justify-between items-center transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏋️‍♂️</span>
                <div className="text-left">
                  <p className="text-sm font-semibold">Sportschool</p>
                  <p className="text-xs text-slate-400">Verhoog permanent je kracht</p>
                </div>
              </div>
              <span className="bg-amber-550/10 text-amber-400 text-[10px] font-bold px-2 py-1 rounded font-mono border border-amber-500/20">-10 Energie</span>
            </button>
          </div>
        </main>
        {renderLeftUtilityMenu()}
        {renderLiveChatWidget()}
      </div>
    );
  }

  if (currentView === 'prison') {
    const rescueTargets = prisonMembers.filter((member) => member.id !== user?.id && getRemainingJailSeconds(member.jail_until) > 0);

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans app-with-left-utility">
        <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {renderHeaderPlayerInfo()}
          </div>
          <div className="flex items-center gap-2">
            {canOpenStaffPanel && (
              <button
                onClick={() => setCurrentView('admin')}
                className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
                title="Open admin functies"
              >
                Admin
              </button>
            )}
            <button
              onClick={() => setCurrentView('profile')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon mijn profiel"
            >
              Mijn profiel
            </button>
            <button
              onClick={() => setCurrentView('online-members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon online leden"
            >
              Online leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-4xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">🔒 Celstatus</h3>

            {jailTime > 0 ? (
              <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-4">
                <p className="text-red-300 text-sm font-semibold">Je zit opgesloten.</p>
                <p className="text-red-200/80 text-xs mt-1">Nog {jailTime} seconden tot je vrijkomt.</p>
              </div>
            ) : (
              <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-xl p-4">
                <p className="text-emerald-300 text-sm font-semibold">Je bent vrij.</p>
                <p className="text-emerald-200/80 text-xs mt-1">Er is op dit moment geen actieve straf.</p>
              </div>
            )}

            {jailTime > 0 && prisonActionWarning && (
              <div className="mt-3 bg-amber-950/30 border border-amber-800/40 rounded-xl p-3">
                <p className="text-amber-300 text-xs font-semibold">Onvoldoende middelen</p>
                <p className="text-amber-200/90 text-xs mt-1">{prisonActionWarning}</p>
              </div>
            )}

            {jailTime > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <button
                  onClick={handlePrisonBribe}
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white p-3 rounded-xl border border-slate-800 text-left transition"
                >
                  <p className="text-sm font-semibold text-emerald-300">Vrijkopen</p>
                  <p className="text-xs text-slate-400 mt-1">Betaal ${calculatePrisonBribeCost(jailTime).toLocaleString()} op basis van je resterende straftijd.</p>
                </button>

                <button
                  onClick={handlePrisonEscape}
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white p-3 rounded-xl border border-slate-800 text-left transition"
                >
                  <p className="text-sm font-semibold text-rose-300">Uitbreken</p>
                  <p className="text-xs text-slate-400 mt-1">{Math.round(PRISON_ESCAPE_SUCCESS_CHANCE * 100)}% kans. Kost {PRISON_ESCAPE_NERVE_COST} lef.</p>
                </button>
              </div>
            )}

            <div className="mt-6 border-t border-slate-800 pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">🧍 Gevangenen helpen</h4>
                <span className="text-xs text-slate-500">{rescueTargets.length} opgesloten</span>
              </div>

              {prisonLoading ? (
                <p className="text-xs text-slate-400">Gevangenen laden...</p>
              ) : rescueTargets.length === 0 ? (
                <p className="text-xs text-slate-500">Niemand zit momenteel vast.</p>
              ) : (
                <div className="space-y-2.5">
                  {rescueTargets.map((member) => {
                    const remaining = getRemainingJailSeconds(member.jail_until);
                    const rescueCost = calculatePrisonBribeCost(remaining);
                    const rescueChance = Math.round(calculateRescueChance(remaining) * 100);

                    return (
                      <div key={member.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3">
                        <div className="flex flex-wrap justify-between items-center gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-200">{formatDisplayUsername(member.username || 'Onbekend')}</p>
                            <p className="text-xs text-slate-400">Level {member.level || 1} • Nog {remaining} sec vast</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRescueBuyout(member)}
                              disabled={prisonActionLoadingId === member.id || remaining <= 0}
                              className="px-2 py-1 rounded-lg text-xs border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Vrijkopen (${rescueCost.toLocaleString()})
                            </button>
                            <button
                              onClick={() => handleRescueEscape(member)}
                              disabled={prisonActionLoadingId === member.id || remaining <= 0}
                              className="px-2 py-1 rounded-lg text-xs border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Uitbreken ({rescueChance}%)
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
        {renderLeftUtilityMenu()}
        {renderLiveChatWidget()}
      </div>
    );
  }

  // Active Game Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans app-with-left-utility">
      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          {renderHeaderPlayerInfo()}
        </div>
        <div className="flex items-center gap-4">
            {canOpenStaffPanel && (
              <button
                onClick={() => setCurrentView('admin')}
                className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
                title="Open admin functies"
              >
                Admin
              </button>
            )}
          <button
            onClick={() => setCurrentView('profile')}
            className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
            title="Toon mijn profiel"
          >
            Mijn profiel
          </button>
          <button
            onClick={() => setCurrentView('online-members')}
            className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
            title="Toon online leden"
          >
            Online leden
          </button>
        </div>
      </header>

      {renderTopTabs()}

      {/* GAME SECTION */}
      <main ref={dashboardScrollRef} className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto">
        {/* STATS & ACTIONS (Left 5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">

          {/* STATS CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl"></div>

            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight" style={roleNameColorStyle(userRole)}>{stats?.username ? formatDisplayUsername(stats.username) : "Petty Criminal"}</h2>
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded font-mono block mt-1 w-fit">
                  Level {stats?.level || 1} • Kruimeldief
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  Gender: {formatGenderLabel(stats?.gender)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase tracking-wider block">Contant Geld</span>
                <span className="text-2xl font-extrabold text-emerald-400 flex items-center gap-1 justify-end font-mono">
                  <Coins className="h-5 w-5" /> ${stats?.cash?.toLocaleString() || 0}
                </span>
              </div>
            </div>

            {/* PROGRESS BARS */}
            <div className="space-y-4">
              {/* Energy */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" /> Energie
                  </span>
                  <span className="text-slate-200 font-mono">{stats?.energy || 0}/{stats?.max_energy || 100}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-850">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${((stats?.energy || 0) / (stats?.max_energy || 100)) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Nerve */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <Skull className="h-3.5 w-3.5 text-purple-500" /> Nerve (Lef)
                  </span>
                  <span className="text-slate-200 font-mono">{stats?.nerve || 0}/{stats?.max_nerve || 20}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-850">
                  <div 
                    className="bg-purple-500 h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${((stats?.nerve || 0) / (stats?.max_nerve || 20)) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats & XP Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/60 mt-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Fysieke Kracht</span>
                  <span className="text-base font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                    💪 {stats?.strength || 10}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block">Ervaring (XP)</span>
                  <span className="text-xs font-bold text-slate-300 font-mono block mt-1">
                    {stats?.xp || 0} / {(stats?.level || 1) * 100} XP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* JAIL BANNER */}
          {jailTime > 0 && (
            <div className="bg-red-950/40 border border-red-800/40 rounded-2xl p-4 flex items-center gap-4">
              <Clock className="h-8 w-8 text-red-500 animate-spin" />
              <div>
                <h4 className="text-red-400 font-bold">Je zit in de gevangenis!</h4>
                <p className="text-xs text-red-300/80">Straftijd over: {jailTime} seconden. Alle acties zijn gevangenis-gebonden.</p>
              </div>
            </div>
          )}

        </section>

        {/* GAME LOGS (Right 7 Cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-grow flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              📋 Activiteitenlogboek
            </h3>

            <div className="flex-grow bg-slate-950 rounded-xl p-4 font-mono text-xs border border-slate-850 overflow-y-auto max-h-[400px] lg:max-h-none space-y-2.5">
              {logs.length === 0 ? (
                <p className="text-slate-600 italic">Nog geen activiteiten gelogd. Start een operatie om het logboek op te bouwen.</p>
              ) : (
                logs.map((log, i) => (
                  <p 
                    key={i} 
                    className={`leading-relaxed ${
                      log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'jail' ? 'text-rose-500 font-bold' :
                      log.type === 'levelup' ? 'text-amber-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-600 mr-2">[{log.time}]</span>
                    {log.text}
                  </p>
                ))
              )}
            </div>
          </div>

        </section>
      </main>
      {renderLeftUtilityMenu()}
      {renderLiveChatWidget()}
    </div>
  );
}