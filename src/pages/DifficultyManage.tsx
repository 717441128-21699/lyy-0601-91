import { useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Settings, Music, Edit3, Trash2, Upload, Lock, Check, X, Disc3, AlertCircle } from 'lucide-react';
import NeonButton from '../components/ui/NeonButton';
import NeonCard from '../components/ui/NeonCard';
import StatDisplay from '../components/ui/StatDisplay';
import { useSongStore } from '../store/songStore';
import { parseJsonChart } from '../parser/jsonParser';
import { readJsonFile } from '../utils/file';
import { cn, formatTime } from '../lib/utils';
import type { Difficulty, Chart } from '../types/song';

const DifficultyManage = () => {
  const navigate = useNavigate();
  const { songId } = useParams<{ songId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    songs,
    isBuiltInSong,
    isBuiltInDifficulty,
    updateDifficulty,
    removeDifficulty,
    replaceDifficultyChart,
    getChart,
  } = useSongStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLevel, setEditLevel] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const song = useMemo(() => {
    return songs.find((s) => s.id === songId) || null;
  }, [songs, songId]);

  const songIsBuiltIn = useMemo(() => {
    return song ? isBuiltInSong(song.id) : false;
  }, [song, isBuiltInSong]);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const startEdit = (diff: Difficulty) => {
    setEditingId(diff.id);
    setEditName(diff.name);
    setEditLevel(diff.level);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditLevel(0);
  };

  const saveEdit = (difficultyId: string) => {
    if (!song) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      showStatus('error', '难度名称不能为空');
      return;
    }

    if (editLevel < 1 || editLevel > 20) {
      showStatus('error', '等级必须在 1-20 之间');
      return;
    }

    updateDifficulty(song.id, difficultyId, {
      name: trimmedName,
      level: editLevel,
    });

    setEditingId(null);
    setEditName('');
    setEditLevel(0);
    showStatus('success', '难度已更新');
  };

  const handleDelete = (difficultyId: string) => {
    if (!song) return;
    removeDifficulty(song.id, difficultyId);
    setShowDeleteConfirm(null);
    showStatus('success', '难度已删除');
  };

  const handleReplaceChart = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !replaceTargetId || !song) return;

    try {
      const data = await readJsonFile(files[0]);
      const chart = parseJsonChart(data);

      if (!chart.song || !chart.difficulty) {
        showStatus('error', '谱面格式不正确');
        return;
      }

      const fullChart: Chart = {
        ...chart,
        difficulty: {
          ...chart.difficulty,
          id: replaceTargetId,
          songId: song.id,
          noteCount: chart.notes.length,
          chartFile: files[0].name,
        },
      };

      replaceDifficultyChart(song.id, replaceTargetId, fullChart);
      showStatus('success', '谱面已替换');
    } catch (err) {
      showStatus('error', '谱面解析失败');
    } finally {
      setReplaceTargetId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 5) return 'green';
    if (level <= 10) return 'cyan';
    if (level <= 15) return 'pink';
    return 'red';
  };

  const getDifficultyGlowColor = (level: number) => {
    if (level <= 5) return 'green';
    if (level <= 10) return 'cyan';
    if (level <= 15) return 'pink';
    return 'none';
  };

  if (!song) {
    return (
      <div className="relative w-full h-full bg-dark-bg grid-bg flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-neon-red mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl text-gray-300 mb-2">未找到歌曲</h2>
          <p className="font-body text-gray-500 mb-6">歌曲不存在或已被删除</p>
          <NeonButton variant="primary" onClick={() => navigate('/packs')}>
            返回曲包管理
          </NeonButton>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-dark-bg grid-bg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-neon-purple/5 via-transparent to-neon-pink/5" />

      <div className="absolute top-10 right-20 w-40 h-40 rounded-full bg-neon-purple/10 blur-3xl animate-float" />
      <div className="absolute bottom-10 left-20 w-32 h-32 rounded-full bg-neon-pink/10 blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      <div className="relative h-full flex flex-col">
        <header className="flex items-center justify-between px-8 py-4 border-b-2 border-dark-border bg-dark-panel/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <NeonButton variant="secondary" size="sm" onClick={() => navigate('/packs')}>
              <ArrowLeft className="w-4 h-4" />
            </NeonButton>
            <div className="relative">
              <h1 className="font-pixel text-2xl gradient-text glitch" data-text="DIFFICULTY MANAGE">
                DIFFICULTY MANAGE
              </h1>
              <div className="text-xs font-body text-neon-purple mt-1">难度管理</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StatDisplay label="难度" value={song.difficulties.length} color="pink" className="px-4" />
            {songIsBuiltIn && (
              <span className="px-3 py-1 rounded text-sm font-pixel bg-neon-purple/20 text-neon-purple border border-neon-purple/30 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                内置歌曲
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {statusMessage && (
              <div
                className={cn(
                  'mb-6 p-4 rounded-lg border-2 flex items-center gap-3',
                  statusMessage.type === 'success' && 'border-neon-green bg-neon-green/10',
                  statusMessage.type === 'error' && 'border-neon-red bg-neon-red/10'
                )}
              >
                {statusMessage.type === 'success' ? (
                  <Check className="w-5 h-5 text-neon-green flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-neon-red flex-shrink-0" />
                )}
                <span className="font-body text-sm">{statusMessage.message}</span>
              </div>
            )}

            <NeonCard glowColor="purple" className="p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-neon-purple/30 via-neon-pink/20 to-neon-cyan/30 flex items-center justify-center flex-shrink-0">
                  <Disc3 className="w-10 h-10 text-white/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-2xl text-white mb-1">{song.title}</h3>
                  <p className="font-body text-neon-pink mb-3">{song.artist}</p>
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-500 font-pixel">BPM </span>
                      <span className="font-display text-neon-yellow">{song.bpm}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-pixel">时长 </span>
                      <span className="font-display text-neon-cyan">{formatTime(song.duration * 1000)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-pixel">总音符 </span>
                      <span className="font-display text-neon-pink">
                        {song.difficulties.reduce((sum, d) => sum + d.noteCount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </NeonCard>

            <h3 className="font-pixel text-sm text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-neon-purple" />
              难度列表
            </h3>

            <div className="space-y-4">
              {song.difficulties.map((diff) => {
                const isBuiltIn = isBuiltInDifficulty(song.id, diff.id);
                const isEditing = editingId === diff.id;
                const color = getDifficultyColor(diff.level);
                const glowColor = getDifficultyGlowColor(diff.level);
                const chart = getChart(diff.id);

                return (
                  <NeonCard
                    key={diff.id}
                    glowColor={glowColor as 'green' | 'cyan' | 'pink' | 'none'}
                    className={cn(
                      'p-5',
                      isEditing && 'border-neon-yellow shadow-neon-yellow'
                    )}
                  >
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-pixel text-neon-yellow mb-2">难度名称</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-4 py-2 bg-dark-panel border-2 border-neon-yellow/50 rounded-lg text-white font-display focus:border-neon-yellow focus:outline-none"
                              placeholder="例如：Hard"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-pixel text-neon-yellow mb-2">等级 (1-20)</label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={editLevel}
                              onChange={(e) => setEditLevel(parseInt(e.target.value) || 0)}
                              className="w-full px-4 py-2 bg-dark-panel border-2 border-neon-yellow/50 rounded-lg text-white font-display focus:border-neon-yellow focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <NeonButton variant="secondary" size="sm" onClick={cancelEdit}>
                            <X className="w-4 h-4 mr-2" />
                            取消
                          </NeonButton>
                          <NeonButton variant="success" size="sm" onClick={() => saveEdit(diff.id)}>
                            <Check className="w-4 h-4 mr-2" />
                            保存
                          </NeonButton>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              'w-16 h-16 rounded-lg flex items-center justify-center font-display font-bold text-2xl',
                              color === 'green' && 'bg-neon-green/20 text-neon-green',
                              color === 'cyan' && 'bg-neon-cyan/20 text-neon-cyan',
                              color === 'pink' && 'bg-neon-pink/20 text-neon-pink',
                              color === 'red' && 'bg-neon-red/20 text-neon-red'
                            )}
                          >
                            Lv.{diff.level}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-display font-bold text-xl text-white">{diff.name}</span>
                              {isBuiltIn && (
                                <span className="px-2 py-0.5 rounded text-xs font-pixel bg-neon-purple/20 text-neon-purple border border-neon-purple/30 flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  内置
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>{diff.keys} 键</span>
                              <span>·</span>
                              <span>{diff.noteCount.toLocaleString()} 音符</span>
                              {chart && (
                                <>
                                  <span>·</span>
                                  <span>{chart.notes.length} 个音符对象</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isBuiltIn && (
                            <>
                              <NeonButton
                                variant="secondary"
                                size="sm"
                                onClick={() => startEdit(diff)}
                              >
                                <Edit3 className="w-4 h-4" />
                              </NeonButton>
                              <NeonButton
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setReplaceTargetId(diff.id);
                                  fileInputRef.current?.click();
                                }}
                              >
                                <Upload className="w-4 h-4" />
                              </NeonButton>
                              <NeonButton
                                variant="danger"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(diff.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </NeonButton>
                            </>
                          )}
                          {isBuiltIn && (
                            <span className="text-xs text-gray-500 font-pixel">内置难度不可修改</span>
                          )}
                        </div>
                      </div>
                    )}

                    {showDeleteConfirm === diff.id && (
                      <div className="mt-4 p-4 rounded-lg border-2 border-neon-red bg-neon-red/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-neon-red" />
                            <span className="font-body text-neon-red">
                              确定要删除难度「{diff.name}」吗？此操作无法撤销。
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <NeonButton
                              variant="secondary"
                              size="sm"
                              onClick={() => setShowDeleteConfirm(null)}
                            >
                              取消
                            </NeonButton>
                            <NeonButton
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(diff.id)}
                            >
                              删除
                            </NeonButton>
                          </div>
                        </div>
                      </div>
                    )}
                  </NeonCard>
                );
              })}
            </div>

            {song.difficulties.length === 0 && (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="font-body text-gray-500 text-lg">暂无难度</p>
                <p className="font-body text-gray-600 text-sm mt-2">
                  从曲包管理导入谱面来添加难度
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        className="hidden"
        onChange={handleReplaceChart}
      />

      <div className="crt-overlay" />
    </div>
  );
};

export default DifficultyManage;
