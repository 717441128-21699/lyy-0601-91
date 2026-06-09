import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, PlusCircle, RefreshCw, Music, Disc3, AlertTriangle, Check, X } from 'lucide-react';
import NeonButton from '../components/ui/NeonButton';
import NeonCard from '../components/ui/NeonCard';
import StatDisplay from '../components/ui/StatDisplay';
import { useSongStore } from '../store/songStore';
import { cn, formatTime } from '../lib/utils';
import type { ImportPreviewItem } from '../store/songStore';

const ImportConfirm = () => {
  const navigate = useNavigate();
  const { importPreview, confirmImport, setImportPreview } = useSongStore();

  const groupedBySong = useMemo(() => {
    if (!importPreview) return new Map<string, ImportPreviewItem[]>();
    const groups = new Map<string, ImportPreviewItem[]>();
    for (const item of importPreview.items) {
      const key = item.song.id;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }
    return groups;
  }, [importPreview]);

  const handleConfirm = () => {
    confirmImport();
    navigate('/packs');
  };

  const handleCancel = () => {
    setImportPreview(null);
    navigate('/packs');
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'new':
        return { label: '新歌', color: 'text-neon-green', bg: 'bg-neon-green/10 border-neon-green' };
      case 'add':
        return { label: '加难度', color: 'text-neon-cyan', bg: 'bg-neon-cyan/10 border-neon-cyan' };
      case 'replace':
        return { label: '覆盖', color: 'text-neon-yellow', bg: 'bg-neon-yellow/10 border-neon-yellow' };
      default:
        return { label: '未知', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500' };
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'new':
        return <Music className="w-4 h-4" />;
      case 'add':
        return <PlusCircle className="w-4 h-4" />;
      case 'replace':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (!importPreview) {
    return (
      <div className="relative w-full h-full bg-dark-bg grid-bg flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-neon-yellow mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl text-gray-300 mb-2">没有待确认的导入</h2>
          <p className="font-body text-gray-500 mb-6">请先从曲包管理选择要导入的谱面</p>
          <NeonButton variant="primary" onClick={() => navigate('/packs')}>
            返回曲包管理
          </NeonButton>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-dark-bg grid-bg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 via-transparent to-neon-green/5" />

      <div className="absolute top-10 right-20 w-40 h-40 rounded-full bg-neon-cyan/10 blur-3xl animate-float" />
      <div className="absolute bottom-10 left-20 w-32 h-32 rounded-full bg-neon-green/10 blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      <div className="relative h-full flex flex-col">
        <header className="flex items-center justify-between px-8 py-4 border-b-2 border-dark-border bg-dark-panel/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <NeonButton variant="secondary" size="sm" onClick={handleCancel}>
              <ArrowLeft className="w-4 h-4" />
            </NeonButton>
            <div className="relative">
              <h1 className="font-pixel text-2xl gradient-text glitch" data-text="IMPORT CONFIRM">
                IMPORT CONFIRM
              </h1>
              <div className="text-xs font-body text-neon-cyan mt-1">导入结果确认</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StatDisplay label="新歌" value={importPreview.newSongs} color="green" className="px-4" />
            <StatDisplay label="加难度" value={importPreview.addedDifficulties} color="cyan" className="px-4" />
            <StatDisplay label="覆盖" value={importPreview.replacedDifficulties} color="yellow" className="px-4" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <NeonCard glowColor="cyan" className="p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-neon-cyan" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-xl text-white mb-2">
                    即将导入 {importPreview.items.length} 个谱面
                  </h3>
                  <p className="font-body text-gray-400">
                    请仔细确认以下变更。确认后将写入存储，无法撤销。
                  </p>
                </div>
              </div>
            </NeonCard>

            <div className="space-y-4">
              {Array.from(groupedBySong.entries()).map(([songId, items]) => {
                const firstItem = items[0];
                const song = firstItem.song;
                const primaryAction = items[0].action;
                const actionStyle = getActionLabel(primaryAction);

                return (
                  <NeonCard
                    key={songId}
                    glowColor={primaryAction === 'new' ? 'green' : primaryAction === 'add' ? 'cyan' : 'yellow'}
                    className="p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-neon-cyan/30 via-neon-purple/20 to-neon-pink/30 flex items-center justify-center flex-shrink-0">
                        <Disc3 className="w-8 h-8 text-white/40" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-display font-bold text-xl text-white truncate">
                            {song.title}
                          </h4>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-display font-bold border flex items-center gap-1',
                              actionStyle.bg,
                              actionStyle.color
                            )}
                          >
                            {getActionIcon(primaryAction)}
                            {actionStyle.label}
                          </span>
                        </div>
                        <p className="font-body text-neon-pink mb-3">{song.artist}</p>

                        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                          <div>
                            <span className="text-gray-500 font-pixel">BPM </span>
                            <span className="font-display text-neon-yellow">{song.bpm}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 font-pixel">时长 </span>
                            <span className="font-display text-neon-cyan">{formatTime(song.duration * 1000)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 font-pixel">难度数 </span>
                            <span className="font-display text-neon-pink">{song.difficulties.length}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-pixel text-xs text-gray-500 uppercase tracking-wider">
                            难度变更
                          </h5>
                          {items.map((item, idx) => {
                            const diffAction = getActionLabel(item.action);
                            const diff = item.song.difficulties[0];

                            return (
                              <div
                                key={idx}
                                className={cn(
                                  'flex items-center justify-between p-3 rounded-lg border',
                                  diffAction.bg,
                                  diffAction.color
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  {getActionIcon(item.action)}
                                  <div>
                                    <span className="font-display font-bold">{diff.name}</span>
                                    <span className="mx-2 text-gray-500">·</span>
                                    <span className="text-sm">Lv.{diff.level} · {diff.keys}K</span>
                                    <span className="mx-2 text-gray-500">·</span>
                                    <span className="text-sm text-gray-400">{diff.noteCount} 音符</span>
                                  </div>
                                </div>
                                {item.existingDifficulty && (
                                  <div className="text-xs text-gray-400 flex items-center gap-2">
                                    <span className="line-through">
                                      {item.existingDifficulty.name} · Lv.{item.existingDifficulty.level}
                                    </span>
                                    <RefreshCw className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </NeonCard>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="border-t-2 border-dark-border bg-dark-panel/50 backdrop-blur-sm px-8 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="font-body text-gray-400">
              确认无误后点击"确认导入"完成操作
            </div>
            <div className="flex gap-3">
              <NeonButton variant="secondary" size="lg" onClick={handleCancel}>
                <X className="w-5 h-5 mr-2" />
                取消
              </NeonButton>
              <NeonButton variant="success" size="lg" onClick={handleConfirm}>
                <Check className="w-5 h-5 mr-2" />
                确认导入
              </NeonButton>
            </div>
          </div>
        </footer>
      </div>

      <div className="crt-overlay" />
    </div>
  );
};

export default ImportConfirm;
