/**
 * Gentle and organic haptic feedback utility for mobile PWA
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') {
  if (typeof window === 'undefined' || !navigator.vibrate) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(24);
        break;
      case 'heavy':
        navigator.vibrate(40);
        break;
      case 'success':
        navigator.vibrate([16, 50, 24]);
        break;
      case 'warning':
        navigator.vibrate([30, 40, 30]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {
    // Graceful ignore if unsupported or permission blocked
  }
}
