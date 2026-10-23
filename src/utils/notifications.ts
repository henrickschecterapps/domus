/**
 * System and Browser Web Push Notification helper for Domus PWA
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (err) {
    console.error('Failed to request notification permission:', err);
    return false;
  }
}

export function sendLocalNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const defaultIcon = '/pwa-192x192.png';
    const notif = new Notification(title, {
      icon: defaultIcon,
      badge: defaultIcon,
      ...options,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return notif;
  } catch (err) {
    // If constructor fails on mobile browsers, attempt via ServiceWorker registration
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          icon: '/pwa-192x192.png',
          ...options,
        });
      });
    }
    return null;
  }
}

/**
 * Checks for bills due today, overdue chores and pet duties assigned to currentUser,
 * ensuring residents never miss critical deadlines.
 */
export function checkAndTriggerHouseAlerts(
  houseName: string,
  billsDueTodayCount: number,
  overdueBillsCount: number,
  petDutyToday: boolean,
  petName: string,
  urgentRoomCount: number
) {
  if (getNotificationPermission() !== 'granted') return;

  const now = new Date();
  const todayKey = `domus_alert_sent_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}`;
  if (sessionStorage.getItem(todayKey)) return; // Only notify once per session/day

  if (billsDueTodayCount > 0 || overdueBillsCount > 0) {
    sendLocalNotification(`🔔 Domus • ${houseName}`, {
      body: billsDueTodayCount > 0
        ? `Atenção: Você tem ${billsDueTodayCount} conta(s) vencendo HOJE!`
        : `Atenção: Existem ${overdueBillsCount} conta(s) em atraso na residência.`,
      tag: 'domus-bills-alert',
    });
    sessionStorage.setItem(todayKey, 'true');
    return;
  }

  if (petDutyToday && petName) {
    sendLocalNotification(`🐾 Turno do Pet • ${houseName}`, {
      body: `Hoje é o seu dia no revezamento de cuidados do(a) ${petName}!`,
      tag: 'domus-pet-alert',
    });
    sessionStorage.setItem(todayKey, 'true');
    return;
  }

  if (urgentRoomCount > 0) {
    sendLocalNotification(`🧹 Cuidados do Lar • ${houseName}`, {
      body: `${urgentRoomCount} ambiente(s) necessitam de limpeza urgente.`,
      tag: 'domus-cleaning-alert',
    });
    sessionStorage.setItem(todayKey, 'true');
  }
}
