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

const getEmailRedirectUrl = () => {
  const host = window.location.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';
  return isLocalhost ? null : `${window.location.origin}/`;
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [user, setUser] = useState(null);
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
  const [showOnlineMembers, setShowOnlineMembers] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [onlineLoading, setOnlineLoading] = useState(false);

  // Check active session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPlayerStats(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPlayerStats(session.user);
      } else {
        setStats(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Jail Timer countdown logic
  useEffect(() => {
    if (jailTime <= 0) return;
    const interval = setInterval(() => {
      setJailTime(prev => {
        if (prev <= 1) {
          addLog("🔓 Je hebt je straf uitgezeten! Je bent weer een vrij man.", "success");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [jailTime]);

  useEffect(() => {
    if (!showOnlineMembers || !user) return;

    const fetchOnlineMembers = async () => {
      setOnlineLoading(true);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('player_stats')
        .select('id, username, level, last_updated')
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
  }, [showOnlineMembers, user]);

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
        setJailTime(60);
        addLog(`🚨 COPS! De SWAT was te snel ter plaatse. 60 seconden gevangenisstraf.`, 'jail');
      } else {
        addLog(`🏃 Alarm ging af! Je bent ternauwernood ontsnapt zonder buit.`, 'error');
      }
    }

    updateDB(newStats);
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
    supabase.auth.signOut();
  };

  // Loader screen
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

  // Active Game Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Skull className="h-6 w-6 text-rose-500" />
          <div>
            <h1 className="text-base font-bold text-white leading-tight">District Underworld</h1>
            <p className="text-[10px] text-slate-400 font-mono">Geautoriseerde maffia-omgeving</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-xs">
            <p className="text-slate-400">Ingelogd als:</p>
            <p className="text-rose-400 font-bold">{stats?.username ? formatDisplayUsername(stats.username) : email}</p>
          </div>
          <button
            onClick={() => setShowOnlineMembers(prev => !prev)}
            className="px-2 py-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition text-xs border border-slate-800"
            title="Toon online leden"
          >
            {showOnlineMembers ? 'Verberg leden' : 'Online leden'}
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
          {showOnlineMembers && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
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
                    <div key={member.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex justify-between items-center">
                      <span className="text-sm text-slate-200 font-semibold">{formatDisplayUsername(member.username || 'Onbekend')}</span>
                      <span className="text-xs text-slate-400 font-mono">Level {member.level || 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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