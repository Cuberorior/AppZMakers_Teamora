import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Gamepad2, Play, ArrowLeft, Clock, Lock } from 'lucide-react';
import { BACKEND_URL } from '../../../config';
import nsShaftImg from '../../../assets/NS SHAFT.png';
import flappyBirdImg from '../../../assets/flappy game.jpg';
import snakeBiteImg from '../../../assets/SnakeBite.png';

const games = [
  {
    id: 'ns-shaft',
    title: 'NS-SHAFT',
    url: '/ns-shaft/index.html',
    image: nsShaftImg,
    description: 'A classic downward scrolling platformer. Use Left/Right Arrows to move, avoid the spikes at the top and bottom!',
    themeColorClass: 'text-emerald-500',
    themeBgClass: 'bg-emerald-600 hover:bg-emerald-500',
    themeIconClass: 'text-emerald-400',
    themeShadowClass: 'hover:shadow-emerald-500/30'
  },
  {
    id: 'flappy-bird',
    title: 'Flappy Bird',
    url: '/flappy-bird/index.html',
    image: flappyBirdImg,
    description: 'Navigate the bird through the pipes. Use Spacebar, Up Arrow, X, or Click to jump!',
    themeColorClass: 'text-indigo-500',
    themeBgClass: 'bg-indigo-600 hover:bg-indigo-500',
    themeIconClass: 'text-indigo-400',
    themeShadowClass: 'hover:shadow-indigo-500/30'
  },
  {
    id: 'snake-bite',
    title: 'Snake Bite',
    url: '/snake-bite/index.html',
    image: snakeBiteImg,
    description: 'A twist on the classic: you are the apple! Use Arrow Keys to dodge AI-controlled snakes hunting you down.',
    themeColorClass: 'text-cyan-500',
    themeBgClass: 'bg-cyan-600 hover:bg-cyan-500',
    themeIconClass: 'text-cyan-400',
    themeShadowClass: 'hover:shadow-cyan-500/30'
  }
];

const DEFAULT_LIMIT_MINUTES = 10;
const DEFAULT_COOLDOWN_MINUTES = 120;

const getStorageKey = () => {
  try {
    const auth = JSON.parse(localStorage.getItem('wf_auth') || 'null');
    const who = auth?.userId || auth?.email || 'guest';
    return `wf_game_usage_${who}`;
  } catch {
    return 'wf_game_usage_guest';
  }
};

const todayStr = () => new Date().toDateString();

const loadUsage = (limitSeconds) => {
  const key = getStorageKey();
  let usage;
  try {
    usage = JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    usage = null;
  }
  if (!usage || usage.lastResetDate !== todayStr()) {
    usage = { remainingSeconds: limitSeconds, cooldownUntil: null, lastResetDate: todayStr() };
  }
  if (usage.remainingSeconds === undefined || usage.remainingSeconds === null) {
    usage.remainingSeconds = limitSeconds;
  }
  // Cooldown has elapsed: grant a fresh play block so the 10-min-play / 2-hour-wait cycle repeats.
  if (usage.cooldownUntil && usage.cooldownUntil <= Date.now()) {
    usage = { ...usage, remainingSeconds: limitSeconds, cooldownUntil: null };
    saveUsage(usage);
  }
  return usage;
};

const saveUsage = (usage) => {
  const key = getStorageKey();
  localStorage.setItem(key, JSON.stringify(usage));
};

const formatDuration = (totalSeconds) => {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

export function EmployeeGameView() {
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef(null);

  const [gameSettings, setGameSettings] = useState({
    limitMinutes: DEFAULT_LIMIT_MINUTES,
    cooldownMinutes: DEFAULT_COOLDOWN_MINUTES,
  });
  const [usage, setUsage] = useState(null);
  const [now, setNow] = useState(Date.now());

  const selectedGame = games.find(g => g.id === selectedGameId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/admin/settings`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const limitMinutes = Number(data.gameTimeLimitMinutes) || DEFAULT_LIMIT_MINUTES;
        const cooldownMinutes = data.gameCooldownMinutes !== undefined ? Number(data.gameCooldownMinutes) : DEFAULT_COOLDOWN_MINUTES;
        setGameSettings({ limitMinutes, cooldownMinutes });
        setUsage(loadUsage(limitMinutes * 60));
      } catch {
        setUsage(loadUsage(DEFAULT_LIMIT_MINUTES * 60));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Tick clock every second so cooldown/allowance countdowns update live.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // While actively playing, drain the remaining allowance and persist it.
  useEffect(() => {
    if (!isPlaying || !usage) return;
    const interval = setInterval(() => {
      setUsage(prev => {
        if (!prev) return prev;
        const nextRemaining = prev.remainingSeconds - 1;
        if (nextRemaining <= 0) {
          const exhausted = {
            ...prev,
            remainingSeconds: 0,
            cooldownUntil: Date.now() + gameSettings.cooldownMinutes * 60 * 1000,
          };
          saveUsage(exhausted);
          return exhausted;
        }
        const updated = { ...prev, remainingSeconds: nextRemaining };
        saveUsage(updated);
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, usage ? null : usage, gameSettings.cooldownMinutes]);

  // Stop playback the moment the allowance hits zero.
  useEffect(() => {
    if (isPlaying && usage && usage.remainingSeconds <= 0) {
      setIsPlaying(false);
    }
  }, [isPlaying, usage]);

  const refreshUsageForToday = useCallback(() => {
    setUsage(prev => {
      const fresh = loadUsage(gameSettings.limitMinutes * 60);
      if (prev && prev.lastResetDate === fresh.lastResetDate &&
          prev.remainingSeconds === fresh.remainingSeconds &&
          prev.cooldownUntil === fresh.cooldownUntil) {
        return prev;
      }
      return fresh;
    });
  }, [gameSettings.limitMinutes]);

  useEffect(() => {
    refreshUsageForToday();
  }, [now, refreshUsageForToday]);

  const isOnCooldown = usage?.cooldownUntil && usage.cooldownUntil > now;
  const cooldownRemainingSeconds = isOnCooldown ? (usage.cooldownUntil - now) / 1000 : 0;
  const canPlay = !!usage && !isOnCooldown && usage.remainingSeconds > 0;

  const handleBackToGames = () => {
    setSelectedGameId(null);
    setIsPlaying(false);
  };

  const handleIframeLoad = () => {
    iframeRef.current?.contentWindow?.focus();
  };

  const handlePlay = () => {
    if (!canPlay) return;
    setIsPlaying(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Gamepad2 className={`w-6 h-6 ${selectedGameId ? selectedGame.themeColorClass : 'text-indigo-500'}`} />
            Relaxation Area
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Take a quick break and play some games!</p>
        </div>

        <div className="flex items-center gap-3">
          {usage && (
            <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${isOnCooldown ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
              {isOnCooldown ? <Lock className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {isOnCooldown
                ? `Next play in ${formatDuration(cooldownRemainingSeconds)}`
                : `${formatDuration(usage.remainingSeconds)} left today`}
            </div>
          )}
          {selectedGameId && (
            <button
              onClick={handleBackToGames}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Games
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 w-full relative">
        {!selectedGameId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map(game => (
              <div
                key={game.id}
                className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1"
                onClick={() => setSelectedGameId(game.id)}
              >
                <div className="relative w-full h-40 overflow-hidden bg-slate-100 dark:bg-slate-900/50">
                  <img
                    src={game.image}
                    alt={game.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <button className={`absolute bottom-3 right-3 w-14 h-14 rounded-full flex items-center justify-center text-white ${game.themeBgClass} ${game.themeShadowClass} transition-transform transform group-hover:scale-110 shadow-md`}>
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </button>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{game.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{game.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full relative rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center min-h-[420px] sm:min-h-[560px] lg:min-h-[680px]">
            {!isPlaying ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <img
                  src={selectedGame.image}
                  alt={selectedGame.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
                />
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
                <img
                  src={selectedGame.image}
                  alt={selectedGame.title}
                  className="relative w-40 h-40 object-cover rounded-2xl mb-6 shadow-lg border border-white/10"
                />

                {isOnCooldown ? (
                  <>
                    <div className="relative flex items-center gap-3 px-8 py-4 bg-slate-800 text-rose-400 rounded-full font-bold text-lg">
                      <Lock className="w-6 h-6" />
                      Come back in {formatDuration(cooldownRemainingSeconds)}
                    </div>
                    <p className="relative mt-6 text-slate-400 text-sm font-medium">
                      You've used today's play time. Play again once the cooldown ends.
                    </p>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handlePlay}
                      disabled={!canPlay}
                      className={`relative flex items-center gap-3 px-8 py-4 text-white rounded-full font-bold text-lg transition-all transform hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${selectedGame.themeBgClass} ${selectedGame.themeShadowClass}`}
                    >
                      <Play className="w-6 h-6 fill-current" />
                      Play {selectedGame.title}
                    </button>
                    {usage && (
                      <p className="relative mt-4 text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDuration(usage.remainingSeconds)} of play time left today
                      </p>
                    )}
                    <p className="relative mt-3 text-slate-400 text-sm font-medium max-w-md text-center">{selectedGame.description}</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <iframe
                  ref={iframeRef}
                  src={selectedGame.url}
                  title={`${selectedGame.title} Game`}
                  className="w-full h-full border-0 absolute inset-0 bg-white"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                  scrolling="no"
                  onLoad={handleIframeLoad}
                  onMouseEnter={handleIframeLoad}
                />
                {usage && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900/80 text-white backdrop-blur-sm">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(usage.remainingSeconds)}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
