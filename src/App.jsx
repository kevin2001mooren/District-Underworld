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
const DEFAULT_OTHER_PROFILE_PHOTO = '/default-other-profile.jpeg';

const getEmailRedirectUrl = () => {
  const host = window.location.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';
  return isLocalhost ? APP_PUBLIC_URL : `${window.location.origin}/`;
};
const ADMIN_EMAILS = ['kevin2001mooren@gmail.com'];
const HELPDESK_EMAIL = ADMIN_EMAILS[0] || 'support@district-underworld.invalid';
const HELPDESK_SUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${HELPDESK_EMAIL}`;
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
const MEMBER_ONLINE_WINDOW_SECONDS = 90;
const PRESENCE_HEARTBEAT_INTERVAL_MS = 45000;

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
  const [chatWidgetTab, setChatWidgetTab] = useState('live');
  const [isGlobalChatWindowOpen, setIsGlobalChatWindowOpen] = useState(true);
  const [isChatSettingsMenuOpen, setIsChatSettingsMenuOpen] = useState(false);
  const [chatWindowWidthPercent, setChatWindowWidthPercent] = useState(100);
  const [chatWindowHeightPercent, setChatWindowHeightPercent] = useState(100);
  const [chatUseBubbles, setChatUseBubbles] = useState(true);
  const [chatShowAvatars, setChatShowAvatars] = useState(true);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [privateContacts, setPrivateContacts] = useState([]);
  const [privateChatLoading, setPrivateChatLoading] = useState(false);
  const [privateChatError, setPrivateChatError] = useState('');
  const [isPrivateChatWindowOpen, setIsPrivateChatWindowOpen] = useState(false);
  const [isChatConversationsMenuOpen, setIsChatConversationsMenuOpen] = useState(false);
  const [openPrivateConversationKeys, setOpenPrivateConversationKeys] = useState([]);
  const [activePrivateConversationKey, setActivePrivateConversationKey] = useState('');
  const [privateConversationSearchTerm, setPrivateConversationSearchTerm] = useState('');
  const [privateChatInput, setPrivateChatInput] = useState('');
  const [privateChatSending, setPrivateChatSending] = useState(false);
  const [privateUnreadByConversation, setPrivateUnreadByConversation] = useState({});
  const [privateLastReadByConversation, setPrivateLastReadByConversation] = useState({});
  const [privateBlockedUserIds, setPrivateBlockedUserIds] = useState([]);
  const [privateHiddenConversationKeys, setPrivateHiddenConversationKeys] = useState([]);
  const [privateTypingByConversation, setPrivateTypingByConversation] = useState({});
  const [profilePhotoDraft, setProfilePhotoDraft] = useState('');
  const [profilePhotoError, setProfilePhotoError] = useState('');
  const [isProfilePhotoMenuOpen, setIsProfilePhotoMenuOpen] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState('');
  const [usernameChangeError, setUsernameChangeError] = useState('');
  const [usernameChangeLoading, setUsernameChangeLoading] = useState(false);
  const [helpdeskCategory, setHelpdeskCategory] = useState('algemeen');
  const [helpdeskSubject, setHelpdeskSubject] = useState('');
  const [helpdeskMessage, setHelpdeskMessage] = useState('');
  const [helpdeskSending, setHelpdeskSending] = useState(false);
  const [helpdeskLastSentKey, setHelpdeskLastSentKey] = useState('');
  const dashboardScrollRef = useRef(null);
  const chatScrollRef = useRef(null);
  const shouldAutoScrollChatRef = useRef(true);
  const didInitialChatScrollRef = useRef(false);
  const chatUserRolesRef = useRef({});
  const forceChatBottomRef = useRef(false);
  const isChatWidgetOpenRef = useRef(false);
  const lastCloudNetworkLogAtRef = useRef(0);
  const chatProfileRequestIdRef = useRef(0);
  const privateMessageIdsRef = useRef(new Set());
  const privateTypingChannelRef = useRef(null);
  const privateTypingTimeoutsRef = useRef({});
  const privateTypingSentAtRef = useRef({});
  const recoveryAnchorRef = useRef({
    userId: null,
    energyMs: Date.now(),
    nerveMs: Date.now(),
    lastEnergy: null,
    lastNerve: null,
    lastMaxEnergy: null,
    lastMaxNerve: null
  });

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
    addLog(` Synchronisatie met cloud database mislukt: netwerkfout (fetch)${offlineHint}.`, 'error');
  };

  const isMissingColumnError = (error, tableName, columnName) => {
    const message = String(error?.message || '').toLowerCase();
    const targetTable = String(tableName || '').toLowerCase();
    const targetColumn = String(columnName || '').toLowerCase();
    const missingColumnPattern =
      message.includes('does not exist') ||
      message.includes('could not find') ||
      (message.includes('schema cache') && message.includes('column'));

    return (
      missingColumnPattern &&
      message.includes(targetTable) &&
      message.includes(targetColumn)
    );
  };

  const isMissingPlayerStatsColumnError = (error, columnName) => {
    return isMissingColumnError(error, 'player_stats', columnName);
  };

  const isMissingTableError = (error, tableName) => {
    const message = String(error?.message || '').toLowerCase();
    const target = String(tableName || '').toLowerCase();
    return (
      message.includes('does not exist') &&
      (message.includes(`relation \"${target}\"`) || message.includes(target))
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
        addLog('Admin leden laden mislukt.', 'error');
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
    if (currentView !== 'members' || !user) return;

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
        addLog(` Ledenlijst laden mislukt: ${message}`, 'error');
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

  const formatLastSeenLabel = (value, member = null) => {
    if (member && isMemberOnline(member)) return 'Online';
    if (!value) return 'Onbekend';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return 'Onbekend';

    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    if (isToday) {
      return `Vandaag om ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleString([], {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isMemberOnline = (member, nowMs = Date.now()) => {
    const updatedAtValue = member?.last_updated;
    if (!updatedAtValue) return false;
    const updatedAtMs = new Date(updatedAtValue).getTime();
    if (!Number.isFinite(updatedAtMs)) return false;
    return nowMs - updatedAtMs <= MEMBER_ONLINE_WINDOW_SECONDS * 1000;
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
      if (genderValue === 'anders' || genderValue === 'other') return DEFAULT_OTHER_PROFILE_PHOTO;
      if (genderValue === 'liever-niet-zeggen' || genderValue === 'prefer-not-to-say') return DEFAULT_OTHER_PROFILE_PHOTO;
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

    if (genderValue === 'anders' || genderValue === 'other') {
      return DEFAULT_OTHER_PROFILE_PHOTO;
    }

    if (genderValue === 'liever-niet-zeggen' || genderValue === 'prefer-not-to-say') {
      return DEFAULT_OTHER_PROFILE_PHOTO;
    }
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

  const isOwnChatMessage = (message) => {
    const ownUserId = String(user?.id || '').trim();
    const messageUserId = String(message?.user_id || '').trim();

    if (ownUserId && messageUserId) {
      return ownUserId === messageUserId;
    }

    const own = (stats?.username || '').trim().toLowerCase();
    const incoming = (message?.username || '').trim().toLowerCase();
    return Boolean(own) && own === incoming;
  };

  const getChatUsernameKey = (value) => (value || '').trim().toLowerCase();

  const getPrivateConversationKey = (value) => String(value || '').trim();

  const isPrivateConversationHidden = (conversationKey) => {
    const key = getPrivateConversationKey(conversationKey);
    if (!key) return false;
    return privateHiddenConversationKeys.includes(key);
  };

  const isPrivateActorBlocked = (actorId) => {
    const key = String(actorId || '').trim();
    if (!key) return false;
    return privateBlockedUserIds.includes(key);
  };

  const getPrivateConversationFromMessage = (message, ownId) => {
    const senderId = String(message?.sender_id || '').trim();
    const recipientId = String(message?.recipient_id || '').trim();
    const isReceived = recipientId === ownId;
    const actorId = isReceived ? senderId : recipientId;
    const actorName = formatDisplayUsername(
      isReceived ? (message?.sender_username || 'Onbekend') : (message?.recipient_username || 'Onbekend')
    );
    return {
      key: getPrivateConversationKey(actorId),
      actorId,
      actorName,
      isReceived
    };
  };

  const buildPrivateConversationList = () => {
    const ownId = String(user?.id || '').trim();
    if (!ownId) return [];

    const map = new Map();
    (privateMessages || []).forEach((message) => {
      const conversation = getPrivateConversationFromMessage(message, ownId);
      if (!conversation.key) return;
      if (isPrivateConversationHidden(conversation.key)) return;
      const createdMs = new Date(message?.created_at || 0).getTime();
      const current = map.get(conversation.key);
      if (!current || createdMs > current.lastAt) {
        map.set(conversation.key, {
          key: conversation.key,
          actorId: conversation.actorId,
          actorName: conversation.actorName,
          lastAt: Number.isFinite(createdMs) ? createdMs : 0,
          lastText: String(message?.content || '').trim(),
          unread: Number(privateUnreadByConversation[conversation.key] || 0)
        });
      } else {
        map.set(conversation.key, {
          ...current,
          unread: Number(privateUnreadByConversation[conversation.key] || 0)
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.lastAt - a.lastAt);
  };

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

  useEffect(() => {
    if (!user?.id) {
      setPrivateMessages([]);
      setPrivateContacts([]);
      setOpenPrivateConversationKeys([]);
      setActivePrivateConversationKey('');
      setPrivateUnreadByConversation({});
      setPrivateLastReadByConversation({});
      setPrivateBlockedUserIds([]);
      setPrivateHiddenConversationKeys([]);
      setPrivateTypingByConversation({});
      setPrivateChatInput('');
      setPrivateChatError('');
      privateMessageIdsRef.current = new Set();
      privateTypingSentAtRef.current = {};
      return;
    }

    void refreshPrivateChatData();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const blockedRaw = localStorage.getItem(getPrivateBlockedStorageKey(user.id));
      const hiddenRaw = localStorage.getItem(getPrivateHiddenStorageKey(user.id));
      const tabsRaw = localStorage.getItem(getPrivateOpenTabsStorageKey(user.id));
      const activeRaw = localStorage.getItem(getPrivateActiveTabStorageKey(user.id));
      const windowRaw = localStorage.getItem(getPrivateWindowOpenStorageKey(user.id));
      const blockedParsed = blockedRaw ? JSON.parse(blockedRaw) : [];
      const hiddenParsed = hiddenRaw ? JSON.parse(hiddenRaw) : [];
      const tabsParsed = tabsRaw ? JSON.parse(tabsRaw) : [];
      const normalizedTabs = normalizeIdList(Array.isArray(tabsParsed) ? tabsParsed : []).slice(-6);
      const normalizedActive = getPrivateConversationKey(activeRaw);
      const restoredActive = normalizedActive || normalizedTabs[normalizedTabs.length - 1] || '';
      const restoredTabs = restoredActive
        ? Array.from(new Set([...normalizedTabs.filter((entry) => entry !== restoredActive), restoredActive])).slice(-6)
        : normalizedTabs;

      setPrivateBlockedUserIds(normalizeIdList(Array.isArray(blockedParsed) ? blockedParsed : []));
      setPrivateHiddenConversationKeys(normalizeIdList(Array.isArray(hiddenParsed) ? hiddenParsed : []));
      setOpenPrivateConversationKeys(restoredTabs);
      setActivePrivateConversationKey(restoredActive);
      setIsPrivateChatWindowOpen(windowRaw === '1' && Boolean(restoredActive));
    } catch (_error) {
      setPrivateBlockedUserIds([]);
      setPrivateHiddenConversationKeys([]);
      setOpenPrivateConversationKeys([]);
      setActivePrivateConversationKey('');
      setIsPrivateChatWindowOpen(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const blocked = normalizeIdList(privateBlockedUserIds);
      if (blocked.length === 0) {
        localStorage.removeItem(getPrivateBlockedStorageKey(user.id));
      } else {
        localStorage.setItem(getPrivateBlockedStorageKey(user.id), JSON.stringify(blocked));
      }
    } catch (_error) {
      // Ignore local storage failures.
    }
  }, [user?.id, privateBlockedUserIds, privateHiddenConversationKeys, isPrivateChatWindowOpen, activePrivateConversationKey]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const hidden = normalizeIdList(privateHiddenConversationKeys);
      if (hidden.length === 0) {
        localStorage.removeItem(getPrivateHiddenStorageKey(user.id));
      } else {
        localStorage.setItem(getPrivateHiddenStorageKey(user.id), JSON.stringify(hidden));
      }
    } catch (_error) {
      // Ignore local storage failures.
    }
  }, [user?.id, privateHiddenConversationKeys]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const tabs = normalizeIdList(openPrivateConversationKeys).slice(-6);
      if (tabs.length === 0) {
        localStorage.removeItem(getPrivateOpenTabsStorageKey(user.id));
      } else {
        localStorage.setItem(getPrivateOpenTabsStorageKey(user.id), JSON.stringify(tabs));
      }

      const active = getPrivateConversationKey(activePrivateConversationKey);
      if (!active) {
        localStorage.removeItem(getPrivateActiveTabStorageKey(user.id));
      } else {
        localStorage.setItem(getPrivateActiveTabStorageKey(user.id), active);
      }

      const shouldShowPrivateWindow = isPrivateChatWindowOpen && Boolean(active);
      if (!shouldShowPrivateWindow) {
        localStorage.removeItem(getPrivateWindowOpenStorageKey(user.id));
      } else {
        localStorage.setItem(getPrivateWindowOpenStorageKey(user.id), '1');
      }
    } catch (_error) {
      // Ignore local storage failures.
    }
  }, [user?.id, openPrivateConversationKeys, activePrivateConversationKey, isPrivateChatWindowOpen]);

  useEffect(() => {
    if (!user?.id) return;

    const ownId = String(user.id);
    const channel = supabase
      .channel('private-direct-live')
      .on('broadcast', { event: 'private-message' }, ({ payload }) => {
        const senderId = String(payload?.senderId || '').trim();
        const recipientId = String(payload?.recipientId || '').trim();
        const messageId = String(payload?.id || '').trim() || `broadcast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        if (!senderId || !recipientId) return;

        const isParticipant = senderId === ownId || recipientId === ownId;
        if (!isParticipant) return;
        if (privateMessageIdsRef.current.has(messageId)) return;
        if (recipientId === ownId && isPrivateActorBlocked(senderId)) return;

        const createdAt = payload?.createdAt || new Date().toISOString();
        const incomingMessage = {
          id: messageId,
          sender_id: senderId,
          sender_username: payload?.senderUsername || 'Onbekend',
          recipient_id: recipientId,
          recipient_username: payload?.recipientUsername || 'Onbekend',
          content: String(payload?.content || ''),
          created_at: createdAt
        };

        const conversationKey = getPrivateConversationKey(recipientId === ownId ? senderId : recipientId);
        if (conversationKey && privateHiddenConversationKeys.includes(conversationKey)) {
          setPrivateHiddenConversationKeys((prev) => prev.filter((entry) => entry !== conversationKey));
        }

        privateMessageIdsRef.current.add(messageId);
        setPrivateMessages((prev) => {
          if (prev.some((entry) => String(entry?.id || '').trim() === messageId)) return prev;
          return [...prev, incomingMessage].slice(-300);
        });

        const senderName = formatDisplayUsername(payload?.senderUsername || 'Onbekend');
        if (senderId && senderId !== ownId) {
          setPrivateContacts((prev) => {
            if (prev.some((entry) => String(entry?.id || '').trim() === senderId)) return prev;
            return [...prev, { id: senderId, username: senderName, role: 'lid' }];
          });
        }

        const isIncoming = recipientId === ownId && senderId !== ownId;
        const incomingConversationKey = getPrivateConversationKey(senderId);
        const isOpenAndActive = isPrivateChatWindowOpen && activePrivateConversationKey === incomingConversationKey;
        if (!isIncoming || !incomingConversationKey || isOpenAndActive) return;

        setPrivateUnreadByConversation((prev) => ({
          ...prev,
          [incomingConversationKey]: (Number(prev[incomingConversationKey]) || 0) + 1
        }));
      })
      .on('broadcast', { event: 'private-typing' }, ({ payload }) => {
        const senderId = String(payload?.senderId || '').trim();
        const recipientId = String(payload?.recipientId || '').trim();
        const conversationKey = getPrivateConversationKey(payload?.conversationKey || senderId);
        const senderName = formatDisplayUsername(payload?.senderName || 'Speler');
        if (!senderId || senderId === ownId) return;
        if (recipientId !== ownId) return;
        if (!conversationKey) return;
        if (isPrivateActorBlocked(senderId)) return;

        setPrivateTypingByConversation((prev) => ({ ...prev, [conversationKey]: senderName }));
        const existingTimeout = privateTypingTimeoutsRef.current[conversationKey];
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        privateTypingTimeoutsRef.current[conversationKey] = setTimeout(() => {
          setPrivateTypingByConversation((prev) => {
            const next = { ...prev };
            delete next[conversationKey];
            return next;
          });
          delete privateTypingTimeoutsRef.current[conversationKey];
        }, 2200);
      })
      .subscribe();

    privateTypingChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      privateTypingChannelRef.current = null;
      Object.values(privateTypingTimeoutsRef.current).forEach((timeoutHandle) => clearTimeout(timeoutHandle));
      privateTypingTimeoutsRef.current = {};
      setPrivateTypingByConversation({});
    };
  }, [user?.id, privateBlockedUserIds, privateHiddenConversationKeys, isPrivateChatWindowOpen, activePrivateConversationKey]);

  useEffect(() => {
    if (!user?.id) return;

    const ownId = String(user.id);
    const channel = supabase
      .channel(`private-messages-live-${ownId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'private_messages' },
        (payload) => {
          const incoming = payload.new;
          const incomingId = String(incoming?.id || '').trim();
          if (!incomingId || privateMessageIdsRef.current.has(incomingId)) return;

          const senderId = String(incoming?.sender_id || '').trim();
          const recipientId = String(incoming?.recipient_id || '').trim();
          const isParticipant = senderId === ownId || recipientId === ownId;
          if (!isParticipant) return;

          const conversationKey = getPrivateConversationKey(recipientId === ownId ? senderId : recipientId);
          if (recipientId === ownId && isPrivateActorBlocked(senderId)) {
            return;
          }

          if (conversationKey && privateHiddenConversationKeys.includes(conversationKey)) {
            setPrivateHiddenConversationKeys((prev) => prev.filter((entry) => entry !== conversationKey));
          }

          privateMessageIdsRef.current.add(incomingId);
          setPrivateMessages((prev) => {
            if (prev.some((entry) => String(entry?.id || '').trim() === incomingId)) return prev;
            return [...prev, incoming].slice(-300);
          });

          if (senderId && senderId !== ownId) {
            setPrivateContacts((prev) => {
              if (prev.some((entry) => String(entry?.id || '').trim() === senderId)) return prev;
              return [...prev, { id: senderId, username: incoming?.sender_username || 'Onbekend', role: 'lid' }];
            });
          }

          const isIncoming = recipientId === ownId && senderId !== ownId;
          const incomingConversationKey = getPrivateConversationKey(senderId);
          const isOpenAndActive = isPrivateChatWindowOpen && activePrivateConversationKey === incomingConversationKey;
          if (!isIncoming || !incomingConversationKey || isOpenAndActive) return;

          setPrivateUnreadByConversation((prev) => ({
            ...prev,
            [incomingConversationKey]: (Number(prev[incomingConversationKey]) || 0) + 1
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isPrivateChatWindowOpen, activePrivateConversationKey, privateBlockedUserIds, privateHiddenConversationKeys]);

  useEffect(() => {
    if (!activePrivateConversationKey) return;
    if (!isPrivateChatWindowOpen) return;
    void persistPrivateConversationRead(activePrivateConversationKey);
  }, [activePrivateConversationKey, isPrivateChatWindowOpen, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (!activePrivateConversationKey || !isPrivateChatWindowOpen) return;

    const ownId = String(user.id || '').trim();
    const key = getPrivateConversationKey(activePrivateConversationKey);
    if (!key) return;

    const latestIncomingMessage = (privateMessages || []).slice().reverse().find((message) => {
      const senderId = String(message?.sender_id || '').trim();
      const recipientId = String(message?.recipient_id || '').trim();
      return recipientId === ownId && senderId === key;
    });

    if (!latestIncomingMessage?.created_at) return;

    const latestIncomingMs = new Date(latestIncomingMessage.created_at).getTime();
    const lastReadValue = String(privateLastReadByConversation[key] || '').trim();
    const lastReadMs = lastReadValue ? new Date(lastReadValue).getTime() : 0;
    const alreadyMarkedRead =
      Number.isFinite(latestIncomingMs) &&
      Number.isFinite(lastReadMs) &&
      latestIncomingMs <= lastReadMs;

    if (alreadyMarkedRead) return;

    void persistPrivateConversationRead(key, latestIncomingMessage.created_at);
  }, [
    user?.id,
    activePrivateConversationKey,
    isPrivateChatWindowOpen,
    privateMessages,
    privateLastReadByConversation
  ]);

  useEffect(() => {
    if (!user?.id) {
      setChatWindowWidthPercent(100);
      setChatWindowHeightPercent(100);
      setChatUseBubbles(true);
      setChatShowAvatars(true);
      return;
    }

    const storageKey = getChatSettingsStorageKey(user.id);
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      const widthValue = Number(parsed?.widthPercent);
      const heightValue = Number(parsed?.heightPercent);
      if (Number.isFinite(widthValue)) {
        setChatWindowWidthPercent(Math.min(130, Math.max(70, Math.round(widthValue))));
      }
      if (Number.isFinite(heightValue)) {
        setChatWindowHeightPercent(Math.min(130, Math.max(70, Math.round(heightValue))));
      }

      if (typeof parsed?.useBubbles === 'boolean') {
        setChatUseBubbles(parsed.useBubbles);
      }
      if (typeof parsed?.showAvatars === 'boolean') {
        setChatShowAvatars(parsed.showAvatars);
      }
    } catch (_error) {
      // Ignore corrupted local preferences and continue with defaults.
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const storageKey = getChatSettingsStorageKey(user.id);
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        widthPercent: chatWindowWidthPercent,
        heightPercent: chatWindowHeightPercent,
        useBubbles: chatUseBubbles,
        showAvatars: chatShowAvatars
      }));
    } catch (_error) {
      // Ignore storage write failures.
    }
  }, [user?.id, chatWindowWidthPercent, chatWindowHeightPercent, chatUseBubbles, chatShowAvatars]);

  useEffect(() => {
    if (!isChatSettingsMenuOpen) return;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-chat-popover]') || target.closest('[data-chat-popover-toggle]')) return;

      setIsChatSettingsMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setIsChatSettingsMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isChatSettingsMenuOpen]);

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
        .select('id, user_id, username, content, created_at')
        .order('created_at', { ascending: false })
        .limit(80);

      if (error) throw error;

      const sorted = [...(data || [])].reverse();
      void fetchRolesForChatUsernames(sorted.map((message) => message.username));
      shouldAutoScrollChatRef.current = true;
      setChatMessages(sorted);
    } catch (error) {
      addLog(` Chat laden mislukt: ${error.message}`, 'error');
    } finally {
      setChatLoading(false);
    }
  };

  const refreshPrivateChatData = async () => {
    if (!user?.id) return;
    setPrivateChatLoading(true);
    setPrivateChatError('');
    try {
      const [messagesResult, contactsResult, readsResult] = await Promise.all([
        supabase
          .from('private_messages')
          .select('id, sender_id, sender_username, recipient_id, recipient_username, content, created_at')
          .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(300),
        supabase
          .from('player_stats')
          .select('id, username, role')
          .neq('id', user.id)
          .order('username', { ascending: true })
          .limit(600),
        supabase
          .from('private_message_reads')
          .select('conversation_key, last_read_at')
          .eq('user_id', user.id)
      ]);

      if (messagesResult.error) throw messagesResult.error;
      if (contactsResult.error) throw contactsResult.error;
      if (readsResult.error && !isMissingTableError(readsResult.error, 'private_message_reads')) {
        throw readsResult.error;
      }

      const messages = (messagesResult.data || []).slice().reverse();
      const cachedReadsMap = readPrivateReadsCache(user.id);
      const readsMap = { ...cachedReadsMap };
      (readsResult.error ? [] : (readsResult.data || [])).forEach((entry) => {
        const key = getPrivateConversationKey(entry?.conversation_key);
        const lastReadAt = String(entry?.last_read_at || '').trim();
        if (!key || !lastReadAt) return;
        const cachedValue = String(readsMap[key] || '').trim();
        const cachedMs = cachedValue ? new Date(cachedValue).getTime() : 0;
        const dbMs = new Date(lastReadAt).getTime();
        if (!Number.isFinite(dbMs)) return;
        if (!Number.isFinite(cachedMs) || dbMs >= cachedMs) {
          readsMap[key] = lastReadAt;
        }
      });

      const ownId = String(user.id || '').trim();
      const unreadMap = {};
      messages.forEach((message) => {
        const senderId = String(message?.sender_id || '').trim();
        const recipientId = String(message?.recipient_id || '').trim();
        const isIncoming = recipientId === ownId && senderId !== ownId;
        if (!isIncoming) return;

        const conversationKey = getPrivateConversationKey(senderId);
        if (!conversationKey) return;
        if (isPrivateActorBlocked(senderId)) return;
        if (isPrivateConversationHidden(conversationKey)) return;

        const createdAtMs = new Date(message?.created_at || 0).getTime();
        const lastReadAt = String(readsMap[conversationKey] || '').trim();
        const lastReadMs = lastReadAt ? new Date(lastReadAt).getTime() : 0;
        const isRead =
          Number.isFinite(createdAtMs) &&
          Number.isFinite(lastReadMs) &&
          createdAtMs <= lastReadMs;

        if (!isRead) {
          unreadMap[conversationKey] = (Number(unreadMap[conversationKey]) || 0) + 1;
        }
      });

      setPrivateMessages(messages);
      setPrivateLastReadByConversation(readsMap);
      setPrivateUnreadByConversation(unreadMap);
      writePrivateReadsCache(user.id, readsMap);
      privateMessageIdsRef.current = new Set(messages.map((entry) => String(entry?.id || '').trim()).filter(Boolean));
      setPrivateContacts((contactsResult.data || []).map((entry) => ({
        ...entry,
        role: normalizeRole(entry?.role)
      })));
    } catch (error) {
      const text = String(error?.message || 'onbekende fout');
      setPrivateChatError(`Privechat laden mislukt: ${text}`);
    } finally {
      setPrivateChatLoading(false);
    }
  };

  const persistPrivateConversationRead = async (conversationKey, readAtValue = null) => {
    const key = getPrivateConversationKey(conversationKey);
    const ownId = String(user?.id || '').trim();
    if (!ownId || !key) return;

    const nextReadAt = String(readAtValue || new Date().toISOString()).trim() || new Date().toISOString();
    const nextReadMs = new Date(nextReadAt).getTime();
    const previousValue = String(privateLastReadByConversation[key] || '').trim();
    const previousMs = previousValue ? new Date(previousValue).getTime() : 0;
    const hasNewerReadAt =
      Number.isFinite(previousMs) &&
      Number.isFinite(nextReadMs) &&
      previousMs >= nextReadMs;

    if (hasNewerReadAt) {
      setPrivateUnreadByConversation((prev) => {
        if (!prev[key]) return prev;
        return { ...prev, [key]: 0 };
      });
      return;
    }

    const nextReadMap = { ...privateLastReadByConversation, [key]: nextReadAt };
    setPrivateLastReadByConversation(nextReadMap);
    writePrivateReadsCache(ownId, nextReadMap);

    setPrivateUnreadByConversation((prev) => {
      if (!prev[key]) return prev;
      return { ...prev, [key]: 0 };
    });

    try {
      const { error } = await supabase
        .from('private_message_reads')
        .upsert(
          [{ user_id: ownId, conversation_key: key, last_read_at: nextReadAt }],
          { onConflict: 'user_id,conversation_key' }
        );

      if (error && !isMissingTableError(error, 'private_message_reads')) {
        throw error;
      }
    } catch (_error) {
      // Read markers are best-effort; unread falls back to live counters.
    }
  };

  const sendPrivateTypingSignal = async (conversation, draftValue = '') => {
    const channel = privateTypingChannelRef.current;
    if (!channel || !user?.id) return;

    const recipientId = String(conversation?.actorId || '').trim();
    const conversationKey = getPrivateConversationKey(conversation?.key || recipientId);
    const text = String(draftValue || '').trim();
    if (!recipientId || !conversationKey || !text) return;

    const now = Date.now();
    const lastSentAt = Number(privateTypingSentAtRef.current[conversationKey] || 0);
    if (now - lastSentAt < 900) return;
    privateTypingSentAtRef.current[conversationKey] = now;

    try {
      await channel.send({
        type: 'broadcast',
        event: 'private-typing',
        payload: {
          senderId: String(user.id),
          senderName: stats?.username || user?.email?.split('@')[0] || 'Onbekend',
          recipientId,
          conversationKey
        }
      });
    } catch (_error) {
      // Typing indicator is best-effort only.
    }
  };

  const handleSendPrivateChatMessage = async (conversation) => {
    if (!user?.id || !stats || privateChatSending) return;
    const recipientId = String(conversation?.actorId || '').trim();
    const content = String(privateChatInput || '').trim();
    if (!recipientId || content.length < 1) return;

    const recipientFromContacts = privateContacts.find((entry) => String(entry?.id || '').trim() === recipientId);
    const recipientUsername = String(
      recipientFromContacts?.username || conversation?.actorName || 'Onbekend'
    ).trim() || 'Onbekend';
    const privateSubject = `Chat met ${recipientUsername}`;

    const senderName = stats?.username || user?.email?.split('@')[0] || 'Onbekend';
    setPrivateChatSending(true);
    try {
      const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      const tryInsertPrivateMessage = async (targetRecipientId) => {
        const candidatePayloads = [
          {
            sender_id: user.id,
            sender_username: senderName,
            recipient_id: targetRecipientId,
            recipient_username: recipientUsername,
            subject: privateSubject,
            content
          },
          {
            sender_id: user.id,
            recipient_id: targetRecipientId,
            subject: privateSubject,
            content
          }
        ];

        let lastError = null;
        for (const payload of candidatePayloads) {
          const insertResult = await supabase.from('private_messages').insert([payload]);
          if (!insertResult.error) {
            return null;
          }

          lastError = insertResult.error;
          const errorText = String(insertResult.error?.message || '').toLowerCase();
          const canRetrySchemaVariant =
            Number(insertResult.error?.status || 0) === 400 ||
            errorText.includes('column') ||
            errorText.includes('schema cache') ||
            errorText.includes('could not find');

          if (!canRetrySchemaVariant) {
            return lastError;
          }
        }

        return lastError;
      };

      let finalRecipientId = recipientId;

      if (!UUID_PATTERN.test(finalRecipientId)) {
        const lookup = await supabase
          .from('player_stats')
          .select('id')
          .ilike('username', recipientUsername)
          .limit(1)
          .maybeSingle();

        const resolvedRecipientId = String(lookup?.data?.id || '').trim();
        if (!resolvedRecipientId || !UUID_PATTERN.test(resolvedRecipientId)) {
          throw new Error('Ontvanger-ID ongeldig. Open het profiel van de speler opnieuw en start daar de chat.');
        }
        finalRecipientId = resolvedRecipientId;
      }

      let error = await tryInsertPrivateMessage(finalRecipientId);

      // Recovery path: recipient id in current conversation can be stale/invalid.
      if (error) {
        const errorText = String(error?.message || '').toLowerCase();
        const invalidRecipientId =
          errorText.includes('invalid input syntax for type uuid') ||
          errorText.includes('recipient_id');

        if (invalidRecipientId && recipientUsername && recipientUsername !== 'Onbekend') {
          const lookup = await supabase
            .from('player_stats')
            .select('id')
            .ilike('username', recipientUsername)
            .limit(1)
            .maybeSingle();

          const resolvedRecipientId = String(lookup?.data?.id || '').trim();
          if (resolvedRecipientId && resolvedRecipientId !== finalRecipientId) {
            finalRecipientId = resolvedRecipientId;
            error = await tryInsertPrivateMessage(finalRecipientId);
            if (!error) {
              setActivePrivateConversationKey(finalRecipientId);
            }
          }
        }
      }

      if (error) {
        const errorText = String(error?.message || '').toLowerCase();
        const forbidden =
          Number(error?.status || 0) === 403 ||
          errorText.includes('forbidden') ||
          errorText.includes('permission denied') ||
          errorText.includes('row-level security') ||
          errorText.includes('violates row-level security policy');

        if (forbidden) {
          const fallbackMessageId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const fallbackCreatedAt = new Date().toISOString();
          const fallbackMessage = {
            id: fallbackMessageId,
            sender_id: String(user.id),
            sender_username: senderName,
            recipient_id: finalRecipientId,
            recipient_username: recipientUsername,
            subject: privateSubject,
            content,
            created_at: fallbackCreatedAt
          };

          privateMessageIdsRef.current.add(fallbackMessageId);
          setPrivateMessages((prev) => {
            if (prev.some((entry) => String(entry?.id || '').trim() === fallbackMessageId)) return prev;
            return [...prev, fallbackMessage].slice(-300);
          });

          setPrivateContacts((prev) => {
            if (prev.some((entry) => String(entry?.id || '').trim() === finalRecipientId)) return prev;
            return [...prev, { id: finalRecipientId, username: recipientUsername, role: 'lid' }];
          });

          try {
            await privateTypingChannelRef.current?.send({
              type: 'broadcast',
              event: 'private-message',
              payload: {
                id: fallbackMessageId,
                senderId: String(user.id),
                senderUsername: senderName,
                recipientId: finalRecipientId,
                recipientUsername,
                content,
                createdAt: fallbackCreatedAt
              }
            });
          } catch (_broadcastError) {
            // No-op: local fallback is already applied.
          }

          setPrivateChatInput('');
          setPrivateTypingByConversation((prev) => {
            const next = { ...prev };
            delete next[getPrivateConversationKey(conversation?.key || conversation?.actorId)];
            return next;
          });
          showActionNotice('Privebericht verzonden via realtime fallback (database policy blokkeert opslag).', 'info');
          return;
        }
      }

      if (error) throw error;

      const sentAt = new Date().toISOString();
      const localEchoId = `sent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const localEchoMessage = {
        id: localEchoId,
        sender_id: String(user.id),
        sender_username: senderName,
        recipient_id: finalRecipientId,
        recipient_username: recipientUsername,
        subject: privateSubject,
        content,
        created_at: sentAt
      };

      privateMessageIdsRef.current.add(localEchoId);
      setPrivateMessages((prev) => {
        if (prev.some((entry) => String(entry?.id || '').trim() === localEchoId)) return prev;
        return [...prev, localEchoMessage].slice(-300);
      });

      setActivePrivateConversationKey(getPrivateConversationKey(finalRecipientId));
      setIsPrivateChatWindowOpen(true);
      setIsGlobalChatWindowOpen(false);

      // Keep local contact cache in sync so follow-up sends never depend on a fresh reload.
      setPrivateContacts((prev) => {
        if (prev.some((entry) => String(entry?.id || '').trim() === finalRecipientId)) return prev;
        return [...prev, { id: finalRecipientId, username: recipientUsername, role: 'lid' }];
      });

      setPrivateChatInput('');
      setPrivateTypingByConversation((prev) => {
        const next = { ...prev };
        delete next[getPrivateConversationKey(conversation?.key || conversation?.actorId)];
        return next;
      });

      // Reconcile temporary local echo with canonical DB rows.
      void refreshPrivateChatData();
    } catch (error) {
      const detailParts = [error?.code, error?.message, error?.details, error?.hint]
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter(Boolean);
      const detailText = detailParts.length > 0 ? detailParts.join(' | ') : 'onbekende fout';
      showActionNotice(`Prive bericht verzenden mislukt: ${detailText}`, 'error');
    } finally {
      setPrivateChatSending(false);
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
      let { error } = await supabase
        .from('messages')
        .insert([{ user_id: user.id, username: messageUsername, content }]);

      if (error && isMissingColumnError(error, 'messages', 'user_id')) {
        const fallbackInsert = await supabase
          .from('messages')
          .insert([{ username: messageUsername, content }]);
        error = fallbackInsert.error;
      }

      if (error) throw error;
      setChatInput('');
    } catch (error) {
      addLog(` Bericht verzenden mislukt: ${error.message}`, 'error');
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
        addLog('Bericht niet verwijderd. Controleer admin rechten/RLS voor chat DELETE.', 'error');
        return;
      }

      setChatMessages((prev) => prev.filter((message) => message.id !== messageId));
    } catch (error) {
      addLog(` Bericht verwijderen mislukt: ${error.message}`, 'error');
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

  const openMemberProfile = async (member) => {
    if (!member) return;

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
  };

  const handleOpenChatProfile = async (messageUsername) => {
    const targetUsername = (messageUsername || '').trim();
    if (!targetUsername) return;

    const normalizeLookupUsername = (value) =>
      String(value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

    const normalizedTarget = normalizeLookupUsername(targetUsername);
    if (normalizedTarget === 'systeem' || normalizedTarget === 'system') return;

    const currentRequestId = chatProfileRequestIdRef.current + 1;
    chatProfileRequestIdRef.current = currentRequestId;
    const isLatestRequest = () => chatProfileRequestIdRef.current === currentRequestId;

    const ownUsername = (stats?.username || '').trim().toLowerCase();
    if (ownUsername && ownUsername === normalizedTarget) {
      if (!isLatestRequest()) return;
      setCurrentView('profile');
      return;
    }

    const onlineMatch = onlineMembers.find(
      (member) => (member?.username || '').trim().toLowerCase() === normalizedTarget
    );

    const openFallbackProfile = () => {
      if (!isLatestRequest()) return;
      const roleFromChat = chatUserRoles[getChatUsernameKey(targetUsername)] || 'lid';
      setSelectedMemberProfile({
        ...(onlineMatch || {}),
        id: onlineMatch?.id || null,
        username: targetUsername,
        role: normalizeRole(roleFromChat),
        gender: onlineMatch?.gender ?? null,
        level: onlineMatch?.level ?? null
      });
      setCurrentView('member-profile');
    };

    // Zorg dat iedere chatnaam direct opent, ook als DB tijdelijk traag is.
    openFallbackProfile();

    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .ilike('username', targetUsername)
        .order('last_updated', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!isLatestRequest()) return;

      let resolvedProfile = (Array.isArray(data) ? data[0] : null) || null;

      if (!resolvedProfile) {
        // Extra fallback: brede DB scan + exacte genormaliseerde vergelijking.
        const { data: scanData, error: scanError } = await supabase
          .from('player_stats')
          .select('*')
          .order('last_updated', { ascending: false })
          .limit(5000);

        if (!isLatestRequest()) return;

        if (!scanError && Array.isArray(scanData)) {
          resolvedProfile = scanData.find(
            (member) => normalizeLookupUsername(member?.username) === normalizedTarget
          ) || null;
        }
      }

      resolvedProfile = resolvedProfile || onlineMatch;

      if (!resolvedProfile) {
        if (!isLatestRequest()) return;
        addLog(` Volledig profiel van ${formatDisplayUsername(targetUsername)} niet gevonden. Basisprofiel blijft zichtbaar.`, 'info');
        return;
      }

      if (!isLatestRequest()) return;
      setSelectedMemberProfile({
        ...resolvedProfile,
        role: normalizeRole(resolvedProfile?.role)
      });
    } catch (error) {
      if (!isLatestRequest()) return;
      addLog(` Profiel laden uit database mislukt (${error.message}). Basisprofiel blijft zichtbaar.`, 'info');
    }
  };

  const startPrivateConversation = (member) => {
    if (!member || !user?.id) return;

    const ownId = String(user.id || '').trim();
    const actorId = String(member.id || '').trim();
    if (!actorId || actorId === ownId) return;

    const actorName = formatDisplayUsername(member.username || 'Onbekend');

    setPrivateContacts((prev) => {
      if (prev.some((entry) => String(entry?.id || '').trim() === actorId)) return prev;
      return [...prev, { id: actorId, username: actorName, role: normalizeRole(member?.role) }];
    });

    setPrivateHiddenConversationKeys((prev) => prev.filter((entry) => entry !== actorId));
    setOpenPrivateConversationKeys((prev) => {
      const next = prev.filter((entry) => entry !== actorId);
      return [...next, actorId].slice(-6);
    });
    setActivePrivateConversationKey(actorId);
    void persistPrivateConversationRead(actorId);
    setIsPrivateChatWindowOpen(true);
    setIsGlobalChatWindowOpen(false);
    setIsChatWidgetOpen(true);
    setIsChatConversationsMenuOpen(false);
    setPrivateConversationSearchTerm('');
  };

  const handleChatScroll = () => {
    const container = chatScrollRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollChatRef.current = distanceFromBottom <= 80;
  };

  const showActionNotice = (text, type = 'info', persist = false) => {
    setActionNotice({ text, type, persist });
  };

  const showAdminNotice = (text, type = 'info') => {
    setAdminNotice({ text, type });
  };

  const buildHelpdeskMailPayload = () => {
    const usernameValue = (stats?.username || loginUsername || user?.email?.split('@')[0] || 'Onbekend').trim();
    const subjectValue = helpdeskSubject.trim() || `Helpdesk: ${helpdeskCategory}`;
    const messageValue = helpdeskMessage.trim();
    const categoryLabel = helpdeskCategory || 'algemeen';
    const createdAt = new Date().toISOString();

    const bodyLines = [
      'Nieuwe helpdesk aanvraag',
      '',
      `Gebruiker: ${usernameValue}`,
      `User ID: ${user?.id || 'onbekend'}`,
      `E-mail account: ${user?.email || 'onbekend'}`,
      `Categorie: ${categoryLabel}`,
      `Onderwerp: ${subjectValue}`,
      `Datum: ${createdAt}`,
      '',
      'Bericht:',
      messageValue || '(geen bericht ingevuld)'
    ];

    return {
      username: usernameValue,
      accountEmail: user?.email || 'onbekend',
      plainSubject: subjectValue,
      subject: `[District Helpdesk] ${subjectValue}`,
      body: bodyLines.join('\n')
    };
  };

  const buildHelpdeskRequestKey = (categoryValue, subjectValue, messageValue) => {
    return [
      String(categoryValue || '').trim().toLowerCase(),
      String(subjectValue || '').trim().toLowerCase(),
      String(messageValue || '').trim()
    ].join('||');
  };

  const handleSubmitHelpdeskEmail = async () => {
    if (helpdeskSending) return;

    const subjectValue = helpdeskSubject.trim();
    const messageValue = helpdeskMessage.trim();

    if (!subjectValue) {
      showActionNotice('Vul eerst een onderwerp in.', 'error');
      return;
    }

    if (!messageValue || messageValue.length < 10) {
      showActionNotice('Vul een duidelijk bericht in (minimaal 10 tekens).', 'error');
      return;
    }

    const requestKey = buildHelpdeskRequestKey(helpdeskCategory, subjectValue, messageValue);
    if (requestKey && requestKey === helpdeskLastSentKey) {
      showActionNotice('Deze aanvraag is al verzonden. Pas je onderwerp of bericht aan voor een nieuwe mail.', 'info');
      return;
    }

    const payload = buildHelpdeskMailPayload();

    try {
      setHelpdeskSending(true);

      const response = await fetch(HELPDESK_SUBMIT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          name: payload.username,
          email: payload.accountEmail,
          subject: payload.plainSubject,
          _subject: payload.subject,
          message: payload.body,
          _captcha: 'false',
          _template: 'table'
        })
      });

      const result = await response.json().catch(() => null);
      const ok = response.ok && String(result?.success || '').toLowerCase() === 'true';

      if (!ok) {
        throw new Error(result?.message || 'Automatisch verzenden is mislukt.');
      }

        showActionNotice('Je helpdeskverzoek is automatisch verzonden.', 'success', true);
        setHelpdeskLastSentKey(requestKey);
      setHelpdeskSubject('');
      setHelpdeskMessage('');
    } catch (error) {
      showActionNotice(`Automatisch verzenden mislukt: ${error?.message || 'onbekende fout'}`, 'error');
    } finally {
      setHelpdeskSending(false);
    }
  };

  const getChatSettingsStorageKey = (playerId) => `district-underworld-chat-widget-settings-${playerId}`;
  const getPrivateBlockedStorageKey = (playerId) => `district-underworld-private-blocked-${playerId}`;
  const getPrivateHiddenStorageKey = (playerId) => `district-underworld-private-hidden-${playerId}`;
  const getPrivateReadsStorageKey = (playerId) => `district-underworld-private-reads-${playerId}`;
  const getPrivateOpenTabsStorageKey = (playerId) => `district-underworld-private-open-tabs-${playerId}`;
  const getPrivateActiveTabStorageKey = (playerId) => `district-underworld-private-active-tab-${playerId}`;
  const getPrivateWindowOpenStorageKey = (playerId) => `district-underworld-private-window-open-${playerId}`;

  const readPrivateReadsCache = (playerId) => {
    if (!playerId) return {};
    try {
      const raw = localStorage.getItem(getPrivateReadsStorageKey(playerId));
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

      const next = {};
      Object.entries(parsed).forEach(([key, value]) => {
        const normalizedKey = getPrivateConversationKey(key);
        const normalizedValue = String(value || '').trim();
        if (!normalizedKey || !normalizedValue) return;
        if (!Number.isFinite(new Date(normalizedValue).getTime())) return;
        next[normalizedKey] = normalizedValue;
      });
      return next;
    } catch (_error) {
      return {};
    }
  };

  const writePrivateReadsCache = (playerId, readsMap) => {
    if (!playerId) return;
    try {
      const source = readsMap && typeof readsMap === 'object' ? readsMap : {};
      localStorage.setItem(getPrivateReadsStorageKey(playerId), JSON.stringify(source));
    } catch (_error) {
      // Ignore local storage write failures.
    }
  };

  const normalizeIdList = (values) => {
    const source = Array.isArray(values) ? values : [];
    return Array.from(new Set(source.map((value) => String(value || '').trim()).filter(Boolean)));
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
        addLog(` Karakter aangemaakt! Welkom in het District, ${formatDisplayUsername(data.username)}!`, 'success');
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
      addLog(" Database verbindingsfout.", "error");
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

  useEffect(() => {
    if (currentView === 'profile') return;
    setIsProfilePhotoMenuOpen(false);
  }, [currentView]);

  useEffect(() => {
    setCityMenuOpen(false);
  }, [currentView]);

  useEffect(() => {
    if (!user?.id) return;

    const heartbeatPresence = async () => {
      const nowIso = new Date().toISOString();

      try {
        const { error } = await supabase
          .from('player_stats')
          .update({ last_updated: nowIso })
          .eq('id', user.id);

        if (error) {
          if (isLikelyNetworkFetchError(error)) {
            logCloudNetworkIssueThrottled();
          }
          return;
        }

        setStats((prev) => (prev && prev.id === user.id ? { ...prev, last_updated: nowIso } : prev));
        setOnlineMembers((prev) => prev.map((member) => (
          member?.id === user.id ? { ...member, last_updated: nowIso } : member
        )));
        setSelectedMemberProfile((prev) => (
          prev && prev.id === user.id ? { ...prev, last_updated: nowIso } : prev
        ));
      } catch (error) {
        if (isLikelyNetworkFetchError(error)) {
          logCloudNetworkIssueThrottled();
        }
      }
    };

    void heartbeatPresence();
    const interval = setInterval(() => {
      void heartbeatPresence();
    }, PRESENCE_HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !stats) return;

    const nowMs = Date.now();
    const statsLastUpdatedMs = new Date(stats.last_updated || nowMs).getTime();
    const fallbackMs = Number.isFinite(statsLastUpdatedMs) ? statsLastUpdatedMs : nowMs;

    const currentEnergy = Number(stats.energy) || 0;
    const currentNerve = Number(stats.nerve) || 0;
    const currentMaxEnergy = Number(stats.max_energy) || 100;
    const currentMaxNerve = Number(stats.max_nerve) || 20;

    const anchor = recoveryAnchorRef.current;
    const isNewUser = anchor.userId !== user.id;

    if (isNewUser) {
      recoveryAnchorRef.current = {
        userId: user.id,
        energyMs: fallbackMs,
        nerveMs: fallbackMs,
        lastEnergy: currentEnergy,
        lastNerve: currentNerve,
        lastMaxEnergy: currentMaxEnergy,
        lastMaxNerve: currentMaxNerve
      };
      return;
    }

    const wasEnergyCapped =
      anchor.lastEnergy !== null &&
      anchor.lastMaxEnergy !== null &&
      anchor.lastEnergy >= anchor.lastMaxEnergy;
    const isEnergyNowBelowCap = currentEnergy < currentMaxEnergy;
    if (wasEnergyCapped && isEnergyNowBelowCap) {
      anchor.energyMs = nowMs;
    }

    const wasNerveCapped =
      anchor.lastNerve !== null &&
      anchor.lastMaxNerve !== null &&
      anchor.lastNerve >= anchor.lastMaxNerve;
    const isNerveNowBelowCap = currentNerve < currentMaxNerve;
    if (wasNerveCapped && isNerveNowBelowCap) {
      anchor.nerveMs = nowMs;
    }

    anchor.lastEnergy = currentEnergy;
    anchor.lastNerve = currentNerve;
    anchor.lastMaxEnergy = currentMaxEnergy;
    anchor.lastMaxNerve = currentMaxNerve;
  }, [user?.id, stats]);

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
    let hadNetworkIssue = false;
    let hasKnownPhotoFields = false;

    const updatePhotoWithRetry = async (payload, selectFields) => {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const { data, error } = await supabase
            .from('player_stats')
            .update(payload)
            .eq('id', user.id)
            .select(selectFields)
            .maybeSingle();

          if (!error) {
            return { data, error: null };
          }

          if (attempt === 1 && isLikelyNetworkFetchError(error)) {
            hadNetworkIssue = true;
            continue;
          }

          if (isLikelyNetworkFetchError(error)) {
            hadNetworkIssue = true;
          }

          return { data: null, error };
        } catch (error) {
          if (attempt === 1 && isLikelyNetworkFetchError(error)) {
            hadNetworkIssue = true;
            continue;
          }

          if (isLikelyNetworkFetchError(error)) {
            hadNetworkIssue = true;
          }

          return { data: null, error };
        }
      }

      hadNetworkIssue = true;
      return { data: null, error: new Error('Failed to fetch') };
    };

    try {
      const existingFields = PROFILE_PHOTO_FIELD_CANDIDATES.filter((field) => Object.prototype.hasOwnProperty.call(stats, field));
      const discoveredFields = Object.keys(stats || {}).filter((field) => PHOTO_FIELD_NAME_PATTERN.test(field));
      const fieldsToTry = Array.from(new Set([...existingFields, ...discoveredFields, ...PROFILE_PHOTO_FIELD_CANDIDATES]));

      const fieldsPresentInRow = Array.from(new Set([...existingFields, ...discoveredFields]));
      hasKnownPhotoFields = fieldsPresentInRow.length > 0;
      if (fieldsPresentInRow.length > 0) {
        const bulkPayload = fieldsPresentInRow.reduce((acc, fieldName) => {
          acc[fieldName] = normalized || null;
          return acc;
        }, {});

        const { data: updatedRow, error: bulkError } = await updatePhotoWithRetry(
          bulkPayload,
          `id, ${fieldsPresentInRow.join(', ')}`
        );

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
          addLog(` Profielfoto cloud-opslag mislukt: ${bulkError.message}`, 'error');
        }
      }

      if (savedInDatabase) {
        // Klaar: alle bekende fotovelden zijn in 1x bijgewerkt.
        // Geen extra per-veld fallback nodig.
      } else {
        // Fallback voor databases waar nog geen bekend fotoveld op de row aanwezig is.
        for (const fieldName of fieldsToTry) {
          const payload = { [fieldName]: normalized || null };
          const { data: updatedRow, error: dbError } = await updatePhotoWithRetry(
            payload,
            `id, ${fieldName}`
          );

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
            addLog(` Profielfoto cloud-opslag mislukt: ${dbError.message}`, 'error');
            break;
          }
        }
      }
    } catch (_error) {
      // Fallback naar localStorage als databaseveld (nog) niet beschikbaar is.
    }

    try {
      const key = getProfilePhotoStorageKey(user.id);
      if (hasKnownPhotoFields) {
        // In moderne setups met echte DB fotovelden willen we geen lokale override.
        window.localStorage.removeItem(key);
      } else {
        if (normalized) {
          window.localStorage.setItem(key, normalized);
        } else {
          window.localStorage.removeItem(key);
        }
      }
    } catch (_error) {
      // Lokale opslag kan falen in private mode; UI blijft wel werken in-memory.
    }

    const allowLocalOnlyFallback = !hasKnownPhotoFields;
    if (!savedInDatabase && !allowLocalOnlyFallback) {
      if (hadNetworkIssue) {
        setProfilePhotoError('Opslaan mislukt door netwerkprobleem. Probeer opnieuw op stabiel internet.');
        showActionNotice('Profielfoto niet opgeslagen in cloud (netwerkfout).', 'error');
        logCloudNetworkIssueThrottled();
      } else if (blockedByPolicy) {
        addLog('Profielfoto kon niet naar cloud worden geschreven (mogelijk RLS/policy blokkade).', 'error');
        setProfilePhotoError('Cloud-opslag geblokkeerd. Controleer Supabase update policy voor player_stats.');
        showActionNotice('Profielfoto niet opgeslagen in cloud.', 'error');
      } else {
        setProfilePhotoError('Profielfoto opslaan mislukt. Probeer opnieuw.');
        showActionNotice('Profielfoto niet opgeslagen in cloud.', 'error');
      }
      return;
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
        addLog(` Profielfoto opgeslagen in kolom: ${savedPhotoField}`, 'success');
      }
      showActionNotice('Profielfoto opgeslagen en gesynchroniseerd.', 'success');
    } else {
      // Alleen nog mogelijk op legacy setups zonder fotovelden in de DB.
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

      const nextUsernameValue = updatedUser.username || normalizedUsername;
      const oldUsernameLower = currentUsername.toLowerCase();
      const nextUsernameLower = nextUsernameValue.toLowerCase();

      setStats(updatedUser);
      setUsernameDraft(nextUsernameValue);
      setLoginUsername(nextUsernameValue);
      setUsernameChangeError('');

      setOnlineMembers((prev) => prev.map((member) => {
        if (!member) return member;
        if (member.id === user.id) {
          return { ...member, username: nextUsernameValue, role: normalizeRole(updatedUser.role) };
        }
        return member;
      }));

      setSelectedMemberProfile((prev) => {
        if (!prev || prev.id !== user.id) return prev;
        return { ...prev, username: nextUsernameValue, role: normalizeRole(updatedUser.role) };
      });

      setChatMessages((prev) => prev.map((message) => {
        if ((message?.username || '').trim().toLowerCase() !== oldUsernameLower) {
          return message;
        }
        return { ...message, username: nextUsernameValue };
      }));

      setChatUserRoles((prev) => {
        const next = { ...prev };
        const oldRole = next[oldUsernameLower];
        if (oldUsernameLower !== nextUsernameLower) {
          delete next[oldUsernameLower];
        }

        if (!next[nextUsernameLower] && oldRole) {
          next[nextUsernameLower] = oldRole;
        }

        if (!next[nextUsernameLower]) {
          next[nextUsernameLower] = normalizeRole(updatedUser.role);
        }

        return next;
      });

      let { error: renameMessagesError } = await supabase
        .from('messages')
        .update({ username: nextUsernameValue })
        .eq('user_id', user.id);

      if (renameMessagesError && isMissingColumnError(renameMessagesError, 'messages', 'user_id')) {
        const fallbackRename = await supabase
          .from('messages')
          .update({ username: nextUsernameValue })
          .ilike('username', currentUsername);
        renameMessagesError = fallbackRename.error;
      }

      if (renameMessagesError) {
        addLog(` Gebruikersnaam in chatgeschiedenis niet overal bijgewerkt: ${renameMessagesError.message}`, 'error');
      }

      try {
        await supabase.auth.updateUser({
          data: {
            username: nextUsernameValue,
            display_name: nextUsernameValue,
            full_name: nextUsernameValue
          }
        });
      } catch (_error) {
        // Niet blokkerend: login werkt op player_stats gebruikersnaam.
      }

      showActionNotice('Gebruikersnaam succesvol gewijzigd.', 'success');
      addLog(` Gebruikersnaam gewijzigd naar ${formatDisplayUsername(nextUsernameValue)}.`, 'success');
    } catch (error) {
      const message = error?.message || 'Gebruikersnaam wijzigen mislukt.';
      setUsernameChangeError(message);
      showActionNotice(message, 'error');
      addLog(` ${message}`, 'error');
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
          addLog(` Je bent ${elapsedMinutes} minuten offline geweest!`, 'info');
          addLog(` Hersteld: +${updatedEnergy - currentStats.energy} Energie, +${updatedNerve - currentStats.nerve} Nerve.`, 'success');
        }
      }
    } else {
      setStats(currentStats);
    }
  };

  // Sync current state to Supabase on actions
  const updateDB = async (updatedFields) => {
    if (!user?.id) {
      addLog('Synchronisatie overgeslagen: geen actieve sessie.', 'error');
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

        addLog(` Synchronisatie met cloud database mislukt: ${summarizeCloudError(error)}`, 'error');
        return false;
      } catch (err) {
        if (attempt === 1 && isLikelyNetworkFetchError(err)) {
          continue;
        }

        if (isLikelyNetworkFetchError(err)) {
          logCloudNetworkIssueThrottled();
          return false;
        }

        addLog(` Synchronisatie met cloud database mislukt: ${summarizeCloudError(err)}`, 'error');
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
      const message = " Je zit opgesloten! Je kunt nu niet trainen.";
      showActionNotice(message, 'error');
      return addLog(message, 'error');
    }
    if (stats.energy < 10) {
      const message = " Te vermoeid! Je hebt minimaal 10 Energie nodig.";
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
      const message = ` LEVEL UP! Je bent nu Level ${newLevel}! Energie & Nerve hersteld.`;
      showActionNotice(message, 'success');
      addLog(message, 'levelup');
    } else {
      const message = ` Getraind in de lokale sportschool! Kracht +${strengthGain}, XP +${xpGain}`;
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
      const message = " Gevangenen kunnen geen misdaden plegen!";
      showActionNotice(message, 'error');
      return addLog(message, 'error');
    }
    if (stats.nerve < 4) {
      const message = " Je hebt niet genoeg lef (Nerve). Wacht tot het herstelt.";
      showActionNotice(message, 'error');
      return addLog(message, 'error');
    }

    const success = Math.random() > 0.25; // 75% kans
    const newStats = { nerve: stats.nerve - 4 };

    if (success) {
      const cashLoot = Math.floor(Math.random() * 80) + 20;
      newStats.cash = stats.cash + cashLoot;
      newStats.xp = stats.xp + 10;
      const message = ` Succes! Je hebt een toerist gerold voor $${cashLoot}. +10 XP.`;
      showActionNotice(message, 'success');
      addLog(message, 'success');
    } else {
      const message = ' Mislukt! De toerist had je door en je moest met lege handen vluchten!';
      showActionNotice(message, 'error');
      addLog(message, 'error');
    }

    updateDB(newStats);
  };

  const handleHeist = () => {
    if (jailTime > 0) {
      const message = ' Je zit momenteel in een cel!';
      showActionNotice(message, 'error');
      return addLog(message, 'error');
    }
    if (stats.nerve < 12) {
      const message = ' Je hebt minimaal 12 Nerve nodig voor een bankoverval.';
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
      const message = ` OVERVAL GESLAAGD! De lokale kluis leeggehaald voor $${heistLoot}! +40 XP.`;
      showActionNotice(message, 'success');
      addLog(message, 'success');
    } else {
      if (Math.random() > 0.5) {
        const jailUntil = new Date(Date.now() + 60 * 1000).toISOString();
        newStats.jail_until = jailUntil;
        const message = ' COPS! De SWAT was te snel ter plaatse. 60 seconden gevangenisstraf.';
        showActionNotice(message, 'error');
        addLog(message, 'jail');
      } else {
        const message = ' Alarm ging af! Je bent ternauwernood ontsnapt zonder buit.';
        showActionNotice(message, 'error');
        addLog(message, 'error');
      }
    }

    updateDB(newStats);
  };

  const handlePrisonBribe = async () => {
    if (jailTime <= 0) return addLog('Je bent al vrij.', 'info');
    if (!stats) return;

    const bribeCost = calculatePrisonBribeCost(jailTime);
    const currentCash = stats.cash || 0;
    if (currentCash < bribeCost) {
      setPrisonActionWarning(`Te weinig cash voor vrijkopen. Nodig: $${bribeCost.toLocaleString()}.`);
      return addLog(` Te weinig cash om je vrij te kopen. Nodig: $${bribeCost.toLocaleString()}.`, 'error');
    }

    setPrisonActionWarning('');
    await updateDB({ cash: currentCash - bribeCost });
    await updateDB({ jail_until: null });
    addLog(` Je hebt een bewaker omgekocht voor $${bribeCost.toLocaleString()} en bent vrij.`, 'success');
  };

  const handlePrisonEscape = async () => {
    if (jailTime <= 0) return addLog('Je bent al vrij.', 'info');
    if (!stats) return;

    const currentEnergy = stats.energy || 0;
    const currentNerve = stats.nerve || 0;

    if (currentNerve < PRISON_ESCAPE_NERVE_COST) {
      setPrisonActionWarning(`Te weinig lef voor uitbreken. Nodig: ${PRISON_ESCAPE_NERVE_COST} lef.`);
      return addLog(` Te weinig lef voor een uitbraak. Minimaal ${PRISON_ESCAPE_NERVE_COST} lef nodig.`, 'error');
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
      addLog('Uitbraak gelukt! Je bent ontsnapt uit de gevangenis.', 'success');
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
    addLog(` Uitbraak mislukt! Je straf is met ${extraSentence} seconden verlengd.`, 'jail');
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
      return addLog(` Te weinig cash om ${formatDisplayUsername(target.username)} vrij te kopen. Nodig: $${cost.toLocaleString()}.`, 'error');
    }

    try {
      setPrisonActionLoadingId(target.id);

      const { data, error } = await supabase.rpc('prison_help_player', {
        p_target_id: target.id,
        p_action: 'buyout'
      });

      if (!error) {
        const successMessage = data?.message || ` Je hebt ${formatDisplayUsername(target.username)} vrijgekocht voor $${cost.toLocaleString()}.`;
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

      addLog(` Je hebt ${formatDisplayUsername(target.username)} vrijgekocht voor $${cost.toLocaleString()}.`, 'success');
      await refreshPrisonMembers();
    } catch (err) {
      addLog(` Vrijkoop voor speler mislukt: ${err.message}`, 'error');
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
      return addLog(` Je hebt minimaal ${PRISON_RESCUE_NERVE_COST} lef nodig om iemand te helpen ontsnappen.`, 'error');
    }

    try {
      setPrisonActionLoadingId(target.id);

      const { data, error } = await supabase.rpc('prison_help_player', {
        p_target_id: target.id,
        p_action: 'escape'
      });

      if (!error) {
        addLog(data?.message || ` Uitbraakhulp geprobeerd op ${formatDisplayUsername(target.username)}.`, data?.escaped ? 'success' : 'jail');
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

        addLog(` Uitbraakhulp gelukt! ${formatDisplayUsername(target.username)} is vrij.`, 'success');
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

        addLog(` Uitbraakhulp mislukt. Straf van ${formatDisplayUsername(target.username)} +${extraSeconds} sec.`, 'jail');
      }

      await refreshPrisonMembers();
    } catch (err) {
      addLog(` Uitbraakhulp mislukt: ${err.message}`, 'error');
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
          addLog(" Bevestig eerst je e-mailadres via de link in je inbox.", "info");
          setAuthSuccess('Account aangemaakt. Bevestig eerst je e-mailadres via de link in je inbox, daarna kun je inloggen.');
        } else {
          addLog(" Account aangemaakt! Je kunt nu inloggen.", "success");
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
      addLog(` Fout: ${normalizedMessage}`, "error");
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
            ? ` Admin: ${formatDisplayUsername(member.username)} kreeg +$${amount.toLocaleString()}.`
            : ` Admin: $${amount.toLocaleString()} afgenomen van ${formatDisplayUsername(member.username)}.`;
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
          ? ` Admin: ${formatDisplayUsername(member.username)} kreeg +$${amount.toLocaleString()}.`
          : ` Admin: $${amount.toLocaleString()} afgenomen van ${formatDisplayUsername(member.username)}.`;
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
          const message = ` Admin: ${formatDisplayUsername(member.username)} volledig hersteld.`;
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
        const message = ` Admin: ${formatDisplayUsername(member.username)} volledig hersteld.`;
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
          const message = ` Admin: je zit ${ADMIN_JAIL_SECONDS} sec in de cel.`;
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
          throw new Error('Kon jail status niet verifiren. Controleer RLS policies op player_stats.');
        }

        const remainingAfterAction = getRemainingJailSeconds(jailedTarget?.jail_until);
        if (remainingAfterAction <= 0) {
          throw new Error('Jail actie lijkt niet opgeslagen. Voeg jail support toe in admin_apply_action of controleer RLS update policy.');
        }

        const message = ` Admin: ${formatDisplayUsername(member.username)} zit ${ADMIN_JAIL_SECONDS} sec in de cel.`;
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

        const message = ` Rol aangepast: ${formatDisplayUsername(member.username)} is nu ${nextRole}.`;
        showAdminNotice(message, 'success');
        addLog(message, 'success');
        setRankMenuOpenId(null);
      }

      await refreshAdminMembers();
    } catch (err) {
      const message = ` Admin actie mislukt: ${err.message}`;
      showAdminNotice(message, 'error');
      addLog(message, 'error');
    } finally {
      setAdminActionLoadingId(null);
    }
  };

  const renderLiveChatWidget = () => {
    if (!user || typeof document === 'undefined') return null;

    const chatWindowWidthPx = Math.round(380 * (chatWindowWidthPercent / 100));
    const chatWindowHeightPx = Math.round(335 * (chatWindowHeightPercent / 100));
    const isMobileViewport = window.innerWidth <= 1023;
    const chatDockBottomPx = isMobileViewport ? 86 : 8;
    const chatPanelBottomPx = chatDockBottomPx + 40;
    const baseDockBottomPx = chatPanelBottomPx + 2;
    const activeChannel = ['live', 'trade', 'faction'].includes(chatWidgetTab) ? chatWidgetTab : 'live';
    const channelLabel = activeChannel === 'trade' ? 'Trade' : activeChannel === 'faction' ? 'Faction' : 'Global';
    const isGlobalWindowVisible = isChatWidgetOpen && isGlobalChatWindowOpen;
    const isPrivateWindowVisible = isPrivateChatWindowOpen;
    const isConversationMenuVisible = isChatConversationsMenuOpen;
    const isAnyChatPanelVisible = isGlobalWindowVisible || isPrivateWindowVisible || isConversationMenuVisible;
    const estimatedChatPanelHeightPx = chatWindowHeightPx + 56;
    const estimatedConversationsPanelHeightPx = Math.min(560, Math.max(260, window.innerHeight - 80));
    const rightPanelWidthPx = isConversationMenuVisible
      ? Math.min(360, Math.max(280, window.innerWidth - 20))
      : chatWindowWidthPx;
    const settingsPanelTargetWidthPx = 360;
    const minSideBySideGapPx = 28;
    const canPlaceSettingsSideBySide =
      isAnyChatPanelVisible &&
      window.innerWidth >= rightPanelWidthPx + settingsPanelTargetWidthPx + minSideBySideGapPx;
    const settingsRightPx = canPlaceSettingsSideBySide ? rightPanelWidthPx + 18 : 10;
    const settingsBottomPx = canPlaceSettingsSideBySide
      ? baseDockBottomPx
      : isConversationMenuVisible
        ? baseDockBottomPx + estimatedConversationsPanelHeightPx + 8
        : (isGlobalWindowVisible || isPrivateWindowVisible
          ? baseDockBottomPx + estimatedChatPanelHeightPx + 8
          : baseDockBottomPx);
    const privateConversations = buildPrivateConversationList();
    const selectedPrivateConversation = privateConversations.find((entry) => entry.key === activePrivateConversationKey) || (() => {
      const fallbackContact = privateContacts.find(
        (entry) => String(entry?.id || '').trim() === activePrivateConversationKey
      );
      if (!fallbackContact) return null;
      return {
        key: getPrivateConversationKey(fallbackContact.id),
        actorId: String(fallbackContact.id || '').trim(),
        actorName: formatDisplayUsername(fallbackContact.username || 'Onbekend'),
        lastAt: 0,
        lastText: '',
        unread: Number(privateUnreadByConversation[String(fallbackContact.id || '').trim()] || 0)
      };
    })();
    const ownId = String(user?.id || '').trim();
    const selectedPrivateMessages = selectedPrivateConversation
      ? privateMessages
        .filter((message) => getPrivateConversationFromMessage(message, ownId).key === selectedPrivateConversation.key)
      : [];
    const unreadPrivateTotal = Object.values(privateUnreadByConversation).reduce((sum, value) => sum + (Number(value) || 0), 0);
    const activeTypingLabel = selectedPrivateConversation
      ? (privateTypingByConversation[selectedPrivateConversation.key] || '')
      : '';
    const normalizedConversationSearch = privateConversationSearchTerm.trim().toLowerCase();
    const searchableContacts = (privateContacts || [])
      .map((entry) => ({
        id: String(entry?.id || '').trim(),
        username: formatDisplayUsername(entry?.username || 'Onbekend'),
        role: normalizeRole(entry?.role)
      }))
      .filter((entry) => Boolean(entry.id))
      .filter((entry) => !isPrivateConversationHidden(entry.id))
      .filter((entry) => {
        if (!normalizedConversationSearch) return true;
        return entry.username.toLowerCase().includes(normalizedConversationSearch);
      })
      .slice(0, 12);

    const openPrivateConversation = (conversation) => {
      const key = getPrivateConversationKey(conversation?.key || conversation?.actorId);
      if (!key) return;
      setPrivateHiddenConversationKeys((prev) => prev.filter((entry) => entry !== key));
      setOpenPrivateConversationKeys((prev) => {
        const next = prev.filter((entry) => entry !== key);
        return [...next, key].slice(-6);
      });
      setActivePrivateConversationKey(key);
      setIsPrivateChatWindowOpen(true);
      setIsGlobalChatWindowOpen(false);
      setIsChatConversationsMenuOpen(false);
      void persistPrivateConversationRead(key);
    };

    const toggleIgnoreConversationActor = (actorId) => {
      const key = String(actorId || '').trim();
      if (!key) return;
      setPrivateBlockedUserIds((prev) => {
        if (prev.includes(key)) {
          return prev.filter((entry) => entry !== key);
        }
        return [...prev, key];
      });
      if (activePrivateConversationKey === key) {
        setIsPrivateChatWindowOpen(false);
      }
    };

    const softDeleteConversation = (conversationKey) => {
      const key = getPrivateConversationKey(conversationKey);
      if (!key) return;
      setPrivateHiddenConversationKeys((prev) => {
        if (prev.includes(key)) return prev;
        return [...prev, key];
      });
      setOpenPrivateConversationKeys((prev) => prev.filter((entry) => entry !== key));
      setPrivateUnreadByConversation((prev) => ({ ...prev, [key]: 0 }));
      if (activePrivateConversationKey === key) {
        setActivePrivateConversationKey('');
        setIsPrivateChatWindowOpen(false);
      }
    };

    const closePrivateConversation = (conversationKey) => {
      const key = getPrivateConversationKey(conversationKey);
      if (!key) return;
      setOpenPrivateConversationKeys((prev) => prev.filter((entry) => entry !== key));
      setPrivateUnreadByConversation((prev) => ({ ...prev, [key]: 0 }));
      setActivePrivateConversationKey((prev) => {
        if (prev !== key) return prev;
        const remainingKeys = openPrivateConversationKeys.filter((entry) => entry !== key);
        return remainingKeys[remainingKeys.length - 1] || '';
      });
    };

    const openConversationsMenu = () => {
      const nextOpen = !isChatConversationsMenuOpen;
      setIsChatConversationsMenuOpen(nextOpen);
      if (nextOpen) {
        setIsChatWidgetOpen(false);
        setIsGlobalChatWindowOpen(false);
        setIsPrivateChatWindowOpen(false);
        setPrivateConversationSearchTerm('');
        void refreshPrivateChatData();
      }
    };

    const openChannelWindow = (channelKey) => {
      setIsChatWidgetOpen(true);
      setIsGlobalChatWindowOpen(true);
      setIsPrivateChatWindowOpen(false);
      setIsChatConversationsMenuOpen(false);
      setChatWidgetTab(channelKey);
      if (channelKey === 'live') {
        setChatUnreadCount(0);
        shouldAutoScrollChatRef.current = true;
        requestAnimationFrame(() => {
          scrollChatToBottom();
        });
      }
    };

    const closeChannelWindow = () => {
      setIsGlobalChatWindowOpen(false);
      setIsChatWidgetOpen(false);
    };

    return createPortal(
      <>
        {isChatWidgetOpen && isGlobalChatWindowOpen && (
          <div
            style={{
              position: 'fixed',
              right: '10px',
              bottom: `${chatPanelBottomPx}px`,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              maxWidth: 'calc(100vw - 20px)'
            }}
          >
            <div
              style={{
                width: `min(${chatWindowWidthPx}px, calc(100vw - 20px))`,
                border: '1px solid #4b4b4b',
                borderRadius: '8px',
                background: '#d9d9d9',
                boxShadow: '0 14px 28px rgba(0,0,0,0.45)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '36px',
                  background: 'linear-gradient(180deg, #5a5a5a 0%, #2f2f2f 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 10px',
                  color: '#f5f5f5',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                <span>{channelLabel}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={closeChannelWindow}
                    style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
                    title="Minimaliseer"
                  >
                    _
                  </button>
                  <button
                    type="button"
                    onClick={closeChannelWindow}
                    style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
                    title="Sluit"
                  >
                    X
                  </button>
                </div>
              </div>

              <div
                ref={chatScrollRef}
                onScroll={handleChatScroll}
                style={{ maxHeight: `${chatWindowHeightPx}px`, minHeight: `${chatWindowHeightPx}px`, overflowY: 'auto', padding: '10px 10px 8px' }}
              >
                {activeChannel !== 'live' ? (
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    Dit kanaal word nog opgebouwd.
                  </p>
                ) : chatLoading ? (
                  <p style={{ fontSize: '12px', color: '#666' }}>Chat laden...</p>
                ) : chatMessages.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#666' }}>Nog geen berichten.</p>
                ) : (
                  chatMessages.map((message) => {
                    const ownMessage = isOwnChatMessage(message);
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
                      <div key={message.id} style={{ marginBottom: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#ffffff', padding: '6px 8px' }}>
                        <div style={{ fontSize: '12px', lineHeight: 1.35, color: '#111827' }}>
                          <span style={{ color: '#6b7280', marginRight: '6px' }}>[{formatChatTime(message.created_at)}]</span>
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
                              className={`${nameClass} font-semibold cursor-pointer hover:underline`}
                              style={{ ...nameStyle }}
                            >
                              {displayName}:
                            </span>
                          ) : (
                            <span className={`${nameClass} font-semibold`} style={{ ...nameStyle }}>{displayName}:</span>
                          )}
                          <span style={{ marginLeft: '6px' }}>{message.content}</span>
                        </div>
                        {canDeleteMessage && (
                          <div style={{ marginTop: '4px' }}>
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
                              style={{ fontSize: '10px', border: '1px solid #fca5a5', borderRadius: '4px', padding: '1px 5px', background: '#fee2e2', color: '#7f1d1d' }}
                            >
                              {chatDeletingId === message.id ? '...' : 'X'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={handleSendChatMessage}
                style={{ borderTop: '1px solid #b8b8b8', padding: '8px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px', background: '#d9d9d9' }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatInputKeyDown}
                  placeholder={activeChannel === 'live' ? 'Type your message here...' : 'Kanaal nog in opbouw'}
                  maxLength={280}
                  disabled={activeChannel !== 'live'}
                  style={{ border: '1px solid #b8b8b8', borderRadius: '4px', padding: '8px 10px', fontSize: '12px', background: '#ffffff', color: '#111827' }}
                />
                <button
                  type="submit"
                  disabled={activeChannel !== 'live' || chatSending || !chatInput.trim()}
                  style={{ border: '1px solid #b8b8b8', borderRadius: '4px', padding: '8px 10px', fontSize: '12px', background: '#f3f4f6', color: '#374151', opacity: activeChannel !== 'live' || chatSending || !chatInput.trim() ? 0.6 : 1 }}
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {isPrivateChatWindowOpen && selectedPrivateConversation && (
          <div
            style={{
              position: 'fixed',
              right: '10px',
              bottom: `${chatPanelBottomPx}px`,
              zIndex: 10001,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              maxWidth: 'calc(100vw - 20px)'
            }}
          >
            <div
              style={{
                width: `min(${chatWindowWidthPx}px, calc(100vw - 20px))`,
                border: '1px solid #4b4b4b',
                borderRadius: '8px',
                background: '#d9d9d9',
                boxShadow: '0 14px 28px rgba(0,0,0,0.45)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '36px',
                  background: 'linear-gradient(180deg, #475569 0%, #1e293b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 10px',
                  color: '#f5f5f5',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                <span>Prive: {selectedPrivateConversation.actorName}</span>
                <button
                  type="button"
                  onClick={() => setIsPrivateChatWindowOpen(false)}
                  style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
                  title="Sluit"
                >
                  X
                </button>
              </div>

              <div style={{ maxHeight: `${chatWindowHeightPx}px`, minHeight: `${chatWindowHeightPx}px`, overflowY: 'auto', padding: '10px 10px 8px' }}>
                {selectedPrivateMessages.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#666' }}>Nog geen priveberichten in dit gesprek.</p>
                ) : (
                  selectedPrivateMessages.map((message) => {
                    const fromSelf = String(message?.sender_id || '').trim() === ownId;
                    return (
                      <div
                        key={message.id}
                        style={{
                          marginBottom: '8px',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          background: fromSelf ? '#dcfce7' : '#ffffff',
                          padding: '6px 8px'
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                          {fromSelf ? 'Jij' : selectedPrivateConversation.actorName} [{formatChatTime(message.created_at)}]
                        </div>
                        <div style={{ fontSize: '12px', color: '#111827', lineHeight: 1.35 }}>{message.content}</div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ borderTop: '1px solid #b8b8b8', padding: '8px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px', background: '#d9d9d9' }}>
                {activeTypingLabel && (
                  <div style={{ gridColumn: '1 / -1', fontSize: '11px', color: '#475569' }}>
                    {activeTypingLabel} is aan het typen...
                  </div>
                )}
                <input
                  type="text"
                  value={privateChatInput}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setPrivateChatInput(nextValue);
                    void sendPrivateTypingSignal(selectedPrivateConversation, nextValue);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    void handleSendPrivateChatMessage(selectedPrivateConversation);
                  }}
                  placeholder={`Bericht naar ${selectedPrivateConversation.actorName}...`}
                  maxLength={500}
                  style={{ border: '1px solid #b8b8b8', borderRadius: '4px', padding: '8px 10px', fontSize: '12px', background: '#ffffff', color: '#111827' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    void handleSendPrivateChatMessage(selectedPrivateConversation);
                  }}
                  disabled={privateChatSending || !privateChatInput.trim()}
                  style={{ border: '1px solid #b8b8b8', borderRadius: '4px', padding: '8px 10px', fontSize: '12px', background: '#f3f4f6', color: '#374151', opacity: privateChatSending || !privateChatInput.trim() ? 0.6 : 1 }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {isChatConversationsMenuOpen && (
          <div
            data-chat-popover="conversations"
            style={{
              position: 'fixed',
              right: '10px',
              bottom: `${baseDockBottomPx}px`,
              zIndex: 10003,
              width: 'min(360px, calc(100vw - 20px))',
              maxHeight: 'min(560px, calc(100vh - 80px))',
              overflow: 'auto',
              border: '1px solid #4b4b4b',
              borderRadius: '8px',
              background: '#e6e6e6',
              boxShadow: '0 14px 28px rgba(0,0,0,0.45)'
            }}
          >
            <div style={{ height: '36px', background: 'linear-gradient(180deg, #475569 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', color: '#f5f5f5', fontSize: '13px', fontWeight: 700 }}>
              <span>Gesprekken</span>
              <button
                type="button"
                onClick={() => {
                  setIsChatConversationsMenuOpen(false);
                  setPrivateConversationSearchTerm('');
                }}
                style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
                title="Sluit"
              >
                X
              </button>
            </div>
            <div style={{ padding: '8px', display: 'grid', gap: '6px' }}>
              <div style={{ border: '1px solid #b8b8b8', borderRadius: '6px', background: '#f8fafc', padding: '7px' }}>
                <input
                  type="text"
                  value={privateConversationSearchTerm}
                  onChange={(event) => setPrivateConversationSearchTerm(event.target.value)}
                  placeholder="Zoek speler om nieuw gesprek te starten..."
                  style={{ width: '100%', border: '1px solid #b8b8b8', borderRadius: '4px', padding: '7px 9px', fontSize: '12px', background: '#ffffff', color: '#111827' }}
                />
                {privateConversationSearchTerm.trim() ? (
                  <div style={{ marginTop: '6px', display: 'grid', gap: '4px', maxHeight: '170px', overflowY: 'auto' }}>
                    {searchableContacts.length === 0 ? (
                      <p style={{ fontSize: '11px', color: '#6b7280' }}>Geen speler gevonden.</p>
                    ) : (
                      searchableContacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => {
                            openPrivateConversation({
                              key: contact.id,
                              actorId: contact.id,
                              actorName: contact.username
                            });
                            setPrivateConversationSearchTerm('');
                          }}
                          style={{ border: '1px solid #b8b8b8', borderRadius: '4px', padding: '5px 7px', background: '#ffffff', color: '#111827', textAlign: 'left', fontSize: '12px' }}
                          title={`Start gesprek met ${contact.username}`}
                        >
                          {contact.username}
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>

              {privateChatLoading ? (
                <p style={{ fontSize: '12px', color: '#666' }}>Gesprekken laden...</p>
              ) : privateChatError ? (
                <p style={{ fontSize: '12px', color: '#991b1b' }}>{privateChatError}</p>
              ) : privateConversations.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#666' }}>Nog geen gesprekken beschikbaar.</p>
              ) : (
                privateConversations.map((conversation) => {
                  const unreadCount = Number(privateUnreadByConversation[conversation.key] || 0);
                  const isBlocked = isPrivateActorBlocked(conversation.actorId);
                  return (
                    <div
                      key={conversation.key}
                      style={{
                        border: '1px solid #b8b8b8',
                        borderRadius: '6px',
                        padding: '7px 9px',
                        background: '#ffffff',
                        color: '#111827',
                        display: 'grid',
                        gap: '6px'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => openPrivateConversation(conversation)}
                        style={{ background: 'transparent', border: 0, padding: 0, textAlign: 'left', display: 'grid', gap: '3px' }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700 }}>
                          {conversation.actorName}{unreadCount > 0 ? ` (${unreadCount})` : ''}{isBlocked ? ' [Ignored]' : ''}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{conversation.lastText || '(geen inhoud)'}</div>
                      </button>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => toggleIgnoreConversationActor(conversation.actorId)}
                          style={{ border: '1px solid #b8b8b8', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', background: '#f8fafc', color: '#0f172a' }}
                        >
                          {isBlocked ? 'Unignore' : 'Ignore'}
                        </button>
                        <button
                          type="button"
                          onClick={() => softDeleteConversation(conversation.key)}
                          style={{ border: '1px solid #fecaca', borderRadius: '4px', padding: '3px 6px', fontSize: '11px', background: '#fef2f2', color: '#7f1d1d' }}
                        >
                          Verberg
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {isChatSettingsMenuOpen && (
          <div
            data-chat-popover="settings"
            style={{
              position: 'fixed',
              right: `${settingsRightPx}px`,
              bottom: `${settingsBottomPx}px`,
              zIndex: 10002,
              width: 'min(360px, calc(100vw - 20px))',
              maxHeight: 'min(560px, calc(100vh - 80px))',
              overflow: 'auto',
              border: '1px solid #4b4b4b',
              borderRadius: '8px',
              background: '#e6e6e6',
              boxShadow: '0 14px 28px rgba(0,0,0,0.45)'
            }}
          >
            <div style={{ height: '36px', background: 'linear-gradient(180deg, #0e7490 0%, #155e75 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', color: '#f5f5f5', fontSize: '13px', fontWeight: 700 }}>
              <span>Chat instellingen</span>
              <button
                type="button"
                onClick={() => setIsChatSettingsMenuOpen(false)}
                style={{ background: 'transparent', border: 0, color: '#fff', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
                title="Sluit"
              >
                X
              </button>
            </div>

            <div style={{ padding: '10px', display: 'grid', gap: '10px' }}>
              <div style={{ display: 'grid', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setChatUnreadCount(0);
                  }}
                  style={{ border: '1px solid #b8b8b8', borderRadius: '6px', padding: '8px 10px', background: '#ffffff', color: '#111827', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}
                >
                  Markeer Global als gelezen
                </button>
              </div>

              <label style={{ fontSize: '12px', color: '#111827', display: 'grid', gap: '4px' }}>
                Hoogte ({chatWindowHeightPercent}%)
                <input
                  type="range"
                  min={70}
                  max={130}
                  value={chatWindowHeightPercent}
                  onChange={(event) => setChatWindowHeightPercent(Number(event.target.value))}
                />
              </label>

              <label style={{ fontSize: '12px', color: '#111827', display: 'grid', gap: '4px' }}>
                Breedte ({chatWindowWidthPercent}%)
                <input
                  type="range"
                  min={70}
                  max={130}
                  value={chatWindowWidthPercent}
                  onChange={(event) => setChatWindowWidthPercent(Number(event.target.value))}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#111827' }}>
                <input
                  type="checkbox"
                  checked={chatUseBubbles}
                  onChange={(event) => setChatUseBubbles(event.target.checked)}
                />
                Bubbles tonen
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#111827' }}>
                <input
                  type="checkbox"
                  checked={chatShowAvatars}
                  onChange={(event) => setChatShowAvatars(event.target.checked)}
                />
                Avatars tonen
              </label>
            </div>
          </div>
        )}

        <div
          style={{
            position: 'fixed',
            right: '10px',
            bottom: `${chatDockBottomPx}px`,
            zIndex: 10000,
            display: 'flex',
            gap: '4px',
            background: 'rgba(25,25,25,0.95)',
            padding: '4px',
            borderRadius: '6px',
            border: '1px solid #3f3f46',
            maxWidth: 'calc(100vw - 20px)',
            overflowX: 'auto'
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (isChatWidgetOpen && isGlobalChatWindowOpen && activeChannel === 'live') {
                closeChannelWindow();
                return;
              }
              openChannelWindow('live');
            }}
            className={`px-2.5 py-1.5 text-xs rounded border whitespace-nowrap ${isChatWidgetOpen && isGlobalChatWindowOpen && activeChannel === 'live' ? 'border-emerald-600 bg-emerald-900/40 text-emerald-200' : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'}`}
          >
            Global{chatUnreadCount > 0 ? ` (${chatUnreadCount})` : ''}
          </button>

          <button
            type="button"
            onClick={() => {
              if (isChatWidgetOpen && isGlobalChatWindowOpen && activeChannel === 'trade') {
                closeChannelWindow();
                return;
              }
              openChannelWindow('trade');
            }}
            className={`px-2.5 py-1.5 text-xs rounded border whitespace-nowrap ${isChatWidgetOpen && isGlobalChatWindowOpen && activeChannel === 'trade' ? 'border-cyan-600 bg-cyan-900/40 text-cyan-200' : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'}`}
          >
            Trade
          </button>

          <button
            type="button"
            onClick={() => {
              if (isChatWidgetOpen && isGlobalChatWindowOpen && activeChannel === 'faction') {
                closeChannelWindow();
                return;
              }
              openChannelWindow('faction');
            }}
            className={`px-2.5 py-1.5 text-xs rounded border whitespace-nowrap ${isChatWidgetOpen && isGlobalChatWindowOpen && activeChannel === 'faction' ? 'border-cyan-600 bg-cyan-900/40 text-cyan-200' : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'}`}
          >
            Faction
          </button>

          <button
            type="button"
            onClick={openConversationsMenu}
            data-chat-popover-toggle="conversations"
            className={`px-2.5 py-1.5 text-xs rounded border whitespace-nowrap ${isChatConversationsMenuOpen ? 'border-cyan-600 bg-cyan-900/40 text-cyan-200' : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'}`}
          >
            Gesprekken{unreadPrivateTotal > 0 ? ` (${unreadPrivateTotal})` : ''}
          </button>

          {openPrivateConversationKeys.map((conversationKey) => {
            const conversation = privateConversations.find((entry) => entry.key === conversationKey) || (() => {
              const fallbackContact = privateContacts.find(
                (entry) => String(entry?.id || '').trim() === conversationKey
              );
              if (!fallbackContact) return null;
              return {
                key: conversationKey,
                actorId: conversationKey,
                actorName: formatDisplayUsername(fallbackContact.username || 'Onbekend')
              };
            })();
            if (!conversation) return null;
            const unreadCount = Number(privateUnreadByConversation[conversationKey] || 0);
            const isActive = activePrivateConversationKey === conversationKey && isPrivateChatWindowOpen;
            return (
              <div key={conversationKey} style={{ display: 'flex', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      setIsPrivateChatWindowOpen(false);
                      return;
                    }
                    setActivePrivateConversationKey(conversationKey);
                    setIsPrivateChatWindowOpen(true);
                    setIsGlobalChatWindowOpen(false);
                    setIsChatConversationsMenuOpen(false);
                    void persistPrivateConversationRead(conversationKey);
                  }}
                  className={`px-2 py-1.5 text-xs rounded border whitespace-nowrap ${isActive ? 'border-emerald-600 bg-emerald-900/40 text-emerald-200' : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'}`}
                  title={conversation.actorName}
                >
                  {conversation.actorName}{unreadCount > 0 ? ` (${unreadCount})` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => closePrivateConversation(conversationKey)}
                  className="px-1.5 py-1.5 text-xs rounded border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  title="Sluit gesprek"
                >
                  x
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setIsChatSettingsMenuOpen((prev) => !prev);
            }}
            data-chat-popover-toggle="settings"
            className={`px-2.5 py-1.5 text-xs rounded border whitespace-nowrap ${isChatSettingsMenuOpen ? 'border-cyan-600 bg-cyan-900/40 text-cyan-200' : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'}`}
          >
            Instellingen
          </button>
        </div>
      </>,
      document.body
    );
  };

  const renderTopTabs = () => {
    const highlightedTab =
      currentView === 'game'
        ? activeTab
        : currentView === 'crime'
          ? 'misdaad'
          : currentView === 'sports'
            ? 'sporten'
            : currentView === 'prison'
              ? 'stad'
              : null;

    return (
    <div className="top-tabs-nav bg-slate-900 border-b border-slate-800 px-6 py-2 grid grid-cols-7 gap-2 w-full relative" style={{ zIndex: 200 }}>
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
              className={`top-tab-btn w-full px-3 py-1 rounded-lg text-base font-bold border transition ${
                highlightedTab === tab
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
              className={`top-tab-btn w-full px-3 py-1 rounded-lg text-base font-bold border transition ${
                highlightedTab === tab
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
  };

  const renderLeftUtilityMenu = () => {
    if (!user) return null;

    return (
      <aside className="left-utility-menu" aria-label="Snelle navigatie">
        <div className="left-utility-title">Algemeen</div>
        <button
          type="button"
          className="left-utility-item"
          onClick={() => {
            setCityMenuOpen(false);
            setCurrentView('helpdesk');
          }}
        >
          Helpdesk
        </button>
        <button
          type="button"
          className="left-utility-item"
          onClick={() => {
            setCityMenuOpen(false);
            setCurrentView('settings');
          }}
        >
          Instellingen
        </button>
        <button
          type="button"
          className="left-utility-item"
          onClick={() => {
            setCityMenuOpen(false);
            setCurrentView('information');
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
      <div style={{ width: '100%', minWidth: 0, maxWidth: '430px' }}>
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
              <div className="flex items-center justify-between gap-2">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => setCurrentView('profile')}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    setCurrentView('profile');
                  }}
                  className="text-lg font-black leading-tight truncate outline-none text-left cursor-pointer"
                  style={{ ...roleNameColorStyle(userRole), cursor: 'pointer' }}
                  title="Open mijn profiel"
                >
                  {usernameLabel}
                </span>
              </div>
              <p className="text-xs mt-0.5 leading-tight text-slate-400">LVL {stats?.level || 1}</p>
              <p className="text-xs text-emerald-400 font-mono mt-0.5 leading-tight">${stats?.cash?.toLocaleString() || 0}</p>
            </div>
          </div>

          <div className="mt-2 px-2 pb-2" style={{ display: 'grid', gap: '4px' }}>
            <div>
              <div className="flex justify-between items-center text-xs uppercase tracking-wide text-slate-300 leading-tight">
                <span>Energy</span>
                <span className="font-mono text-slate-400 text-xs">{energyCurrent}/{energyMax}  {energyTimerText}</span>
              </div>
              <div className="w-full rounded-sm mt-0.5 overflow-hidden" style={{ height: '6px', background: '#111827', border: '1px solid #374151' }}>
                <div style={{ height: '100%', width: `${energyPercent}%`, background: 'linear-gradient(90deg, #facc15, #f97316)' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs uppercase tracking-wide text-slate-300 leading-tight">
                <span>Nerve</span>
                <span className="font-mono text-slate-400 text-xs">{nerveCurrent}/{nerveMax}  {nerveTimerText}</span>
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
        addLog('Gevangenisleden laden mislukt.', 'error');
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

      const nowMs = Date.now();
      const energyAnchorMs = Number(recoveryAnchorRef.current.energyMs) || nowMs;
      const nerveAnchorMs = Number(recoveryAnchorRef.current.nerveMs) || nowMs;

      const elapsedEnergySeconds = Math.max(0, Math.floor((nowMs - energyAnchorMs) / 1000));
      const elapsedNerveSeconds = Math.max(0, Math.floor((nowMs - nerveAnchorMs) / 1000));

      const energyAtCap = currentEnergy >= maxEnergy;
      const nerveAtCap = currentNerve >= maxNerve;

      const energyCountdown = energyAtCap
        ? null
        : ENERGY_RECOVERY_INTERVAL_SECONDS - (elapsedEnergySeconds % ENERGY_RECOVERY_INTERVAL_SECONDS || ENERGY_RECOVERY_INTERVAL_SECONDS);

      const nerveCountdown = nerveAtCap
        ? null
        : NERVE_RECOVERY_INTERVAL_SECONDS - (elapsedNerveSeconds % NERVE_RECOVERY_INTERVAL_SECONDS || NERVE_RECOVERY_INTERVAL_SECONDS);

      setRecoveryTimers({ energy: energyCountdown, nerve: nerveCountdown });

      if (isSyncing || (energyAtCap && nerveAtCap)) return;

      const energyGain = Math.floor(elapsedEnergySeconds / ENERGY_RECOVERY_INTERVAL_SECONDS);
      const nerveGain = Math.floor(elapsedNerveSeconds / NERVE_RECOVERY_INTERVAL_SECONDS);

      if (energyGain <= 0 && nerveGain <= 0) return;

      const nextEnergy = Math.min(maxEnergy, currentEnergy + energyGain);
      const nextNerve = Math.min(maxNerve, currentNerve + nerveGain);

      if (nextEnergy === currentEnergy && nextNerve === currentNerve) return;

      if (!energyAtCap && energyGain > 0) {
        recoveryAnchorRef.current.energyMs = energyAnchorMs + (energyGain * ENERGY_RECOVERY_INTERVAL_SECONDS * 1000);
      }
      if (!nerveAtCap && nerveGain > 0) {
        recoveryAnchorRef.current.nerveMs = nerveAnchorMs + (nerveGain * NERVE_RECOVERY_INTERVAL_SECONDS * 1000);
      }

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

    if (actionNotice.persist) {
      return;
    }

    const timer = setTimeout(() => setActionNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  useEffect(() => {
    if (currentView === 'helpdesk') return;
    if (!actionNotice?.persist) return;
    setActionNotice(null);
  }, [currentView, actionNotice]);

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

          const incomingIsOwn = isOwnChatMessage(incoming);
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
              onClick={() => setCurrentView('members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon leden"
            >
              Leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-2xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Mijn profiel</h3>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2.5 text-sm">
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
                    <p className="text-xl text-slate-400 tracking-wider"><span style={roleNameColorStyle(userRole)}>{stats?.username ? formatDisplayUsername(stats.username) : 'Onbekend'}</span></p>
                    <button
                      type="button"
                      onClick={() => setIsProfilePhotoMenuOpen((prev) => !prev)}
                      className="mt-2 px-2 py-1 text-xs rounded-md border border-slate-700 hover:bg-slate-800"
                    >
                      {isProfilePhotoMenuOpen ? 'Sluit profielfoto menu' : 'Wijzig profielfoto'}
                    </button>
                  </div>
                </div>

                {isProfilePhotoMenuOpen && (
                  <div className="w-full sm:w-auto sm:min-w-[320px] space-y-2">
                    <p className="text-[11px] text-slate-500 mt-1">Gebruik een URL of upload direct een afbeelding.</p>
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
                )}
              <p className="text-slate-300"><span className="text-slate-500">Rol:</span> <span className={roleColorClass(userRole)}>{roleLabel(userRole)}</span></p>
              <p className="text-slate-300"><span className="text-slate-500">E-mail:</span> {user?.email || email || 'Onbekend'}</p>
              <p className="text-slate-300"><span className="text-slate-500">Gender:</span> {formatGenderLabel(stats?.gender)}</p>
              <p className="text-slate-300"><span className="text-slate-500">Level:</span> {stats?.level || 1}</p>
              <p className="text-slate-300"><span className="text-slate-500">Laatst gezien:</span> {formatLastSeenLabel(stats?.last_updated, stats)}</p>
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
              onClick={() => setCurrentView('members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon leden"
            >
              Leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-4xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Spelerbeheer</h3>

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
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          void openMemberProfile(member);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return;
                          event.preventDefault();
                          void openMemberProfile(member);
                        }}
                        className="text-left min-w-0 cursor-pointer"
                        style={{ cursor: 'pointer' }}
                        title="Open profiel"
                      >
                        <p className="text-sm font-semibold" style={roleNameColorStyle(member.role)}>{formatDisplayUsername(member.username || 'Onbekend')}</p>
                        <p className="text-xs text-slate-400">
                          Level {member.level || 1} | ${member.cash?.toLocaleString() || 0}
                          {' | '}
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

  if (currentView === 'members') {
    const membersQuery = membersSearchTerm.trim().toLowerCase();
    const nowMs = Date.now();
    const onlineMembersCount = onlineMembers.filter((member) => isMemberOnline(member, nowMs)).length;
    const filteredMembers = onlineMembers.filter((member) => {
      if (!membersQuery) return true;
      const usernameValue = (member?.username || '').toLowerCase();
      return usernameValue.includes(membersQuery);
    });
    const sortedMembers = [...filteredMembers].sort((a, b) => {
      const aOnline = isMemberOnline(a, nowMs);
      const bOnline = isMemberOnline(b, nowMs);

      if (aOnline !== bOnline) {
        return aOnline ? -1 : 1;
      }

      const aName = (a?.username || '').toLowerCase();
      const bName = (b?.username || '').toLowerCase();
      return aName.localeCompare(bName);
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
              onClick={() => setCurrentView('members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon leden"
            >
              Leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-3 gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ledenlijst</h3>
              <span className="text-xs text-slate-500">{onlineMembersCount} online | {onlineMembers.length} spelers</span>
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
                {sortedMembers.map((member) => {
                  const memberIsOnline = isMemberOnline(member, nowMs);

                  return (
                  <button
                    key={member.id}
                    onClick={() => {
                      void openMemberProfile(member);
                    }}
                    className="w-full text-left bg-slate-950 border border-slate-850 rounded-xl p-3 flex justify-between items-center hover:bg-slate-800 transition"
                    title="Open profiel"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold truncate" style={roleNameColorStyle(member.role)}>{formatDisplayUsername(member.username || 'Onbekend')}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded border"
                        style={memberIsOnline
                          ? { color: '#86efac', borderColor: 'rgba(34, 197, 94, 0.4)', backgroundColor: 'rgba(22, 101, 52, 0.22)' }
                          : { color: '#94a3b8', borderColor: 'rgba(100, 116, 139, 0.4)', backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
                      >
                        {memberIsOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Level {member.level || 1}
                      {' | '}
                      <span className={roleColorClass(member.role)}>{roleLabel(member.role)}</span>
                    </span>
                  </button>
                  );
                })}
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
              onClick={() => setCurrentView('members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon leden"
            >
              Leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-2xl mx-auto">
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex items-center gap-3 pb-4 mb-3">
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
                <p className="text-xl text-slate-400 tracking-wider"><span style={roleNameColorStyle(selectedMemberProfile.role)}>{selectedMemberName}</span></p>
              </div>

              <p className="text-slate-300"><span className="text-slate-500">Rol:</span> <span className={roleColorClass(selectedMemberProfile.role)}>{roleLabel(selectedMemberProfile.role)}</span></p>
              <p className="text-slate-300"><span className="text-slate-500">Gender:</span> {formatGenderLabel(selectedMemberProfile.gender)}</p>
              <p className="text-slate-300"><span className="text-slate-500">Level:</span> {selectedMemberProfile.level || 1}</p>
              <p className="text-slate-300"><span className="text-slate-500">Laatst gezien:</span> {formatLastSeenLabel(selectedMemberProfile?.last_updated, selectedMemberProfile)}</p>

              {selectedMemberProfile?.id && selectedMemberProfile.id !== user?.id && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => startPrivateConversation(selectedMemberProfile)}
                    className="px-3 py-1.5 text-xs rounded-md border border-emerald-700 text-emerald-300 hover:bg-emerald-950/30"
                  >
                    Start privechat
                  </button>
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
              onClick={() => setCurrentView('members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon leden"
            >
              Leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-3xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Misdaad operaties</h3>

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
                  <span className="text-[10px] font-mono text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">PK</span>
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
                  <span className="text-[10px] font-mono text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">HEIST</span>
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
              onClick={() => setCurrentView('members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon leden"
            >
              Leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-3xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Sporten</h3>

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
                <span className="text-[10px] font-mono text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">GYM</span>
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
              onClick={() => setCurrentView('members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon leden"
            >
              Leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-4xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Celstatus</h3>

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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Gevangenen helpen</h4>
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
                            <p className="text-xs text-slate-400">Level {member.level || 1} | Nog {remaining} sec vast</p>
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

if (currentView === 'helpdesk') {
    const helpdeskDraftKey = buildHelpdeskRequestKey(helpdeskCategory, helpdeskSubject, helpdeskMessage);
    const hasDuplicateDraft = Boolean(helpdeskLastSentKey) && helpdeskDraftKey === helpdeskLastSentKey;

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
              onClick={() => setCurrentView('members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon leden"
            >
              Leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-3xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Helpdesk</h3>

            {actionNotice && (
              <div className={`mb-4 rounded-xl border p-3 text-xs ${actionNotice.type === 'error' ? 'bg-red-950/30 border-red-800/40 text-red-200' : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'}`}>
                {actionNotice.text}
              </div>
            )}

            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-200">Stuur een helpdeskverzoek</p>
                <p className="text-xs text-slate-400">
                  Vul je aanvraag in en verstuur direct vanaf de site.
                </p>

                <div className="grid gap-2">
                  <label className="text-[11px] text-slate-400" htmlFor="helpdesk-category">Categorie</label>
                  <select
                    id="helpdesk-category"
                    value={helpdeskCategory}
                    onChange={(e) => setHelpdeskCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="algemeen">Algemeen</option>
                    <option value="account">Account</option>
                    <option value="betaling">Betaling</option>
                    <option value="bug">Bug</option>
                    <option value="misbruik">Misbruik melden</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-[11px] text-slate-400" htmlFor="helpdesk-subject">Onderwerp</label>
                  <input
                    id="helpdesk-subject"
                    type="text"
                    value={helpdeskSubject}
                    onChange={(e) => setHelpdeskSubject(e.target.value)}
                    placeholder="Kort onderwerp van je vraag"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-[11px] text-slate-400" htmlFor="helpdesk-message">Bericht</label>
                  <textarea
                    id="helpdesk-message"
                    value={helpdeskMessage}
                    onChange={(e) => setHelpdeskMessage(e.target.value)}
                    placeholder="Leg uit wat er aan de hand is."
                    rows={6}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 resize-y"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleSubmitHelpdeskEmail();
                    }}
                    disabled={helpdeskSending || hasDuplicateDraft}
                    className="px-3 py-2 text-slate-300 rounded-lg border border-emerald-700 bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {helpdeskSending ? 'Verzenden...' : hasDuplicateDraft ? 'Al verzonden' : 'Verstuur helpdeskverzoek'}
                  </button>
                </div>

                {hasDuplicateDraft && (
                  <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/20 p-2.5 text-xs text-emerald-200">
                    Deze aanvraag is al verzonden. Pas onderwerp of bericht aan om opnieuw te versturen.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        {renderLeftUtilityMenu()}
        {renderLiveChatWidget()}
      </div>
    );
  }

if (currentView === 'settings') {
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
              onClick={() => setCurrentView('members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon leden"
            >
              Leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-3xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Instellingen</h3>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between pb-4 mb-3">
                <div className="pb-4 mb-3">
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
                    className="px-3 py-2 text-slate-300 rounded-md border border-rose-700 bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {usernameChangeLoading ? 'Opslaan...' : 'Opslaan gebruikersnaam'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">3-20 tekens, alleen letters, cijfers en underscore (_).</p>
                {usernameChangeError && <p className="text-[11px] text-red-300 mt-1">{usernameChangeError}</p>}
              </div>
              </div>
            </div>
          </div>
        </main>
        {renderLeftUtilityMenu()}
        {renderLiveChatWidget()}
      </div>
    );
  }

if (currentView === 'information') {
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
              onClick={() => setCurrentView('members')}
              className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
              title="Toon leden"
            >
              Leden
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-3xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Informatie</h3>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between pb-4 mb-3">
                <div className="pb-4 mb-3">
                <p className="text-xa text-slate-400 uppercase tracking-wider mb-2">Regels</p>
                <div className="flex flex-col">
                  <p className="text-base text-slate-500">1. Respecteer andere spelers en staff.</p>
                  <p className="text-base text-slate-500">2. Luister naar staff en volg hun instructies op.</p>
                  <p className="text-base text-slate-500">3. Geen spam of ongepaste inhoud.</p>
                  <p className="text-base text-slate-500">4. Toestemming van een ouder/verzorger hebben als je 16 bent.</p>
                  <p className="text-base text-slate-500">5. Geen cheats of hacks gebruiken.</p>
                  <p className="text-base text-slate-500">6. Geen misbruik maken van fouten.</p>
                  <p className="text-base text-slate-500">7. Meld bugs en problemen bij helpdesk.</p>
                  <p className="text-base text-slate-500">8. Spelen is op eigen risico.</p>
                  <p className="text-base text-slate-500">9. Racisme/discriminatie is niet toegestaan.</p>
                  <p className="text-base text-slate-500">10. Schelden en pestgedrag zijn niet toegestaan.</p>
                  <p className="text-base text-slate-500">11. Het namaken/vervalsen van systeemberichten is niet toegestaan.</p>
                  <p className="text-base text-slate-500">12. Geen capslock gebruiken (overmatig hoofdletter gebruik)</p>
                  <p className="text-base text-slate-500">13. Niet spammen in berichten of chat.</p>
                  <p className="text-base text-slate-500">14. Geen persoonlijke informatie delen van jezelf of anderen.</p>
                  <p className="text-base text-slate-500">15. Geen reclame maken voor andere servers of diensten.</p>
                </div>
                <div className="mt-6">
                  <p className="text-base">Overtredingen van de regels kunnen leiden tot straffen zoals waarschuwingen, tijdelijke bans of permanente bans.</p>
                </div>
              </div>
              </div>
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
            onClick={() => setCurrentView('members')}
            className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
            title="Toon leden"
          >
            Leden
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
                  Level {stats?.level || 1} | Kruimeldief
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
                     {stats?.strength || 10}
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
              Activiteitenlogboek
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




