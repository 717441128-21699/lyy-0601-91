import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, FolderOpen, Music, Filter, Zap, ArrowRight, Wrench } from 'lucide-react';
import SongCard from '../components/SongSelect/SongCard';
import NeonButton from '../components/ui/NeonButton';
import NeonCard from '../components/ui/NeonCard';
import StatDisplay from '../components/ui/StatDisplay';
import { useSongStore } from '../store/songStore';
import { useSettingsStore } from '../store/settingsStore';
import { cn, formatTime } from '../lib/utils';
import type { Song } from '../types/song';

const SongSelect = () => {
  const navigate = useNavigate();
  const { songs, selectedSong, selectSong, getBestScore } = useSongStore();
  const { settings } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBpm, setFilterBpm] = useState<[number, number]>([0, 300]);
  const [filterKeys, setFilterKeys] = useState<'all' | 4 | 6>('all');
  const [filterLevel, setFilterLevel] = useState<[number, number]>([0, 20]);

  useEffect(() => {
    if (songs.length > 0 && !selectedSong) {
      selectSong(songs[0]);
    }
  }, [songs, selectedSong, selectSong]);

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const matchesSearch =
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBpm = song.bpm >= filterBpm[0] && song.bpm <= filterBpm[1];
      const matchesKeys =
        filterKeys === 'all' || song.difficulties.some((d) => d.keys === Number(filterKeys));
      const maxLevel = Math.max(...song.difficulties.map((d) => d.level));
      const matchesLevel = maxLevel >= filterLevel[0] && maxLevel <= filterLevel[1];

      return matchesSearch && matchesBpm && matchesKeys && matchesLevel;
    });
  }, [songs, searchQuery, filterBpm, filterKeys, filterLevel]);

  const totalNotes = useMemo(() => {
    return selectedSong?.difficulties.reduce((sum, d) => sum + d.noteCount, 0) || 0;
  }, [selectedSong]);

  const handleSongSelect = (song: Song) => {
    selectSong(song);
  };

  const handleStartGame = () => {
    if (selectedSong) {
      navigate(`/difficulty/${selectedSong.id}`);
    }
  };

  const handlePracticeMode = () => {
    if (selectedSong) {
      navigate(`/practice/${selectedSong.id}`);
    }
  };

  return (
    <div className="relative w-full h-full bg-dark-bg grid-bg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/5 via-transparent to-neon-pink/5" />

      <div className="relative h-full flex flex-col">
        <header className="flex items-center justify-between px-8 py-4 border-b-2 border-dark-border">
          <div className="flex items-center gap-4">
            <div className="relative">
              <h1 className="font-pixel text-2xl gradient-text glitch" data-text="ARCADE RHYTHM">
                ARCADE RHYTHM
              </h1>
              <div className="text-xs font-body text-neon-cyan mt-1">SELECT YOUR SONG</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="搜索歌曲..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-dark-panel border-2 border-dark-border rounded-lg pl-10 pr-4 py-2 w-64 font-body focus:outline-none focus:border-neon-cyan transition-colors"
              />
            </div>

            <NeonButton
              variant="secondary"
              size="sm"
              onClick={() => navigate('/packs')}
              className="flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              曲包
            </NeonButton>

            <NeonButton
              variant="secondary"
              size="sm"
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              设置
            </NeonButton>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-2/3 p-6 overflow-y-auto">
            <div className="flex items-center gap-4 mb-4">
              <Filter className="w-5 h-5 text-neon-purple" />
              <span className="font-body text-gray-400">筛选:</span>

              <select
                value={filterKeys}
                onChange={(e) => setFilterKeys(e.target.value as 'all' | 4 | 6)}
                className="text-sm"
              >
                <option value="all">全部键位</option>
                <option value="4">4键</option>
                <option value="6">6键</option>
              </select>

              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-neon-yellow" />
                <input
                  type="range"
                  min="0"
                  max="300"
                  value={filterBpm[1]}
                  onChange={(e) => setFilterBpm([0, parseInt(e.target.value)])}
                  className="w-32"
                />
                <span className="font-display text-sm text-neon-yellow">{filterBpm[1]} BPM</span>
              </div>
            </div>

            <div className="space-y-3">
              {filteredSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  selected={selectedSong?.id === song.id}
                  onClick={() => handleSongSelect(song)}
                  bestScore={
                    Math.max(
                      ...song.difficulties.map(
                        (d) => getBestScore(d.id)?.score || 0
                      )
                    ) || undefined
                  }
                />
              ))}

              {filteredSongs.length === 0 && (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="font-body text-gray-500 text-lg">没有找到匹配的歌曲</p>
                  <p className="font-body text-gray-600 text-sm mt-2">尝试调整筛选条件</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-1/3 p-6 border-l-2 border-dark-border bg-dark-panel/30">
            {selectedSong ? (
              <div className="h-full flex flex-col">
                <div className="relative aspect-video rounded-xl overflow-hidden mb-6 bg-gradient-to-br from-neon-purple/40 via-neon-pink/20 to-neon-cyan/40">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Music className="w-24 h-24 text-white/20" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h2 className="font-display font-bold text-2xl text-white text-glow-pink">
                      {selectedSong.title}
                    </h2>
                    <p className="font-body text-neon-cyan">{selectedSong.artist}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <StatDisplay label="BPM" value={selectedSong.bpm} color="yellow" />
                  <StatDisplay
                    label="时长"
                    value={formatTime(selectedSong.duration * 1000)}
                    color="cyan"
                  />
                  <StatDisplay label="音符" value={totalNotes.toLocaleString()} color="pink" />
                </div>

                <h3 className="font-pixel text-sm text-gray-400 uppercase tracking-wider mb-3">
                  难度选择
                </h3>

                <div className="space-y-2 mb-6 flex-1 overflow-y-auto">
                  {selectedSong.difficulties.map((diff) => {
                    const best = getBestScore(diff.id);
                    const levelColor =
                      diff.level <= 5
                        ? 'border-neon-green text-neon-green'
                        : diff.level <= 10
                        ? 'border-neon-cyan text-neon-cyan'
                        : diff.level <= 15
                        ? 'border-neon-pink text-neon-pink'
                        : 'border-neon-red text-neon-red';

                    return (
                      <div
                        key={diff.id}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all',
                          levelColor,
                          'bg-dark-panel/50 hover:bg-dark-panel'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold',
                                diff.keys === 4 ? 'bg-neon-cyan/20' : 'bg-neon-purple/20'
                              )}
                            >
                              {diff.keys}K
                            </div>
                            <div>
                              <div className="font-display font-bold">{diff.name}</div>
                              <div className="text-xs font-body text-gray-500">
                                {diff.noteCount} 音符
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn('font-display font-bold text-xl', levelColor.split(' ')[1])}>
                              Lv.{diff.level}
                            </div>
                            {best && (
                              <div className="text-xs font-display text-neon-green">
                                BEST: {best.score.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <NeonButton
                    variant="primary"
                    size="lg"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleStartGame}
                  >
                    开始游戏
                    <ArrowRight className="w-5 h-5" />
                  </NeonButton>

                  <div className="grid grid-cols-2 gap-3">
                    <NeonButton
                      variant="secondary"
                      className="w-full"
                      onClick={handlePracticeMode}
                    >
                      练习模式
                    </NeonButton>

                    <NeonButton
                      variant="secondary"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => selectedSong && navigate(`/difficulty-manage/${selectedSong.id}`)}
                    >
                      <Wrench className="w-4 h-4" />
                      难度管理
                    </NeonButton>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="font-body text-gray-500">选择一首歌曲开始</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="crt-overlay" />
    </div>
  );
};

export default SongSelect;
