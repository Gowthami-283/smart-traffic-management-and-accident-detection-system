/**
 * Smart Traffic Management and Accident Detection System
 * Web Audio API Sound Synthesizer
 * 
 * Provides:
 * 1. Powerful alternating emergency siren sound (clear high and low tones)
 * 2. Warning beep when traffic signals change
 * 3. Test alarm functionality
 * 4. Stop alarm / mute controls
 * 5. AudioContext lifecycle & browser autoplay policy handling
 */

class SoundSynthesizer {
  constructor() {
    this.audioCtx = null;
    this.isAlarmPlaying = false;
    this.isMuted = false;
    this.sirenTimer = null;
    this.sirenOsc1 = null;
    this.sirenOsc2 = null;
    this.sirenGain = null;
    this.testAlarmTimeout = null;

    // Siren tone settings (alternating high and low tones)
    this.highToneFreq = 960; // Hz - High alert tone
    this.lowToneFreq = 620;  // Hz - Low alert tone
    this.toneIntervalMs = 380; // Toggle interval for authentic emergency siren rhythm
  }

  /**
   * Initialize or resume the AudioContext on user interaction
   */
  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Start the loud, powerful alternating emergency siren
   */
  startEmergencyAlarm() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    if (this.isAlarmPlaying) return; // Already active

    this.isAlarmPlaying = true;

    // Master gain for emergency alarm (loud and clear, but prevented from harsh clipping)
    this.sirenGain = this.audioCtx.createGain();
    this.sirenGain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
    this.sirenGain.connect(this.audioCtx.destination);

    // Primary tone oscillator (sawtooth/triangle blend for piercing siren body)
    this.sirenOsc1 = this.audioCtx.createOscillator();
    this.sirenOsc1.type = 'sawtooth';
    this.sirenOsc1.frequency.setValueAtTime(this.highToneFreq, this.audioCtx.currentTime);

    // Sub-harmonic oscillator for depth
    this.sirenOsc2 = this.audioCtx.createOscillator();
    this.sirenOsc2.type = 'sine';
    this.sirenOsc2.frequency.setValueAtTime(this.highToneFreq / 2, this.audioCtx.currentTime);

    const subGain = this.audioCtx.createGain();
    subGain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    this.sirenOsc2.connect(subGain);
    subGain.connect(this.sirenGain);

    this.sirenOsc1.connect(this.sirenGain);

    this.sirenOsc1.start();
    this.sirenOsc2.start();

    // Toggle alternating high and low tones
    let isHigh = true;
    this.sirenTimer = setInterval(() => {
      if (!this.isAlarmPlaying || !this.audioCtx) return;
      isHigh = !isHigh;
      const targetFreq = isHigh ? this.highToneFreq : this.lowToneFreq;
      const now = this.audioCtx.currentTime;

      // Smooth micro-glide between siren frequencies for realistic acoustic siren transition
      this.sirenOsc1.frequency.cancelScheduledValues(now);
      this.sirenOsc1.frequency.setTargetAtTime(targetFreq, now, 0.04);

      this.sirenOsc2.frequency.cancelScheduledValues(now);
      this.sirenOsc2.frequency.setTargetAtTime(targetFreq / 2, now, 0.04);
    }, this.toneIntervalMs);

    // Dispatch global event for visual indicators
    window.dispatchEvent(new CustomEvent('alarm-state-changed', {
      detail: { active: true }
    }));
  }

  /**
   * Stop the emergency alarm
   */
  stopEmergencyAlarm() {
    if (this.testAlarmTimeout) {
      clearTimeout(this.testAlarmTimeout);
      this.testAlarmTimeout = null;
    }

    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }

    if (this.sirenGain && this.audioCtx) {
      try {
        const now = this.audioCtx.currentTime;
        this.sirenGain.gain.setValueAtTime(this.sirenGain.gain.value, now);
        this.sirenGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        setTimeout(() => {
          if (this.sirenOsc1) {
            try { this.sirenOsc1.stop(); this.sirenOsc1.disconnect(); } catch (e) {}
            this.sirenOsc1 = null;
          }
          if (this.sirenOsc2) {
            try { this.sirenOsc2.stop(); this.sirenOsc2.disconnect(); } catch (e) {}
            this.sirenOsc2 = null;
          }
          if (this.sirenGain) {
            try { this.sirenGain.disconnect(); } catch (e) {}
            this.sirenGain = null;
          }
        }, 90);
      } catch (err) {
        // Safe cleanup fallback
        this.sirenOsc1 = null;
        this.sirenOsc2 = null;
        this.sirenGain = null;
      }
    }

    this.isAlarmPlaying = false;

    // Dispatch global event
    window.dispatchEvent(new CustomEvent('alarm-state-changed', {
      detail: { active: false }
    }));
  }

  /**
   * Test the alarm for 4 seconds or toggle test mode
   */
  testEmergencyAlarm(durationSeconds = 4) {
    if (this.isAlarmPlaying) {
      this.stopEmergencyAlarm();
      return false;
    }

    this.startEmergencyAlarm();
    this.testAlarmTimeout = setTimeout(() => {
      if (this.isAlarmPlaying) {
        this.stopEmergencyAlarm();
      }
    }, durationSeconds * 1000);
    return true;
  }

  /**
   * Play short high-tech warning beep when traffic signal is changing to Yellow or Red
   */
  playSignalWarningBeep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      // Dual-frequency beep: 880Hz down to 660Hz
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      // AudioContext may be restricted before user gesture
    }
  }

  /**
   * Play clean soft interface click/tap tone
   */
  playUiBeep(freq = 600, duration = 0.06) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch (e) {
      // Ignored if suspended
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isAlarmPlaying) {
      this.stopEmergencyAlarm();
    }
    return this.isMuted;
  }
}

// Export singleton instance
window.soundSynthesizer = new SoundSynthesizer();
