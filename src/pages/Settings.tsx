import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NeonButton from '@/components/ui/NeonButton';
import NeonCard from '@/components/ui/NeonCard';
import ProgressBar from '@/components/ui/ProgressBar';
import { useSettingsStore } from '@/store/settingsStore';
import { InputSystem } from '@/game/input';
import type { KeyMapping, Settings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

type KeyMode = '4key' | '6key';
type ListeningState = { mode: KeyMode; lane: number } | null;

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const [tempSettings, setTempSettings] = useState<Settings>(settings);
  const [listening, setListening] = useState<ListeningState>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!listening) return;
      e.preventDefault();

      if (e.code === 'Escape') {
        setListening(null);
        return;
      }

      const { mode, lane } = listening;
      const keyMapping = mode === '4key' ? 'keyMapping4' : 'keyMapping6';
      const currentMapping = tempSettings[keyMapping];

      const existingLane = Object.entries(currentMapping).find(
        ([, code]) => code === e.code
      );

      if (existingLane && parseInt(existingLane[0], 10) !== lane) {
        setListening(null);
        return;
      }

      setTempSettings((prev) => ({
        ...prev,
        [keyMapping]: {
          ...prev[keyMapping],
          [lane]: e.code,
        },
      }));
      setListening(null);
    },
    [listening, tempSettings]
  );

  useEffect(() => {
    if (listening) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [listening, handleKeyDown]);

  const handleSliderChange = (
    key: keyof Settings,
    value: number,
    subKey?: string
  ) => {
    setTempSettings((prev) => {
      if (subKey && typeof prev[key] === 'object' && prev[key] !== null) {
        return {
          ...prev,
          [key]: {
            ...(prev[key] as Record<string, number>),
            [subKey]: value,
          },
        };
      }
      return { ...prev, [key]: value };
    });
  };

  const handleToggle = (key: keyof Settings) => {
    setTempSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    updateSettings(tempSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setTempSettings(DEFAULT_SETTINGS);
    resetSettings();
  };

  const renderKeyButton = (
    mapping: KeyMapping,
    lane: number,
    mode: KeyMode
  ) => {
    const code = mapping[lane];
    const isListening =
      listening?.mode === mode && listening?.lane === lane;
    const laneColors = [
      'border-neon-pink text-neon-pink hover:shadow-neon-pink',
      'border-neon-cyan text-neon-cyan hover:shadow-neon-cyan',
      'border-neon-yellow text-neon-yellow hover:shadow-[0_0_10px_#FFD700,0_0_20px_#FFD700]',
      'border-neon-green text-neon-green hover:shadow-[0_0_10px_#00FF88,0_0_20px_#00FF88]',
      'border-neon-purple text-neon-purple hover:shadow-neon-purple',
      'border-neon-red text-neon-red hover:shadow-[0_0_10px_#FF3B3B,0_0_20px_#FF3B3B]',
    ];

    return (
      <button
        key={lane}
        onClick={() => setListening({ mode, lane })}
        className={`
          w-20 h-20 font-display text-2xl font-bold uppercase
          border-2 bg-dark-panel/80 rounded-lg
          transition-all duration-300 flex items-center justify-center
          ${isListening
            ? 'border-neon-cyan bg-neon-cyan/20 animate-pulse shadow-[0_0_20px_#00F5FF,0_0_40px_#00F5FF] text-neon-cyan'
            : laneColors[lane] || 'border-neon-purple text-neon-purple hover:shadow-neon-purple'
          }
          hover:scale-110 active:scale-95
        `}
      >
        {isListening ? '...' : InputSystem.getKeyDisplay(code)}
      </button>
    );
  };

  const renderSlider = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (v: number) => void,
    unit: string = '',
    color: 'pink' | 'cyan' | 'purple' | 'green' | 'red' | 'gradient' = 'gradient',
    displayValue?: string
  ) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-gray-300 font-body">{label}</span>
        <span className="font-display text-neon-cyan text-lg">
          {displayValue || `${value}${unit}`}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-gray-500 text-sm w-12 text-right">
          {min}{unit}
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="text-gray-500 text-sm w-12">
          {max}{unit}
        </span>
      </div>
      <ProgressBar
        value={value}
        max={max}
        color={color}
        className="mt-2"
      />
    </div>
  );

  const renderToggle = (
    label: string,
    value: boolean,
    onChange: () => void,
    description?: string
  ) => (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-gray-300 font-body">{label}</span>
        {description && (
          <p className="text-gray-500 text-sm">{description}</p>
        )}
      </div>
      <button
        onClick={onChange}
        className={`
          relative w-16 h-8 rounded-full transition-all duration-300
          ${value
            ? 'bg-neon-cyan shadow-[0_0_10px_#00F5FF]'
            : 'bg-dark-border'
          }
        `}
      >
        <div
          className={`
            absolute top-1 w-6 h-6 rounded-full bg-white
            transition-all duration-300
            ${value ? 'left-9' : 'left-1'}
          `}
        />
      </button>
    </div>
  );

  return (
    <div className="w-full h-full overflow-auto bg-dark-bg grid-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-bg/80 via-transparent to-dark-bg/80 pointer-events-none" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <NeonButton
              variant="secondary"
              size="sm"
              onClick={() => navigate(-1)}
            >
              ← 返回
            </NeonButton>
            <h1 className="font-display text-5xl font-bold gradient-text glitch" data-text="设置">
              设置
            </h1>
          </div>
          <div className="flex gap-4">
            <NeonButton
              variant="danger"
              onClick={handleReset}
            >
              恢复默认
            </NeonButton>
            <NeonButton
              variant="success"
              onClick={handleSave}
              className={saved ? 'animate-pulse' : ''}
            >
              {saved ? '✓ 已保存' : '保存设置'}
            </NeonButton>
          </div>
        </div>

        {listening && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-center">
              <p className="font-display text-3xl text-neon-cyan mb-4 animate-pulse">
                按下新按键...
              </p>
              <p className="text-gray-400">按 ESC 取消</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NeonCard glowColor="pink" className="p-6">
            <h2 className="font-display text-2xl text-neon-pink mb-6 text-glow-pink">
              按键设置
            </h2>

            <div className="mb-8">
              <h3 className="font-display text-lg text-gray-300 mb-4">四键模式</h3>
              <div className="flex gap-4 justify-center">
                {[0, 1, 2, 3].map((lane) =>
                  renderKeyButton(tempSettings.keyMapping4, lane, '4key')
                )}
              </div>
              <div className="flex gap-4 justify-center mt-2">
                {['KeyD', 'KeyF', 'KeyJ', 'KeyK'].map((_, i) => (
                  <span key={i} className="w-20 text-center text-gray-500 text-sm">
                    轨道 {i + 1}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-lg text-gray-300 mb-4">六键模式</h3>
              <div className="flex gap-3 justify-center">
                {[0, 1, 2, 3, 4, 5].map((lane) =>
                  renderKeyButton(tempSettings.keyMapping6, lane, '6key')
                )}
              </div>
              <div className="flex gap-3 justify-center mt-2">
                {['KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL'].map((_, i) => (
                  <span key={i} className="w-[76px] text-center text-gray-500 text-sm">
                    轨道 {i + 1}
                  </span>
                ))}
              </div>
            </div>
          </NeonCard>

          <NeonCard glowColor="cyan" className="p-6">
            <h2 className="font-display text-2xl text-neon-cyan mb-6 text-glow-cyan">
              音频设置
            </h2>

            <div className="space-y-6">
              {renderSlider(
                '主音量',
                tempSettings.masterVolume,
                0,
                1,
                0.01,
                (v) => handleSliderChange('masterVolume', v),
                '',
                'cyan',
                `${Math.round(tempSettings.masterVolume * 100)}%`
              )}

              {renderSlider(
                '音乐音量',
                tempSettings.musicVolume,
                0,
                1,
                0.01,
                (v) => handleSliderChange('musicVolume', v),
                '',
                'purple',
                `${Math.round(tempSettings.musicVolume * 100)}%`
              )}

              {renderSlider(
                '音效音量',
                tempSettings.effectVolume,
                0,
                1,
                0.01,
                (v) => handleSliderChange('effectVolume', v),
                '',
                'pink',
                `${Math.round(tempSettings.effectVolume * 100)}%`
              )}
            </div>
          </NeonCard>

          <NeonCard glowColor="purple" className="p-6">
            <h2 className="font-display text-2xl text-neon-purple mb-6 text-glow-purple">
              游戏设置
            </h2>

            <div className="space-y-6">
              {renderSlider(
                '下落速度',
                tempSettings.noteSpeed,
                1,
                20,
                1,
                (v) => handleSliderChange('noteSpeed', v),
                '',
                'gradient',
                `${tempSettings.noteSpeed.toFixed(0)}x`
              )}

              {renderSlider(
                '输入延迟校准',
                tempSettings.inputOffset,
                -500,
                500,
                1,
                (v) => handleSliderChange('inputOffset', v),
                '',
                'green',
                `${tempSettings.inputOffset > 0 ? '+' : ''}${tempSettings.inputOffset}ms`
              )}

              <div className="border-t border-dark-border pt-6 mt-6">
                <h3 className="font-display text-lg text-gray-300 mb-4">判定窗口</h3>
                
                {renderSlider(
                  'Perfect',
                  tempSettings.judgeWindow.perfect,
                  20,
                  100,
                  5,
                  (v) => handleSliderChange('judgeWindow', v, 'perfect'),
                  '',
                  'gradient',
                  `±${tempSettings.judgeWindow.perfect}ms`
                )}

                <div className="mt-4">
                  {renderSlider(
                    'Good',
                    tempSettings.judgeWindow.good,
                    60,
                  200,
                    5,
                    (v) => handleSliderChange('judgeWindow', v, 'good'),
                    '',
                    'cyan',
                    `±${tempSettings.judgeWindow.good}ms`
                  )}
                </div>
              </div>
            </div>
          </NeonCard>

          <NeonCard glowColor="purple" className="p-6">
            <h2 className="font-display text-2xl text-neon-green mb-6 text-glow-green">
              显示设置
            </h2>

            <div className="space-y-6">
              {renderToggle(
                '全屏模式',
                tempSettings.fullscreen,
                () => handleToggle('fullscreen'),
                '以全屏方式运行游戏'
              )}

              <div className="border-t border-dark-border pt-6">
                {renderSlider(
                  '背景暗度',
                  tempSettings.backgroundDim,
                  0,
                  1,
                  0.01,
                  (v) => handleSliderChange('backgroundDim', v),
                  '',
                  'purple',
                  `${Math.round(tempSettings.backgroundDim * 100)}%`
                )}
              </div>

              <div className="border-t border-dark-border pt-6 space-y-6">
                <h3 className="font-display text-lg text-gray-300">特效显示</h3>
                
                {renderToggle(
                  '击中特效',
                  tempSettings.showHitEffect,
                  () => handleToggle('showHitEffect'),
                  '显示按键击中时的特效'
                )}

                {renderToggle(
                  '连击显示',
                  tempSettings.showCombo,
                  () => handleToggle('showCombo'),
                  '显示当前连击数'
                )}
              </div>
            </div>
          </NeonCard>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 font-body">
            提示：点击按键框后按下新按键即可修改映射。按 ESC 取消修改。
          </p>
        </div>
      </div>
    </div>
  );
}
