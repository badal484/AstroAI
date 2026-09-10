import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors } from '../../theme';

export type AstroIconName =
  | 'home'
  | 'consult'
  | 'kundli'
  | 'sanctuary'
  | 'wallet'
  | 'sun'
  | 'moon'
  | 'rashi'
  | 'compatibility'
  | 'palm'
  | 'puja'
  | 'report'
  | 'call'
  | 'chat'
  | 'star'
  | 'check'
  | 'flame'
  | 'saturn'
  | 'node'
  | 'sparkle'
  | 'arrow-right'
  | 'clock'
  | 'shield'
  | 'coin'
  | 'radar'
  | 'mic'
  | 'play'
  | 'pause'
  | 'location'
  | 'package'
  | 'live'
  | 'heart'
  | 'briefcase'
  | 'thumb-up'
  | 'bolt'
  | 'compass'
  | 'orders'
  | 'close'
  | 'trishul'
  | 'lotus'
  | 'sword'
  | 'bell';

interface AstroIconProps {
  name: AstroIconName;
  size?: number;
  color?: string;
  focused?: boolean;
  style?: ViewStyle;
}

/**
 * High-end geometric vector glyphs for the Linear/Editorial UI aesthetic.
 * Replaces all casual emojis with crisp, modern architectural symbols and micro-badges.
 */
export function AstroIcon({
  name,
  size = 20,
  color = colors.primary,
  focused = false,
  style,
}: AstroIconProps) {
  const activeColor = focused ? colors.primary : color;

  switch (name) {
    case 'home':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.homeRoof, { borderBottomColor: activeColor }]} />
          <View style={[styles.homeBase, { borderColor: activeColor }]} />
        </View>
      );

    case 'consult':
    case 'chat':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.chatBubble, { borderColor: activeColor }]}>
            <View style={[styles.chatDot, { backgroundColor: activeColor }]} />
            <View style={[styles.chatDot, { backgroundColor: activeColor }]} />
          </View>
        </View>
      );

    case 'kundli':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.diamondBox, { borderColor: activeColor }]}>
            <View style={[styles.diamondInner, { backgroundColor: activeColor }]} />
          </View>
        </View>
      );

    case 'sanctuary':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.sanctuaryArch, { borderColor: activeColor }]}>
            <View style={[styles.sanctuaryPillar, { backgroundColor: activeColor }]} />
          </View>
        </View>
      );

    case 'wallet':
    case 'coin':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.coinOuter, { borderColor: activeColor }]}>
            <View style={[styles.coinInner, { borderColor: activeColor }]} />
          </View>
        </View>
      );

    case 'sun':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.sunRayV, { backgroundColor: activeColor }]} />
          <View style={[styles.sunRayH, { backgroundColor: activeColor }]} />
          <View style={[styles.sunCore, { borderColor: activeColor }]} />
        </View>
      );

    case 'moon':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.crescentMoon, { borderColor: activeColor }]} />
        </View>
      );

    case 'rashi':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <Text style={[styles.sparkleGlyph, { color: activeColor, fontSize: size * 0.85 }]}>✦</Text>
        </View>
      );

    case 'compatibility':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.ringLeft, { borderColor: activeColor }]} />
          <View style={[styles.ringRight, { borderColor: activeColor }]} />
        </View>
      );

    case 'palm':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.palmHandFrame, { borderColor: activeColor }]}>
            <View style={styles.palmFingersRow}>
              <View style={[styles.fingerBar, { backgroundColor: activeColor }]} />
              <View style={[styles.fingerBar, { backgroundColor: activeColor }]} />
              <View style={[styles.fingerBar, { backgroundColor: activeColor }]} />
            </View>
            <View style={[styles.palmHeartLine, { backgroundColor: activeColor }]} />
          </View>
        </View>
      );

    case 'puja':
    case 'flame':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.flamePeak, { borderBottomColor: activeColor }]} />
          <View style={[styles.flameBase, { backgroundColor: activeColor }]} />
        </View>
      );

    case 'report':
    case 'orders':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.docBody, { borderColor: activeColor }]}>
            <View style={[styles.docLine, { backgroundColor: activeColor }]} />
            <View style={[styles.docLineShort, { backgroundColor: activeColor }]} />
          </View>
        </View>
      );

    case 'call':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.callReceiver, { borderColor: activeColor }]} />
        </View>
      );

    case 'star':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <Text style={[styles.starGlyph, { color: activeColor, fontSize: size * 0.8 }]}>★</Text>
        </View>
      );

    case 'check':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <Text style={[styles.checkGlyph, { color: activeColor, fontSize: size * 0.8 }]}>✓</Text>
        </View>
      );

    case 'sparkle':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <Text style={[styles.sparkleGlyph, { color: activeColor, fontSize: size * 0.85 }]}>✦</Text>
        </View>
      );

    case 'saturn':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.orbitPlanet, { borderColor: activeColor }]}>
            <View style={[styles.orbitRing, { borderColor: activeColor }]} />
          </View>
        </View>
      );

    case 'node':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.nodeCircle, { borderColor: activeColor }]} />
        </View>
      );

    case 'arrow-right':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <Text style={[styles.arrowGlyph, { color: activeColor, fontSize: size * 0.8 }]}>→</Text>
        </View>
      );

    case 'radar':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.radarOuter, { borderColor: activeColor }]}>
            <View style={[styles.radarInner, { borderColor: activeColor }]} />
          </View>
        </View>
      );

    case 'mic':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.micCapsule, { borderColor: activeColor }]}>
            <View style={[styles.micHead, { backgroundColor: activeColor }]} />
          </View>
          <View style={[styles.micStand, { backgroundColor: activeColor }]} />
        </View>
      );

    case 'play':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.playTriangle, { borderLeftColor: activeColor }]} />
        </View>
      );

    case 'pause':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={styles.pauseContainer}>
            <View style={[styles.pauseBar, { backgroundColor: activeColor }]} />
            <View style={[styles.pauseBar, { backgroundColor: activeColor }]} />
          </View>
        </View>
      );

    case 'location':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.pinHead, { borderColor: activeColor }]}>
            <View style={[styles.pinDot, { backgroundColor: activeColor }]} />
          </View>
        </View>
      );

    case 'package':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.boxCube, { borderColor: activeColor }]}>
            <View style={[styles.boxTape, { backgroundColor: activeColor }]} />
          </View>
        </View>
      );

    case 'live':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.liveDotOuter, { borderColor: activeColor }]}>
            <View style={[styles.liveDotInner, { backgroundColor: activeColor }]} />
          </View>
        </View>
      );

    case 'heart':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.heartWingLeft, { backgroundColor: activeColor }]} />
          <View style={[styles.heartWingRight, { backgroundColor: activeColor }]} />
        </View>
      );

    case 'briefcase':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.caseHandle, { borderColor: activeColor }]} />
          <View style={[styles.caseBody, { borderColor: activeColor }]} />
        </View>
      );

    case 'bolt':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.boltBarTop, { backgroundColor: activeColor }]} />
          <View style={[styles.boltBarBottom, { backgroundColor: activeColor }]} />
        </View>
      );

    case 'compass':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.compassDial, { borderColor: activeColor }]}>
            <View style={[styles.compassNeedle, { backgroundColor: activeColor }]} />
          </View>
        </View>
      );

    case 'close':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <Text style={[styles.textGlyph, { color: activeColor, fontSize: size * 0.85, fontWeight: '700' }]}>✕</Text>
        </View>
      );

    case 'trishul':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.trishulCenter, { backgroundColor: activeColor }]} />
          <View style={[styles.trishulProng, { borderColor: activeColor }]} />
        </View>
      );

    case 'lotus':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.lotusPetal, { borderColor: activeColor }]} />
        </View>
      );

    case 'sword':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.swordBlade, { backgroundColor: activeColor }]} />
          <View style={[styles.swordGuard, { backgroundColor: activeColor }]} />
        </View>
      );

    case 'thumb-up':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <Text style={[styles.textGlyph, { color: activeColor, fontSize: size * 0.8 }]}>▲</Text>
        </View>
      );

    case 'clock':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.clockRim, { borderColor: activeColor }]}>
            <View style={[styles.clockHand, { backgroundColor: activeColor }]} />
          </View>
        </View>
      );

    case 'shield':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.shieldShape, { borderColor: activeColor }]} />
        </View>
      );

    case 'bell':
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.bellDome, { borderColor: activeColor }]}>
            <View style={[styles.bellClapper, { backgroundColor: activeColor }]} />
          </View>
        </View>
      );

    default:
      return (
        <View style={[styles.center, { width: size, height: size }, style]}>
          <View style={[styles.defaultDot, { backgroundColor: activeColor }]} />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  homeBase: {
    width: 11,
    height: 8,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  chatBubble: {
    width: 17,
    height: 13,
    borderRadius: 5,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  chatDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.5,
  },
  diamondBox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondInner: {
    width: 4,
    height: 4,
    borderRadius: 1,
  },
  sanctuaryArch: {
    width: 15,
    height: 15,
    borderWidth: 1.5,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 1,
  },
  sanctuaryPillar: {
    width: 3,
    height: 5,
    borderRadius: 1,
  },
  coinOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  sunRayV: {
    position: 'absolute',
    width: 2,
    height: 16,
    borderRadius: 1,
  },
  sunRayH: {
    position: 'absolute',
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  sunCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crescentMoon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    transform: [{ rotate: '-45deg' }],
  },
  ringLeft: {
    position: 'absolute',
    left: 1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 1.5,
  },
  ringRight: {
    position: 'absolute',
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 1.5,
  },
  palmHandFrame: {
    width: 14,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 1,
  },
  palmFingersRow: {
    flexDirection: 'row',
    gap: 1.5,
    alignItems: 'center',
  },
  fingerBar: {
    width: 1.5,
    height: 4,
    borderRadius: 0.75,
  },
  palmHeartLine: {
    width: 7,
    height: 1.5,
    borderRadius: 0.75,
    marginTop: 1,
  },
  flamePeak: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  flameBase: {
    width: 8,
    height: 6,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginTop: -1,
  },
  docBody: {
    width: 13,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 2,
    padding: 2,
    justifyContent: 'center',
    gap: 2,
  },
  docLine: {
    width: '100%',
    height: 1.5,
    borderRadius: 1,
  },
  docLineShort: {
    width: '60%',
    height: 1.5,
    borderRadius: 1,
  },
  callReceiver: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 7,
    borderTopRightRadius: 2,
  },
  starGlyph: {
    fontWeight: '900',
  },
  checkGlyph: {
    fontWeight: '800',
  },
  sparkleGlyph: {
    fontWeight: '700',
  },
  textGlyph: {
    fontWeight: '700',
    textAlign: 'center',
  },
  orbitPlanet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitRing: {
    position: 'absolute',
    width: 16,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    transform: [{ rotate: '-25deg' }],
  },
  nodeCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  arrowGlyph: {
    fontWeight: '700',
  },
  radarOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
  },
  micCapsule: {
    width: 8,
    height: 11,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    paddingTop: 1,
  },
  micHead: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  micStand: {
    width: 10,
    height: 1.5,
    borderRadius: 1,
    marginTop: 1,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },
  pauseContainer: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  pauseBar: {
    width: 2.5,
    height: 10,
    borderRadius: 1,
  },
  pinHead: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 1.5,
    borderBottomRightRadius: 1,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  boxCube: {
    width: 14,
    height: 13,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxTape: {
    width: '100%',
    height: 1.5,
  },
  liveDotOuter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  caseHandle: {
    width: 6,
    height: 3,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    marginBottom: 0.5,
  },
  caseBody: {
    width: 14,
    height: 10,
    borderWidth: 1.5,
    borderRadius: 2,
  },
  compassDial: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassNeedle: {
    width: 1.5,
    height: 8,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  trishulCenter: {
    width: 1.5,
    height: 14,
    borderRadius: 1,
  },
  trishulProng: {
    position: 'absolute',
    top: 1,
    width: 10,
    height: 6,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderRadius: 3,
  },
  lotusPetal: {
    width: 12,
    height: 10,
    borderWidth: 1.5,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomWidth: 0,
  },
  swordBlade: {
    width: 2,
    height: 12,
    borderRadius: 1,
  },
  swordGuard: {
    position: 'absolute',
    bottom: 3,
    width: 8,
    height: 1.5,
    borderRadius: 1,
  },
  clockRim: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockHand: {
    width: 1.5,
    height: 5,
    borderRadius: 1,
  },
  shieldShape: {
    width: 12,
    height: 14,
    borderWidth: 1.5,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  bellDome: {
    width: 13,
    height: 12,
    borderWidth: 1.5,
    borderTopLeftRadius: 6.5,
    borderTopRightRadius: 6.5,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 0.5,
  },
  bellClapper: {
    width: 3,
    height: 2,
    borderRadius: 1,
  },
  defaultDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heartWingLeft: {
    position: 'absolute',
    width: 5,
    height: 8,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    transform: [{ rotate: '-45deg' }, { translateX: -1 }],
  },
  heartWingRight: {
    position: 'absolute',
    width: 5,
    height: 8,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    transform: [{ rotate: '45deg' }, { translateX: 1 }],
  },
  boltBarTop: {
    width: 7,
    height: 2.5,
    borderRadius: 1,
    transform: [{ rotate: '-35deg' }, { translateX: -1 }, { translateY: -2 }],
  },
  boltBarBottom: {
    width: 7,
    height: 2.5,
    borderRadius: 1,
    transform: [{ rotate: '-35deg' }, { translateX: 1 }, { translateY: 2 }],
  },
});
