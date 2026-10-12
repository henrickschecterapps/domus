import confetti from 'canvas-confetti';

export function fireCelebrationConfetti() {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10B981', '#38BDF8', '#F59E0B', '#A855F7']
    });
  } catch (e) {
    // Graceful fallback if canvas is unavailable
  }
}

export function fireBigConfetti() {
  try {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#10B981', '#38BDF8', '#EC4899', '#F59E0B']
    });
  } catch (e) {
    // Graceful fallback
  }
}
