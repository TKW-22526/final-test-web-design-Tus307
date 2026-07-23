import { formatElapsed, downloadTextFile } from './utils.js';

export class Logger {
  constructor(outputElement) {
    this.outputElement = outputElement;
    this.entries = [];
    this.stepCounter = 0;
    this.startTime = performance.now();
  }

  log(message) {
    return this._append(message);
  }

  logStep(message) {
    this.stepCounter += 1;
    return this._append(`Bước ${this.stepCounter}: ${message}`);
  }

  clear() {
    this.entries = [];
    this.stepCounter = 0;
    this.startTime = performance.now();
    this._render();
  }

  getEntries() {
    return [...this.entries];
  }

  get count() {
    return this.entries.length;
  }

  toText() {
    return this.entries.join('\n');
  }

  download(filename = 'nhat-ky-mo-phong.txt') {
    downloadTextFile(filename, this.toText());
  }

  _append(message) {
    const elapsed = formatElapsed(performance.now() - this.startTime);
    const entry = `[${elapsed}] ${message}`;
    this.entries.push(entry);
    this._render();
    return entry;
  }

  _render() {
    if (!this.outputElement) return;
    this.outputElement.textContent = this.entries.join('\n');
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
  }
}