// ============================================================================
// ⚛️ React packages
// ============================================================================

import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ============================================================================
// 🏠 Internal assets
// ============================================================================

import { IconSymbol } from '@/components/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { DROPDOWN_ITEM_HEIGHT } from '@/constants';
import { useThemeColor } from '@/hooks';
import { DropdownItem } from '@/types';

// ============================================================================
// ⚙️ Function Component & Props
// ============================================================================

type Props = {
  id: string;
  label?: string;
  items: DropdownItem[];
  selectedValue: any;
  activeDropdown: string | null;
  setActiveDropdown: (id: string | null) => void;
  onSelect: (value: any) => void;
  placeholder?: string;
};

export function Dropdown({
  id,
  label,
  items,
  selectedValue,
  activeDropdown,
  setActiveDropdown,
  onSelect,
  placeholder = 'Select...',
}: Props) {
  // ============================================================================
  // 🪝 HOOKS (Derived Values)
  // ============================================================================

  const bg = useThemeColor({}, 'background');
  const cardBG = useThemeColor({}, 'cardBackground');
  const border = useThemeColor({}, 'tint') + '40';
  const text = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');
  const highlight = useThemeColor({}, 'tint');

  // ============================================================================
  // 🔗 REF
  // ============================================================================

  const scrollRef = useRef<ScrollView>(null);

  // ============================================================================
  // 📐 CONSTANTS
  // ============================================================================

  const highlightBg = highlight + '22';
  const highlightText = highlight;

  const isOpen = activeDropdown === id;
  const selectedLabel = items.find((i) => i.value === selectedValue)?.label ?? placeholder;

  // ============================================================================
  // ⚡️ EFFECTS
  // ============================================================================

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      const selectedIndex = items.findIndex((i) => i.value === selectedValue);
      if (selectedIndex > -1) {
        // Delay to ensure layout is ready
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({
            y: selectedIndex * (DROPDOWN_ITEM_HEIGHT * 1.04), // 44 = item height
            animated: false,
          });
        });
      }
    }
  }, [isOpen, items, selectedValue]);

  // ============================================================================
  // 👁️ RENDER
  // ============================================================================

  return (
    <View style={{ width: '100%', marginBottom: 0 }}>
      {label && <Text style={[styles.label, { color: text }]}>{label.toUpperCase()}</Text>}

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: cardBG },
          label ? { borderColor: border, borderWidth: 1 } : { borderWidth: 0 },
        ]}
        onPress={() => {
          if (isOpen) setActiveDropdown(null);
          else setActiveDropdown(id);
        }}
      >
        <ThemedText style={[styles.buttonText, { color: text }]}>{selectedLabel}</ThemedText>
        <IconSymbol name="chevron.down" size={22} color={tint} />
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.dropdown, { backgroundColor: bg, borderColor: tint }]}>
          <ScrollView ref={scrollRef} style={{ maxHeight: 250 }}>
            {items.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => {
                  onSelect(item.value);
                  setActiveDropdown(null); // closes all dropdowns
                }}
                style={({ pressed }) => {
                  const isSelected = item.value === selectedValue;

                  return [
                    styles.item,
                    {
                      backgroundColor: pressed ? border : isSelected ? highlightBg : bg,
                    },
                  ];
                }}
              >
                <Text
                  style={[
                    styles.itemText,
                    {
                      color: item.value === selectedValue ? highlightText : text,
                      fontWeight: item.value === selectedValue ? '600' : '400',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ============================================================================
// 🎨 STYLES
// ============================================================================

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  button: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  item: {
    // width: '100%',
    minHeight: DROPDOWN_ITEM_HEIGHT,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 16,
  },
});
