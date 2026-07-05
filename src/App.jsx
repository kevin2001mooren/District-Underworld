import React, { useState, useEffect } from 'react';
import './Game.css';
// We importen Supabase nu direct via een universele ESM CDN om bundler-fouten in de preview te voorkomen
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Shield, Skull, Zap, Swords, Coins, User, Lock, LogOut, Loader2, Award, Clock } from 'lucide-react';

// =========================================================
// ⚠️ VERVANG DEZE TWEE CODES HIERONDER MET JOUW EIGEN KEYS!
// Je vindt deze in Supabase onder: Settings (tandwiel) -> API
// =========================================================
const SUPABASE_URL = "https://utqwbqymcbgoqunpjfff.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cXdicXltY2Jnb3F1bnBqZmZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMTAyMTUsImV4cCI6MjA5ODc4NjIxNX0.jirvlYKUSSmXDT-OC50zOR5TKVYEwT8NFAIFOBGhxSY";
const APP_PUBLIC_URL = "https://district-underworld.vercel.app/";

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

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const NAV_TABS = ['overzicht', 'mijn items', 'woning', 'stad', 'misdaad', 'sporten', 'reizen'];

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
  const [rankMenuOpenId, setRankMenuOpenId] = useState(null);
  const [cityMenuOpen, setCityMenuOpen] = useState(false);
  const [prisonMembers, setPrisonMembers] = useState([]);
  const [prisonLoading, setPrisonLoading] = useState(false);
  const [prisonActionLoadingId, setPrisonActionLoadingId] = useState(null);
  const [prisonActionWarning, setPrisonActionWarning] = useState('');
  const [recoveryTimers, setRecoveryTimers] = useState({ energy: null, nerve: null });

  const normalizeRole = (value) => {
    const roleValue = (value || '').toString().trim().toLowerCase();
    return VALID_ROLES.includes(roleValue) ? roleValue : 'lid';
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
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('player_stats')
        .select('id, username, level, gender, cash, strength, xp, last_updated, jail_until')
        .gte('last_updated', fiveMinutesAgo)
        .order('last_updated', { ascending: false });

      if (error) {
        addLog('❌ Online leden laden mislukt.', 'error');
        setOnlineMembers([]);
      } else {
        setOnlineMembers(data || []);
      }

      setOnlineLoading(false);
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

  const formatCountdown = (totalSeconds) => {
    if (typeof totalSeconds !== 'number' || totalSeconds <= 0) return '00:00';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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
        setUserRole(dbRole !== 'lid' ? dbRole : fallbackRole);
        calculateOfflineRecovery(data);
      }
    } catch (err) {
      console.error(err);
      addLog("❌ Database verbindingsfout.", "error");
    } finally {
      setLoading(false);
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
    const payload = {
      ...updatedFields,
      last_updated: new Date().toISOString()
    };

    setStats(prev => ({ ...prev, ...payload }));

    const { error } = await supabase
      .from('player_stats')
      .update(payload)
      .eq('id', user.id);

    if (error) {
      addLog("🚨 Synchronisatie met cloud database mislukt!", "error");
    }
  };

  // ==========================================
  // GAMEPLAY ACTIONS
  // ==========================================

  const handleTrain = () => {
    if (jailTime > 0) return addLog("❌ Je zit opgesloten! Je kunt nu niet trainen.", "error");
    if (stats.energy < 10) return addLog("❌ Te vermoeid! Je hebt minimaal 10 Energie nodig.", "error");

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
      addLog(`🎉 LEVEL UP! Je bent nu Level ${newLevel}! Energie & Nerve hersteld.`, 'levelup');
    } else {
      addLog(`🏋️ Getraind in de lokale sportschool! Kracht +${strengthGain}, XP +${xpGain}`, 'success');
    }

    newStats.xp = newXp;
    newStats.level = newLevel;
    newStats.max_energy = newMaxEnergy;
    newStats.max_nerve = newMaxNerve;

    updateDB(newStats);
  };

  const handlePickpocket = () => {
    if (jailTime > 0) return addLog("❌ Gevangenen kunnen geen misdaden plegen!", "error");
    if (stats.nerve < 4) return addLog("❌ Je hebt niet genoeg lef (Nerve). Wacht tot het herstelt.", "error");

    const success = Math.random() > 0.25; // 75% kans
    const newStats = { nerve: stats.nerve - 4 };

    if (success) {
      const cashLoot = Math.floor(Math.random() * 80) + 20;
      newStats.cash = stats.cash + cashLoot;
      newStats.xp = stats.xp + 10;
      addLog(`👛 Succes! Je hebt een toerist gerold voor $${cashLoot}. +10 XP.`, 'success');
    } else {
      addLog(`👮 Mislukt! De toerist had je door en je moest met lege handen vluchten!`, 'error');
    }

    updateDB(newStats);
  };

  const handleHeist = () => {
    if (jailTime > 0) return addLog("❌ Je zit momenteel in een cel!", "error");
    if (stats.nerve < 12) return addLog("❌ Je hebt minimaal 12 Nerve nodig voor een bankoverval.", "error");

    const baseSuccess = 0.40;
    const strengthBonus = Math.min(0.20, stats.strength / 200);
    const success = Math.random() < (baseSuccess + strengthBonus);

    const newStats = { nerve: stats.nerve - 12 };

    if (success) {
      const heistLoot = Math.floor(Math.random() * 1500) + 500;
      newStats.cash = stats.cash + heistLoot;
      newStats.xp = stats.xp + 40;
      addLog(`🏦 OVERVAL GESLAAGD! De lokale kluis leeggehaald voor $${heistLoot}! +40 XP.`, 'success');
    } else {
      if (Math.random() > 0.5) {
        const jailUntil = new Date(Date.now() + 60 * 1000).toISOString();
        newStats.jail_until = jailUntil;
        addLog(`🚨 COPS! De SWAT was te snel ter plaatse. 60 seconden gevangenisstraf.`, 'jail');
      } else {
        addLog(`🏃 Alarm ging af! Je bent ternauwernood ontsnapt zonder buit.`, 'error');
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

  const performAdminAction = async (member, action) => {
    if (!STAFF_ROLES.includes(userRole)) return;

    try {
      setAdminActionLoadingId(member.id);

      if (action === 'cash') {
        if (userRole !== 'admin' && userRole !== 'moderator') {
          throw new Error('Alleen admins en moderators mogen cash geven.');
        }

        if (member.id === user?.id) {
          const nextCash = (stats?.cash || 0) + 1000;
          await updateDB({ cash: nextCash });
          addLog(`🛠️ Admin: ${formatDisplayUsername(member.username)} kreeg +$1.000.`, 'success');
          await refreshAdminMembers();
          return;
        }

        const { error } = await supabase.rpc('admin_apply_action', {
          p_target_id: member.id,
          p_action: 'cash'
        });
        if (error) throw error;
        addLog(`🛠️ Admin: ${formatDisplayUsername(member.username)} kreeg +$1.000.`, 'success');
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
          addLog(`🛠️ Admin: ${formatDisplayUsername(member.username)} volledig hersteld.`, 'success');
          await refreshAdminMembers();
          return;
        }

        const { error } = await supabase.rpc('admin_apply_action', {
          p_target_id: member.id,
          p_action: 'recover'
        });
        if (error) throw error;
        addLog(`🛠️ Admin: ${formatDisplayUsername(member.username)} volledig hersteld.`, 'success');
      }

      if (action === 'jail') {
        if (userRole !== 'admin' && userRole !== 'moderator') {
          throw new Error('Alleen admins en moderators mogen iemand opsluiten.');
        }

        if (member.id === user?.id) {
          const selfJailUntil = new Date(Date.now() + ADMIN_JAIL_SECONDS * 1000).toISOString();
          await updateDB({ jail_until: selfJailUntil });
          addLog(`🚓 Admin: je zit ${ADMIN_JAIL_SECONDS} sec in de cel.`, 'jail');
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

        addLog(`🚓 Admin: ${formatDisplayUsername(member.username)} zit ${ADMIN_JAIL_SECONDS} sec in de cel.`, 'jail');
      }

      if (action.startsWith('set-role:')) {
        if (userRole !== 'admin') {
          throw new Error('Alleen admins mogen rollen wijzigen.');
        }
        const nextRole = normalizeRole(action.replace('set-role:', ''));

        if (member.id === user?.id && nextRole !== 'admin') {
          throw new Error('Je kunt je eigen adminrechten niet verwijderen.');
        }

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

        addLog(`🛠️ Rol aangepast: ${formatDisplayUsername(member.username)} is nu ${nextRole}.`, 'success');
        setRankMenuOpenId(null);
      }

      await refreshAdminMembers();
    } catch (err) {
      addLog(`❌ Admin actie mislukt: ${err.message}`, 'error');
    } finally {
      setAdminActionLoadingId(null);
    }
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
                setActiveTab(tab);
                setCurrentView(tab === 'misdaad' ? 'crime' : 'game');
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

  // Loader screen
  const canOpenStaffPanel = STAFF_ROLES.includes(userRole);
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

  const renderHeaderPlayerInfo = () => {
    if (!stats) return null;

    const energyTimerText =
      (stats?.energy || 0) >= (stats?.max_energy || 100)
        ? 'Energie vol'
        : `+1 Energie in ${formatCountdown(recoveryTimers.energy)}`;

    const nerveTimerText =
      (stats?.nerve || 0) >= (stats?.max_nerve || 20)
        ? 'Lef vol'
        : `+1 Lef in ${formatCountdown(recoveryTimers.nerve)}`;

    return (
      <>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Skull className="h-6 w-6 text-rose-500" />
            <p className="text-lg text-slate-100 font-extrabold uppercase tracking-wide leading-none">District Underworld</p>
          </div>
          <h1 className="text-base font-bold text-white leading-tight">{stats?.username ? formatDisplayUsername(stats.username) : 'Onbekend'}</h1>
          <p className="text-[10px] text-slate-400 font-mono">
            Level {stats?.level || 1} • ${stats?.cash?.toLocaleString() || 0} • Energie {stats?.energy || 0}/{stats?.max_energy || 100} • Lef {stats?.nerve || 0}/{stats?.max_nerve || 20}
          </p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            {energyTimerText} • {nerveTimerText}
          </p>
        </div>
      </>
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
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
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              title="Log uit"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-2xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">👤 Mijn profiel</h3>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2.5 text-sm">
              <p className="text-slate-300"><span className="text-slate-500">Gebruikersnaam:</span> {stats?.username ? formatDisplayUsername(stats.username) : 'Onbekend'}</p>
              <p className="text-slate-300"><span className="text-slate-500">E-mail:</span> {user?.email || email || 'Onbekend'}</p>
              <p className="text-slate-300"><span className="text-slate-500">Gender:</span> {formatGenderLabel(stats?.gender)}</p>
              <p className="text-slate-300"><span className="text-slate-500">Level:</span> {stats?.level || 1}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (currentView === 'admin' && canOpenStaffPanel) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
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
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              title="Log uit"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-4xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">🛠️ Spelerbeheer</h3>

            {adminLoading ? (
              <p className="text-xs text-slate-400">Spelers laden...</p>
            ) : adminMembers.length === 0 ? (
              <p className="text-xs text-slate-500">Geen spelers gevonden.</p>
            ) : (
              <div className="space-y-2.5">
                {adminMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`bg-slate-950 border border-slate-850 rounded-xl p-3 relative ${rankMenuOpenId === member.id ? 'z-20' : ''}`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{formatDisplayUsername(member.username || 'Onbekend')}</p>
                        <p className="text-xs text-slate-400">
                          Level {member.level || 1} • ${member.cash?.toLocaleString() || 0}
                          {' • '}
                          <span className={roleColorClass(member.role)}>
                            {roleLabel(member.role)}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {canManageRoles && (
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
                        <button
                          onClick={() => performAdminAction(member, 'cash')}
                          disabled={adminActionLoadingId === member.id || !canGiveCash}
                          className="staff-btn staff-btn-cash"
                        >
                          +$1.000
                        </button>
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
      </div>
    );
  }

  if (currentView === 'online-members') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
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
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              title="Log uit"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">🟢 Online leden</h3>
              <span className="text-xs text-slate-500">{onlineMembers.length} online</span>
            </div>

            {onlineLoading ? (
              <p className="text-xs text-slate-400">Online leden laden...</p>
            ) : onlineMembers.length === 0 ? (
              <p className="text-xs text-slate-500">Er zijn nu geen leden online.</p>
            ) : (
              <div className="space-y-2.5">
                {onlineMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setSelectedMemberProfile(member);
                      setCurrentView('member-profile');
                    }}
                    className="w-full text-left bg-slate-950 border border-slate-850 rounded-xl p-3 flex justify-between items-center hover:bg-slate-800 transition"
                    title="Open profiel"
                  >
                    <span className="text-sm text-slate-200 font-semibold">{formatDisplayUsername(member.username || 'Onbekend')}</span>
                    <span className="text-xs text-slate-400 font-mono">Level {member.level || 1}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (currentView === 'member-profile' && selectedMemberProfile) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
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
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              title="Log uit"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-2xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">👤 {formatDisplayUsername(selectedMemberProfile.username || 'Onbekend')}</h3>
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-2.5 text-sm">
              <p className="text-slate-300"><span className="text-slate-500">Gebruikersnaam:</span> {formatDisplayUsername(selectedMemberProfile.username || 'Onbekend')}</p>
              <p className="text-slate-300"><span className="text-slate-500">Gender:</span> {formatGenderLabel(selectedMemberProfile.gender)}</p>
              <p className="text-slate-300"><span className="text-slate-500">Level:</span> {selectedMemberProfile.level || 1}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (currentView === 'crime') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
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
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              title="Log uit"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {renderTopTabs()}

        <main className="flex-grow p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl max-w-3xl mx-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">💀 Misdaad operaties</h3>

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
      </div>
    );
  }

  if (currentView === 'prison') {
    const rescueTargets = prisonMembers.filter((member) => member.id !== user?.id && getRemainingJailSeconds(member.jail_until) > 0);

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
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
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              title="Log uit"
            >
              <LogOut className="h-4 w-4" />
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
      </div>
    );
  }

  // Active Game Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          {renderHeaderPlayerInfo()}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-xs">
            <p className="text-slate-400">Ingelogd als:</p>
            <button
              onClick={() => setCurrentView('profile')}
              className="text-rose-400 font-bold hover:underline"
              title="Open mijn profiel"
            >
              {stats?.username ? formatDisplayUsername(stats.username) : email}
            </button>
          </div>
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
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
            title="Log uit"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {renderTopTabs()}

      {/* GAME SECTION */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto">
        {/* STATS & ACTIONS (Left 5 Cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* STATS CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">{stats?.username ? formatDisplayUsername(stats.username) : "Petty Criminal"}</h2>
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

          {/* GAME OPERATIONS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-grow flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <Swords className="h-4 w-4" /> Misdaad Operaties
              </h3>
              
              <div className="space-y-3">
                {/* Gym */}
                <button 
                  onClick={handleTrain}
                  className="w-full bg-slate-850 hover:bg-slate-800 active:bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 flex justify-between items-center transition"
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

                {/* Pickpocket */}
                <button 
                  onClick={handlePickpocket}
                  className="w-full bg-slate-850 hover:bg-slate-800 active:bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 flex justify-between items-center transition"
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

                {/* Heist */}
                <button 
                  onClick={handleHeist}
                  className="w-full bg-slate-850 hover:bg-rose-950/20 hover:border-rose-900/40 text-white p-3.5 rounded-xl border border-slate-800 flex justify-between items-center transition"
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

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 mt-6 text-xs text-slate-400 flex items-center gap-3">
              <Award className="h-5 w-5 text-rose-500 shrink-0" />
              <p>Energie (+1/min) & Nerve (+0.2/min) herstellen volautomatisch, zelfs als je offline bent!</p>
            </div>
          </div>
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
    </div>
  );
}