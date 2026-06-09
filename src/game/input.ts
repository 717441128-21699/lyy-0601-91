import type { KeyMapping } from '../types/settings';

export type InputEventType = 'press' | 'release';

export interface InputEvent {
  lane: number;
  type: InputEventType;
  time: number;
  code: string;
}

export class InputSystem {
  private keyMapping: KeyMapping = {};
  private keyToLane: Map<string, number> = new Map();
  private pressedLanes: Set<number> = new Set();
  private eventQueue: InputEvent[] = [];
  private listeners: Array<(event: InputEvent) => void> = [];
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private boundHandleKeyUp: (e: KeyboardEvent) => void;
  private inputOffset: number = 0;

  constructor() {
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
  }

  setKeyMapping(mapping: KeyMapping): void {
    this.keyMapping = mapping;
    this.keyToLane.clear();

    for (const [laneStr, code] of Object.entries(mapping)) {
      const lane = parseInt(laneStr, 10);
      this.keyToLane.set(code, lane);
    }
  }

  setInputOffset(offset: number): void {
    this.inputOffset = offset;
  }

  attach(): void {
    window.addEventListener('keydown', this.boundHandleKeyDown);
    window.addEventListener('keyup', this.boundHandleKeyUp);
  }

  detach(): void {
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    window.removeEventListener('keyup', this.boundHandleKeyUp);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;

    const lane = this.keyToLane.get(e.code);
    if (lane !== undefined && !this.pressedLanes.has(lane)) {
      this.pressedLanes.add(lane);
      const event: InputEvent = {
        lane,
        type: 'press',
        time: performance.now() + this.inputOffset,
        code: e.code,
      };
      this.eventQueue.push(event);
      this.notifyListeners(event);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const lane = this.keyToLane.get(e.code);
    if (lane !== undefined) {
      this.pressedLanes.delete(lane);
      const event: InputEvent = {
        lane,
        type: 'release',
        time: performance.now() + this.inputOffset,
        code: e.code,
      };
      this.eventQueue.push(event);
      this.notifyListeners(event);
    }
  }

  private notifyListeners(event: InputEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  addListener(listener: (event: InputEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getEvents(): InputEvent[] {
    const events = [...this.eventQueue];
    this.eventQueue = [];
    return events;
  }

  clearEvents(): void {
    this.eventQueue = [];
  }

  isLanePressed(lane: number): boolean {
    return this.pressedLanes.has(lane);
  }

  getPressedLanes(): number[] {
    return Array.from(this.pressedLanes);
  }

  getKeyMapping(): KeyMapping {
    return { ...this.keyMapping };
  }

  reset(): void {
    this.pressedLanes.clear();
    this.eventQueue = [];
  }

  static getKeyDisplay(code: string): string {
    const displayMap: Record<string, string> = {
      Space: 'Space',
      Enter: 'Enter',
      Escape: 'Esc',
      ArrowUp: '↑',
      ArrowDown: '↓',
      ArrowLeft: '←',
      ArrowRight: '→',
    };

    if (displayMap[code]) {
      return displayMap[code];
    }

    if (code.startsWith('Key')) {
      return code.slice(3);
    }

    if (code.startsWith('Digit')) {
      return code.slice(5);
    }

    return code;
  }
}

export const inputSystem = new InputSystem();
