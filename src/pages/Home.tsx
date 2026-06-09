import { useNavigate } from 'react-router-dom';
import { useSongStore } from '../store/songStore';
import NeonButton from '../components/ui/NeonButton';
import NeonCard from '../components/ui/NeonCard';

const Home = () => {
  const navigate = useNavigate();
  const { songs, getTotalPlayCount } = useSongStore();
  const totalPlayCount = getTotalPlayCount();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-accent/20 to-transparent" />
      <div className="absolute inset-0 grid-bg opacity-30" />

      <div className="absolute top-20 left-10 w-64 h-64 bg-neon-pink/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-cyan/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-40 right-40 w-48 h-48 bg-neon-yellow/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 text-center px-8">
        <div className="mb-12">
          <h1 className="font-pixel text-4xl md:text-6xl text-neon-pink text-glow-pink mb-4 glitch" data-text="NEON ARCADE">
            NEON ARCADE
          </h1>
          <h2 className="font-display text-xl md:text-3xl text-neon-cyan text-glow-cyan">
            RETRO RHYTHM GAME
          </h2>
          <div className="mt-4 font-body text-gray-400 text-sm md:text-base">
            复古街机厅音乐节奏游戏
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          <NeonCard glowColor="pink" className="p-6 hover:scale-105 transition-transform cursor-pointer group" onClick={() => navigate('/songs')}>
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🎮</div>
            <h3 className="font-pixel text-xl text-neon-pink mb-2">开始游戏</h3>
            <p className="font-body text-sm text-gray-400">选择歌曲开始挑战</p>
            <div className="mt-4 font-pixel text-xs text-neon-yellow">
              {songs.length} 首歌曲
            </div>
          </NeonCard>

          <NeonCard glowColor="cyan" className="p-6 hover:scale-105 transition-transform cursor-pointer group" onClick={() => navigate('/packs')}>
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📦</div>
            <h3 className="font-pixel text-xl text-neon-cyan mb-2">曲包管理</h3>
            <p className="font-body text-sm text-gray-400">扫描本地导入谱面</p>
            <div className="mt-4 font-pixel text-xs text-neon-cyan">
              支持 JSON 谱面
            </div>
          </NeonCard>

          <NeonCard glowColor="yellow" className="p-6 hover:scale-105 transition-transform cursor-pointer group" onClick={() => navigate('/settings')}>
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
            <h3 className="font-pixel text-xl text-neon-yellow mb-2">游戏设置</h3>
            <p className="font-body text-sm text-gray-400">自定义按键和参数</p>
            <div className="mt-4 font-pixel text-xs text-neon-green">
              完全个性化
            </div>
          </NeonCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
          <div className="bg-dark-accent/50 border border-neon-pink/30 rounded-lg p-4">
            <div className="font-pixel text-3xl text-neon-pink text-glow-pink">{songs.length}</div>
            <div className="font-body text-xs text-gray-400">歌曲总数</div>
          </div>
          <div className="bg-dark-accent/50 border border-neon-cyan/30 rounded-lg p-4">
            <div className="font-pixel text-3xl text-neon-cyan text-glow-cyan">{songs.length * 4}</div>
            <div className="font-body text-xs text-gray-400">谱面数量</div>
          </div>
          <div className="bg-dark-accent/50 border border-neon-yellow/30 rounded-lg p-4">
            <div className="font-pixel text-3xl text-neon-yellow text-glow-yellow">{totalPlayCount}</div>
            <div className="font-body text-xs text-gray-400">游戏次数</div>
          </div>
          <div className="bg-dark-accent/50 border border-neon-green/30 rounded-lg p-4">
            <div className="font-pixel text-3xl text-neon-green text-glow-green">7</div>
            <div className="font-body text-xs text-gray-400">游戏模式</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <NeonButton variant="primary" size="lg" onClick={() => navigate('/songs')}>
            [ 开始游戏 ]
          </NeonButton>

          <div className="font-pixel text-xs text-gray-500 mt-8">
            四键: D F J K | 六键: S D F J K L | 暂停: ESC/Space
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 font-pixel text-xs text-gray-600">
          INSERT COIN ▸ PRESS START
        </div>
      </div>

      <div className="crt-overlay" />
    </div>
  );
};

export default Home;
