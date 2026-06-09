import type { Chart, Note, JudgeEvent, PracticeSettings, GameMode } from '../types/song';
import type { GameState, GameStats, NoteState, LaneState, JudgeResult } from '../types/game';
import type { JudgeConfig } from '../types/game';
import { JudgeSystem, DEFAULT_JUDGE_CONFIG } from './judge';
import { GameRenderer, RenderConfig } from './renderer';
import { InputSystem, InputEvent } from './input';
import { AudioSystem } from './audio';
import { LANE_COLORS, COLORS } from '../utils/color';
import { clamp, generateId } from '../utils/math';

export interface GameEngineConfig {
  renderConfig: RenderConfig;
  judgeConfig: JudgeConfig;
  noteSpeed: number;
  inputOffset: number;
}

export class GameEngine {
  private state: GameState = 'ready';
  private chart: Chart | null = null;
  private notes: NoteState[] = [];
  private stats: GameStats;
  private currentTime: number = 0;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private mode: GameMode = 'normal';
  private practiceSettings: PracticeSettings | null = null;
  private engineStartTime: number = 0;

  private judgeSystem: JudgeSystem;
  private renderer: GameRenderer;
  private inputSystem: InputSystem;
  private audioSystem: AudioSystem;

  private laneStates: LaneState[] = [];
  private inputListener: (() => void) | null = null;

  private onStateChange: ((state: GameState) => void) | null = null;
  private onStatsChange: ((stats: GameStats) => void) | null = null;
  private onJudge: ((event: JudgeEvent) => void) | null = null;
  private coverImage: HTMLImageElement | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    config: GameEngineConfig,
    audioSystem: AudioSystem
  ) {
    this.judgeSystem = new JudgeSystem(config.judgeConfig || DEFAULT_JUDGE_CONFIG);
    this.renderer = new GameRenderer(canvas, config.renderConfig);
    this.inputSystem = new InputSystem();
    this.audioSystem = audioSystem;

    this.stats = this.createInitialStats();
    this.initLaneStates(config.renderConfig.keys);
  }

  private createInitialStats(): GameStats {
    return {
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfect: 0,
      good: 0,
      miss: 0,
      energy: 50,
      judgeHistory: [],
    };
  }

  private initLaneStates(keys: 4 | 6): void {
    this.laneStates = [];
    for (let i = 0; i < keys; i++) {
      this.laneStates.push({
        lane: i,
        pressed: false,
        pressTime: 0,
      });
    }
  }

  loadChart(chart: Chart): void {
    this.chart = chart;
    this.notes = chart.notes.map((note: Note) => ({
      ...note,
      id: note.id || generateId(),
      hit: false,
      judged: false,
    }));

    this.renderer.setConfig({ keys: chart.difficulty.keys });
    this.initLaneStates(chart.difficulty.keys);
    this.stats = this.createInitialStats();
    this.currentTime = 0;
    this.renderer.clearEffects();
  }

  setKeyMapping(mapping: Record<number, string>): void {
    this.inputSystem.setKeyMapping(mapping);
  }

  setInputOffset(offset: number): void {
    this.inputSystem.setInputOffset(offset);
  }

  setNoteSpeed(speed: number): void {
    this.renderer.setConfig({ noteSpeed: speed });
  }

  setCoverImage(image: HTMLImageElement | null): void {
    this.coverImage = image;
  }

  setPracticeSettings(settings: PracticeSettings): void {
    this.mode = 'practice';
    this.practiceSettings = settings;
  }

  setGameMode(mode: GameMode): void {
    this.mode = mode;
    if (mode === 'normal') {
      this.practiceSettings = null;
    }
  }

  start(): void {
    if (this.state === 'playing') return;

    this.state = 'playing';
    this.lastFrameTime = performance.now();

    this.inputSystem.attach();
    this.inputListener = this.inputSystem.addListener(this.handleInput.bind(this));

    const startTime = this.practiceSettings?.startTime || 0;
    this.engineStartTime = performance.now() - startTime;

    if (this.practiceSettings?.speed) {
      this.audioSystem.setPlaybackSpeed(this.practiceSettings.speed);
    } else {
      this.audioSystem.setPlaybackSpeed(1.0);
    }

    this.audioSystem.play(startTime);
    this.currentTime = startTime;

    this.loop();
    this.notifyStateChange();
  }

  pause(): void {
    if (this.state !== 'playing') return;

    this.state = 'paused';
    this.audioSystem.pause();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.notifyStateChange();
  }

  resume(): void {
    if (this.state !== 'paused') return;

    this.state = 'playing';
    this.lastFrameTime = performance.now();
    this.audioSystem.resume();

    this.loop();
    this.notifyStateChange();
  }

  restart(): void {
    this.stop();
    this.stats = this.createInitialStats();
    this.notes = this.chart?.notes.map((note: Note) => ({
      ...note,
      id: note.id || generateId(),
      hit: false,
      judged: false,
    })) || [];
    this.currentTime = 0;
    this.renderer.clearEffects();
    this.inputSystem.reset();
    this.start();
  }

  stop(): void {
    this.audioSystem.stop();
    this.inputSystem.detach();

    if (this.inputListener) {
      this.inputListener();
      this.inputListener = null;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.state = 'ready';
    this.notifyStateChange();
  }

  private loop(): void {
    if (this.state !== 'playing') return;

    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.update(deltaTime);
    this.render(deltaTime);

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private update(deltaTime: number): void {
    this.currentTime = this.audioSystem.getCurrentTime();

    if (this.practiceSettings) {
      if (this.currentTime >= this.practiceSettings.endTime) {
        if (this.practiceSettings.loop) {
          this.audioSystem.seek(this.practiceSettings.startTime);
          this.resetNotesInRange(this.practiceSettings.startTime, this.practiceSettings.endTime);
        } else {
          this.finish();
          return;
        }
      }
    }

    this.checkMissedNotes();
    this.checkGameEnd();
  }

  private resetNotesInRange(startTime: number, endTime: number): void {
    for (const note of this.notes) {
      if (note.time >= startTime && note.time <= endTime) {
        note.hit = false;
        note.judged = false;
      }
    }

    this.stats.combo = 0;
    this.stats.miss = 0;
    this.stats.perfect = 0;
    this.stats.good = 0;
  }

  private checkMissedNotes(): void {
    for (const note of this.notes) {
      if (this.judgeSystem.checkNoteMiss(note, this.currentTime)) {
        this.handleMiss(note);
      }
    }
  }

  private checkGameEnd(): void {
    if (!this.chart) return;

    const allJudged = this.notes.every((n) => n.judged);
    const songEnded = this.currentTime >= this.chart.notes[this.chart.notes.length - 1]?.time + 2000;

    if (allJudged || songEnded) {
      this.finish();
    }
  }

  private finish(): void {
    if (this.state !== 'failed') {
      this.state = 'finished';
    }
    this.audioSystem.stop();
    this.inputSystem.detach();

    if (this.inputListener) {
      this.inputListener();
      this.inputListener = null;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.notifyStateChange();
  }

  private handleInput(event: InputEvent): void {
    if (this.state !== 'playing') return;

    const { lane, type, time } = event;

    if (lane >= 0 && lane < this.laneStates.length) {
      this.laneStates[lane].pressed = type === 'press';
      this.laneStates[lane].pressTime = type === 'press' ? time : 0;
    }

    if (type === 'press') {
      this.handleNoteHit(lane, time);
    }
  }

  private handleNoteHit(lane: number, hitTime: number): void {
    const notesInLane = this.notes.filter(
      (n) => n.lane === lane && !n.judged && !n.hit
    );

    for (const note of notesInLane) {
      const result = this.judgeSystem.checkNoteHit(note, this.currentTime, this.currentTime);
      if (result) {
        this.processHit(note, result, lane);
        break;
      }
    }
  }

  private processHit(note: NoteState, result: JudgeResult, lane: number): void {
    note.hit = true;
    note.judged = true;

    const totalNotes = this.notes.length;
    const score = this.judgeSystem.calculateScore(result.judgement, this.stats.combo, totalNotes);

    this.stats.score += score;
    this.stats.combo++;
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo);
    this.stats.energy = clamp(this.stats.energy + this.judgeSystem.getEnergyDelta(result.judgement), 0, 100);

    if (result.judgement === 'perfect') {
      this.stats.perfect++;
    } else {
      this.stats.good++;
    }

    const judgeEvent: JudgeEvent = {
      time: this.currentTime,
      lane,
      judgement: result.judgement,
      delta: result.delta,
    };
    this.stats.judgeHistory.push(judgeEvent);

    this.audioSystem.playHitSound();
    this.renderer.spawnHitParticles(lane, LANE_COLORS[lane]);
    this.renderer.spawnFloatingText(
      result.judgement.toUpperCase(),
      lane,
      result.judgement === 'perfect' ? COLORS.perfect : COLORS.good
    );

    this.notifyStatsChange();
    this.notifyJudge(judgeEvent);
  }

  private handleMiss(note: NoteState): void {
    note.judged = true;

    this.stats.combo = 0;
    this.stats.miss++;
    this.stats.energy = clamp(this.stats.energy + this.judgeSystem.getEnergyDelta('miss'), 0, 100);

    const judgeEvent: JudgeEvent = {
      time: this.currentTime,
      lane: note.lane,
      judgement: 'miss',
      delta: 0,
    };
    this.stats.judgeHistory.push(judgeEvent);

    this.audioSystem.playMissSound();
    this.renderer.spawnFloatingText('MISS', note.lane, COLORS.miss);

    this.notifyStatsChange();
    this.notifyJudge(judgeEvent);

    if (this.stats.energy <= 0 && this.mode === 'normal') {
      this.state = 'failed';
      this.finish();
    } else if (this.stats.energy <= 0 && this.mode === 'practice') {
      this.stats.energy = 50;
    }
  }

  private render(deltaTime: number): void {
    const { backgroundDim = 0.3 } = this.renderer.getConfig() as { backgroundDim?: number };

    this.renderer.clear();
    this.renderer.drawBackground(this.coverImage || undefined, backgroundDim);
    this.renderer.drawLanes(this.laneStates);
    this.renderer.drawNotes(this.notes, this.currentTime);
    this.renderer.drawJudgeLine();
    this.renderer.drawParticles(deltaTime);
    this.renderer.drawFloatingTexts(deltaTime);
    this.renderer.drawScanlines();
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  private notifyStatsChange(): void {
    if (this.onStatsChange) {
      this.onStatsChange({ ...this.stats });
    }
  }

  private notifyJudge(event: JudgeEvent): void {
    if (this.onJudge) {
      this.onJudge(event);
    }
  }

  setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  setOnStatsChange(callback: (stats: GameStats) => void): void {
    this.onStatsChange = callback;
  }

  setOnJudge(callback: (event: JudgeEvent) => void): void {
    this.onJudge = callback;
  }

  getState(): GameState {
    return this.state;
  }

  getStats(): GameStats {
    return { ...this.stats };
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  getChart(): Chart | null {
    return this.chart;
  }

  getGrade(): string {
    return this.judgeSystem.getGrade(
      this.stats.perfect,
      this.stats.good,
      this.stats.miss,
      this.notes.length
    );
  }

  resize(width: number, height: number): void {
    this.renderer.resize(width, height);
  }

  destroy(): void {
    this.stop();
    this.inputSystem.detach();
  }
}
