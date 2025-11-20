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
import { AI_THINKING_INDICATOR_COLORS, AI_THINKING_INDICATOR_SYMBOLS } from '@/constants';
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
  // ⚡️ EFFECTS
  // ============================================================================

  // 🌀 Animated symbol flow
  useEffect(() => {
    const interval = setInterval(() => {
      setChars((prev) => {
        const next = [...prev];
        if (next.length > 15) next.shift();
        next.push(
          AI_THINKING_INDICATOR_SYMBOLS[
            Math.floor(Math.random() * AI_THINKING_INDICATOR_SYMBOLS.length)
          ],
        );
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
      setColorIndex((prev) => (prev + 1) % AI_THINKING_INDICATOR_COLORS.length);
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
              color:
                AI_THINKING_INDICATOR_COLORS[
                  (colorIndex + i) % AI_THINKING_INDICATOR_COLORS.length
                ],
              textShadowColor:
                AI_THINKING_INDICATOR_COLORS[
                  (colorIndex + i) % AI_THINKING_INDICATOR_COLORS.length
                ],
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
