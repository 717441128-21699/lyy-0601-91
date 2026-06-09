import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderOpen, Upload, Trash2, Music, Disc3, AlertCircle, CheckCircle, Loader2, Package, Sparkles, Settings, Edit3 } from 'lucide-react';
import NeonButton from '../components/ui/NeonButton';
import NeonCard from '../components/ui/NeonCard';
import StatDisplay from '../components/ui/StatDisplay';
import ProgressBar from '../components/ui/ProgressBar';
import { useSongStore } from '../store/songStore';
import { parseJsonChart } from '../parser/jsonParser';
import { readJsonFile } from '../utils/file';
import { generateId } from '../utils/math';
import { cn, formatTime } from '../lib/utils';
import type { Song, Chart, Difficulty } from '../types/song';
import type { ImportPreviewItem, ImportPreview } from '../store/songStore';

interface ImportStatus {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface PackInfo {
  folder: string;
  songs: Song[];
  totalNotes: number;
}

const PackManager = () => {
  const navigate = useNavigate();
  const { songs, addSong, removeSong, setLoading, isLoading, setImportPreview, isBuiltInSong, isBuiltInDifficulty } = useSongStore();

  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const directoryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList | File[], source: 'scan' | 'import') => {
    const fileArray = Array.isArray(files) ? files : Array.from(files);
    const jsonFiles = fileArray.filter((f) => f.name.endsWith('.json'));

    if (jsonFiles.length === 0) {
      setImportStatus({ type: 'info', message: '未发现 JSON 谱面文件' });
      return;
    }

    setImportStatus({ type: 'info', message: `正在解析 ${jsonFiles.length} 个谱面...` });

    const previewItems: ImportPreviewItem[] = [];
    let failCount = 0;

    for (let i = 0; i < jsonFiles.length; i++) {
      const file = jsonFiles[i];
      try {
        const data = await readJsonFile(file);
        const chart = parseJsonChart(data);

        if (!chart.song || !chart.difficulty) {
          failCount++;
          continue;
        }

        const existingSong = songs.find(
          (s) =>
            s.title.toLowerCase() === chart.song.title.toLowerCase() &&
            s.artist.toLowerCase() === chart.song.artist.toLowerCase()
        );

        const difficultyId = generateId();
        const songId = existingSong?.id || generateId();

        const difficulty: Difficulty = {
          id: difficultyId,
          songId,
          name: chart.difficulty.name,
          level: chart.difficulty.level,
          keys: chart.difficulty.keys,
          noteCount: chart.notes.length,
          chartFile: file.name,
        };

        const fullChart: Chart = {
          ...chart,
          difficulty: {
            ...chart.difficulty,
            id: difficultyId,
            songId,
            noteCount: difficulty.noteCount,
            chartFile: difficulty.chartFile,
          },
        };

        let action: 'new' | 'add' | 'replace' = 'new';
        let existingDifficulty: Difficulty | undefined;

        if (existingSong) {
          existingDifficulty = existingSong.difficulties.find(
            (d) => d.name === difficulty.name && d.keys === difficulty.keys
          );
          if (existingDifficulty) {
            const isBuiltIn = isBuiltInDifficulty(existingSong.id, existingDifficulty.id);
            if (isBuiltIn) {
              failCount++;
              continue;
            }
            action = 'replace';
          } else {
            action = 'add';
          }
        }

        const folderName = source === 'scan'
          ? (file as any).webkitRelativePath?.split('/')[0] || '导入'
          : '导入';

        const newSong: Song = existingSong
          ? { ...existingSong, difficulties: [...existingSong.difficulties, difficulty] }
          : {
              id: songId,
              title: chart.song.title,
              artist: chart.song.artist,
              folder: folderName,
              audioFile: '',
              coverFile: '',
              bpm: chart.song.bpm,
              duration: Math.max(...chart.notes.map((n) => n.time + (n.duration || 0))) / 1000,
              difficulties: [difficulty],
            };

        previewItems.push({
          song: newSong,
          chart: fullChart,
          action,
          existingDifficulty,
        });
      } catch (err) {
        failCount++;
      }

      setImportProgress(Math.round(((i + 1) / jsonFiles.length) * 100));
    }

    const newSongs = previewItems.filter((item) => item.action === 'new').length;
    const addedDifficulties = previewItems.filter((item) => item.action === 'add').length;
    const replacedDifficulties = previewItems.filter((item) => item.action === 'replace').length;

    const preview: ImportPreview = {
      items: previewItems,
      newSongs,
      addedDifficulties,
      replacedDifficulties,
    };

    setImportPreview(preview);

    if (previewItems.length > 0) {
      setImportStatus({
        type: 'success',
        message: `解析完成：${previewItems.length} 个有效，${failCount} 个失败`,
      });
      setTimeout(() => {
        navigate('/import-confirm');
      }, 500);
    } else {
      setImportStatus({ type: 'error', message: '未找到有效谱面' });
    }

    setTimeout(() => setImportProgress(0), 2000);
  }, [songs, isBuiltInDifficulty, setImportPreview, navigate]);

  const packs = useMemo<PackInfo[]>(() => {
    const packMap = new Map<string, Song[]>();
    songs.forEach((song) => {
      const folder = song.folder || '未分类';
      if (!packMap.has(folder)) {
        packMap.set(folder, []);
      }
      packMap.get(folder)!.push(song);
    });

    return Array.from(packMap.entries())
      .map(([folder, packSongs]) => ({
        folder,
        songs: packSongs,
        totalNotes: packSongs.reduce(
          (sum, s) => sum + s.difficulties.reduce((dSum, d) => dSum + d.noteCount, 0),
          0
        ),
      }))
      .sort((a, b) => a.folder.localeCompare(b.folder));
  }, [songs]);

  const totalStats = useMemo(() => {
    return {
      packCount: packs.length,
      songCount: songs.length,
      totalNotes: songs.reduce(
        (sum, s) => sum + s.difficulties.reduce((dSum, d) => dSum + d.noteCount, 0),
        0
      ),
      totalDifficulties: songs.reduce((sum, s) => sum + s.difficulties.length, 0),
    };
  }, [packs, songs]);

  const selectedPackData = useMemo(() => {
    return packs.find((p) => p.folder === selectedPack) || null;
  }, [packs, selectedPack]);

  const handleScanDirectory = async () => {
    setIsScanning(true);
    setImportProgress(0);
    setImportStatus({ type: 'info', message: '请选择要扫描的目录...' });
    setLoading(true);

    try {
      if (directoryInputRef.current) {
        directoryInputRef.current.onchange = async (e: Event) => {
          const target = e.target as HTMLInputElement;
          const files = target.files;

          if (!files || files.length === 0) {
            setImportStatus({ type: 'info', message: '未选择文件' });
            setIsScanning(false);
            setLoading(false);
            return;
          }

          setImportStatus({ type: 'info', message: `正在扫描 ${files.length} 个文件...` });
          await processFiles(files, 'scan');

          setIsScanning(false);
          setLoading(false);

          if (directoryInputRef.current) {
            directoryInputRef.current.value = '';
          }
        };
        directoryInputRef.current.click();
      }
    } catch (err) {
      setImportStatus({ type: 'error', message: '扫描失败，请重试' });
      setIsScanning(false);
      setLoading(false);
      setTimeout(() => setImportProgress(0), 1000);
    }
  };

  const handleImportChart = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImportProgress(0);
    setImportStatus({ type: 'info', message: `正在导入 ${files.length} 个谱面...` });
    setLoading(true);

    await processFiles(files, 'import');

    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteSong = (songId: string) => {
    removeSong(songId);
    setShowDeleteConfirm(null);
    setImportStatus({ type: 'success', message: '歌曲已删除' });
    setTimeout(() => setImportStatus(null), 2000);
  };

  const getDifficultyColor = (level: number) => {
    if (level <= 5) return 'green';
    if (level <= 10) return 'cyan';
    if (level <= 15) return 'pink';
    return 'red';
  };

  return (
    <div className="relative w-full h-full bg-dark-bg grid-bg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-neon-pink/5 via-transparent to-neon-cyan/5" />

      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-neon-pink/10 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-neon-cyan/10 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-neon-purple/10 blur-3xl animate-float" style={{ animationDelay: '0.5s' }} />

      <div className="relative h-full flex flex-col">
        <header className="flex items-center justify-between px-8 py-4 border-b-2 border-dark-border bg-dark-panel/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <NeonButton variant="secondary" size="sm" onClick={() => navigate('/songs')}>
              <ArrowLeft className="w-4 h-4" />
            </NeonButton>
            <div className="relative">
              <h1 className="font-pixel text-2xl gradient-text glitch" data-text="PACK MANAGER">
                PACK MANAGER
              </h1>
              <div className="text-xs font-body text-neon-pink mt-1">曲包管理中心</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StatDisplay label="曲包" value={totalStats.packCount} color="purple" className="px-4" />
            <StatDisplay label="歌曲" value={totalStats.songCount} color="cyan" className="px-4" />
            <StatDisplay label="难度" value={totalStats.totalDifficulties} color="pink" className="px-4" />
            <StatDisplay label="总音符" value={totalStats.totalNotes.toLocaleString()} color="green" className="px-4" />
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/3 p-6 border-r-2 border-dark-border overflow-y-auto">
            <div className="flex gap-3 mb-6">
              <NeonButton
                variant="primary"
                size="sm"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={handleScanDirectory}
                disabled={isScanning || isLoading}
              >
                {isScanning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FolderOpen className="w-4 h-4" />
                )}
                扫描目录
              </NeonButton>
              <NeonButton
                variant="success"
                size="sm"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Upload className="w-4 h-4" />
                导入谱面
              </NeonButton>
            </div>

            <input
              type="file"
              ref={directoryInputRef}
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={handleImportChart}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              multiple
              className="hidden"
              onChange={handleImportChart}
            />

            {importProgress > 0 && (
              <div className="mb-6">
                <ProgressBar value={importProgress} showLabel label="导入进度" />
              </div>
            )}

            {importStatus && (
              <div
                className={cn(
                  'mb-6 p-4 rounded-lg border-2 flex items-center gap-3',
                  importStatus.type === 'success' && 'border-neon-green bg-neon-green/10',
                  importStatus.type === 'error' && 'border-neon-red bg-neon-red/10',
                  importStatus.type === 'info' && 'border-neon-cyan bg-neon-cyan/10'
                )}
              >
                {importStatus.type === 'success' && (
                  <CheckCircle className="w-5 h-5 text-neon-green flex-shrink-0" />
                )}
                {importStatus.type === 'error' && (
                  <AlertCircle className="w-5 h-5 text-neon-red flex-shrink-0" />
                )}
                {importStatus.type === 'info' && (
                  <Sparkles className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                )}
                <span className="font-body text-sm">{importStatus.message}</span>
              </div>
            )}

            <h2 className="font-pixel text-sm text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-neon-purple" />
              曲包列表
            </h2>

            <div className="space-y-3">
              {packs.map((pack) => (
                <NeonCard
                  key={pack.folder}
                  glowColor={selectedPack === pack.folder ? 'pink' : 'purple'}
                  className={cn(
                    'p-4 cursor-pointer transition-all',
                    selectedPack === pack.folder &&
                      'border-neon-pink shadow-neon-pink bg-neon-pink/5'
                  )}
                  onClick={() => setSelectedPack(pack.folder)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-pink/30 to-neon-purple/30 flex items-center justify-center">
                        <Disc3 className="w-6 h-6 text-neon-pink" />
                      </div>
                      <div>
                        <div className="font-display font-bold text-lg">{pack.folder}</div>
                        <div className="text-xs font-body text-gray-400">
                          {pack.songs.length} 首歌曲 · {pack.totalNotes.toLocaleString()} 音符
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center font-display font-bold text-sm text-neon-purple">
                      {pack.songs.length}
                    </div>
                  </div>
                </NeonCard>
              ))}

              {packs.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="font-body text-gray-500 text-lg">暂无曲包</p>
                  <p className="font-body text-gray-600 text-sm mt-2">点击扫描目录或导入谱面开始</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-2/3 p-6 overflow-y-auto">
            {selectedPackData ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display font-bold text-3xl text-glow-pink mb-1">
                      {selectedPackData.folder}
                    </h2>
                    <p className="font-body text-gray-400">
                      {selectedPackData.songs.length} 首歌曲 ·{' '}
                      {selectedPackData.totalNotes.toLocaleString()} 总音符
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  <StatDisplay
                    label="平均BPM"
                    value={Math.round(
                      selectedPackData.songs.reduce((sum, s) => sum + s.bpm, 0) /
                        selectedPackData.songs.length
                    )}
                    color="yellow"
                  />
                  <StatDisplay
                    label="平均时长"
                    value={formatTime(
                      (selectedPackData.songs.reduce((sum, s) => sum + s.duration, 0) /
                        selectedPackData.songs.length) *
                        1000
                    )}
                    color="cyan"
                  />
                  <StatDisplay
                    label="难度数"
                    value={selectedPackData.songs.reduce((sum, s) => sum + s.difficulties.length, 0)}
                    color="pink"
                  />
                  <StatDisplay
                    label="最高等级"
                    value={Math.max(
                      ...selectedPackData.songs.flatMap((s) => s.difficulties.map((d) => d.level))
                    )}
                    color="purple"
                  />
                </div>

                <h3 className="font-pixel text-sm text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Music className="w-4 h-4 text-neon-cyan" />
                  歌曲列表
                </h3>

                <div className="space-y-4">
                  {selectedPackData.songs.map((song) => {
                    const totalNotes = song.difficulties.reduce(
                      (sum, d) => sum + d.noteCount,
                      0
                    );
                    const maxLevel = Math.max(...song.difficulties.map((d) => d.level));
                    const songIsBuiltIn = isBuiltInSong(song.id);

                    return (
                      <NeonCard
                        key={song.id}
                        glowColor="cyan"
                        className="p-5 hover:border-neon-cyan group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-neon-cyan/30 via-neon-purple/20 to-neon-pink/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                            <Music className="w-10 h-10 text-white/40" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-display font-bold text-xl text-white truncate group-hover:text-neon-cyan transition-colors">
                                    {song.title}
                                  </h4>
                                  {songIsBuiltIn && (
                                    <span className="px-2 py-0.5 rounded text-xs font-pixel bg-neon-purple/20 text-neon-purple border border-neon-purple/30">
                                      内置
                                    </span>
                                  )}
                                </div>
                                <p className="font-body text-neon-pink">{song.artist}</p>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <NeonButton
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => navigate(`/difficulty-manage/${song.id}`)}
                                >
                                  <Settings className="w-4 h-4" />
                                </NeonButton>
                                {!songIsBuiltIn && (
                                  <NeonButton
                                    variant="danger"
                                    size="sm"
                                    onClick={() => setShowDeleteConfirm(song.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </NeonButton>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-6 mt-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-pixel text-gray-500">BPM</span>
                                <span className="font-display font-bold text-neon-yellow">
                                  {song.bpm}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-pixel text-gray-500">时长</span>
                                <span className="font-display text-neon-cyan">
                                  {formatTime(song.duration * 1000)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-pixel text-gray-500">音符</span>
                                <span className="font-display text-neon-pink">
                                  {totalNotes.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-pixel text-gray-500">最高</span>
                                <span
                                  className={cn(
                                    'font-display font-bold',
                                    maxLevel <= 5 && 'text-neon-green',
                                    maxLevel > 5 && maxLevel <= 10 && 'text-neon-cyan',
                                    maxLevel > 10 && maxLevel <= 15 && 'text-neon-pink',
                                    maxLevel > 15 && 'text-neon-red'
                                  )}
                                >
                                  Lv.{maxLevel}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {song.difficulties.map((diff) => {
                                const diffIsBuiltIn = isBuiltInDifficulty(song.id, diff.id);
                                return (
                                  <div
                                    key={diff.id}
                                    className={cn(
                                      'px-3 py-1 rounded-md text-xs font-display font-bold border flex items-center gap-1',
                                      getDifficultyColor(diff.level) === 'green' &&
                                        'border-neon-green text-neon-green bg-neon-green/10',
                                      getDifficultyColor(diff.level) === 'cyan' &&
                                        'border-neon-cyan text-neon-cyan bg-neon-cyan/10',
                                      getDifficultyColor(diff.level) === 'pink' &&
                                        'border-neon-pink text-neon-pink bg-neon-pink/10',
                                      getDifficultyColor(diff.level) === 'red' &&
                                        'border-neon-red text-neon-red bg-neon-red/10'
                                    )}
                                  >
                                    {diff.name} · Lv.{diff.level} · {diff.keys}K
                                    {diffIsBuiltIn && (
                                      <span className="text-[10px] opacity-60">(内置)</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {showDeleteConfirm === song.id && (
                          <div className="mt-4 p-4 rounded-lg border-2 border-neon-red bg-neon-red/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-neon-red" />
                                <span className="font-body text-neon-red">
                                  确定要删除「{song.title}」吗？此操作无法撤销。
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
                                  onClick={() => handleDeleteSong(song.id)}
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
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neon-pink/20 to-neon-cyan/20 animate-pulse-glow" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-16 h-16 text-neon-purple" />
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-2xl text-gray-400 mb-2">
                    选择一个曲包
                  </h3>
                  <p className="font-body text-gray-600">
                    从左侧列表选择曲包以查看详细信息
                  </p>
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

export default PackManager;
