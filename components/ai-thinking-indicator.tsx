// ============================================================================
// ⚛️ React packages
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

// ============================================================================
// 🧩 Expo packages
// ============================================================================

import { AudioPlayer, createAudioPlayer } from 'expo-audio';

// ============================================================================
// 🏠 Internal assets
// ============================================================================

import { ThemedText } from '@/components/themed-text';
import { useAppContext } from '@/hooks';

// ============================================================================
// ⚙️ Function Component & Props
// ============================================================================

export function AiThinkingIndicator() {
  // ============================================================================
  // 🪝 HOOKS (Derived Values)
  // ============================================================================

  const { aiThinkingSoundEnabled } = useAppContext();

  // ============================================================================
  // 🔄 STATE
  // ============================================================================

  const [chars, setChars] = useState<string[]>([]);
  const [colorIndex, setColorIndex] = useState(0);

  // ============================================================================
  // 🔗 REF
  // ============================================================================

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef<AudioPlayer | null>(null);

  // ============================================================================
  // 📐 CONSTANTS
  // ============================================================================

  const SYMBOLS = [
    'α',
    'β',
    'λ',
    'ϕ',
    '∑',
    'Ω',
    '∞',
    'Ψ',
    'π',
    'Δ',
    '∂',
    'µ',
    'ξ',
    'χ',
    'Θ',
    'γ',
    'ζ',
    'ρ',
    'η',
    'σ',
  ];

  const COLORS = ['#1E3A5F', '#2E5A7F', '#3B6B99', '#1A4566', '#2C5C80'];

  // ============================================================================
  // ⚡️ EFFECTS
  // ============================================================================

  // 🌀 Animated symbol flow
  useEffect(() => {
    const interval = setInterval(() => {
      setChars((prev) => {
        const next = [...prev];
        if (next.length > 15) next.shift();
        next.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // 💫 Pulse animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0.6,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fadeAnim, scaleAnim]);

  // 🌈 Cycle colors
  useEffect(() => {
    const colorCycle = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % COLORS.length);
    }, 1000);
    return () => clearInterval(colorCycle);
  }, []);

  // 🎧 Play ambient hum
  useEffect(() => {
    let isMounted = true;
    let player: AudioPlayer | null = null;

    const loadSound = async () => {
      try {
        if (aiThinkingSoundEnabled) {
          // Create and load sound
          player = createAudioPlayer();
          player.replace(require('../assets/ai-thinking.mp3'));
          player.loop = true;
          player.volume = 0.4;
          if (isMounted) {
            player.play();
            soundRef.current = player;
          }
        }
      } catch (err) {
        console.warn('Error loading AI thinking sound:', err);
      }
    };

    loadSound();

    // Cleanup
    return () => {
      isMounted = false;
      if (player) {
        player.pause();
        player.remove();
      }
    };
  }, [aiThinkingSoundEnabled]);

  // ============================================================================
  // 👁️ RENDER
  // ============================================================================

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText
        type="subtitle"
        style={{
          marginTop: 15,
          marginBottom: 15,
          textAlign: 'center',
        }}
      >
        AI Thinking
      </ThemedText>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 10,
        }}
      >
        {chars.map((c, i) => (
          <Animated.Text
            key={i}
            style={{
              fontSize: 22,
              fontWeight: '700',
              marginHorizontal: 2,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              color: COLORS[(colorIndex + i) % COLORS.length],
              textShadowColor: COLORS[(colorIndex + i) % COLORS.length],
              textShadowRadius: 10,
            }}
          >
            {c}
          </Animated.Text>
        ))}
      </View>
    </View>
  );
}
