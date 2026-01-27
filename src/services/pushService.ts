// Push notification service for Konsensus app

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const SAVE_SUB_URL = import.meta.env.VITE_SAVE_SUB_URL || '';

// Storage key for saved endpoint
const ENDPOINT_STORAGE_KEY = 'konsensus_push_endpoint';

/**
 * Convert URL-safe base64 to Uint8Array (for VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Subscribe to push notifications
 */
async function subscribe(topics: string[] = ['global']): Promise<boolean> {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            throw new Error('Push bildirimleri bu tarayıcıda desteklenmiyor.');
        }

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Bildirim izni verilmedi.');
        }

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // Save subscription to server
        const response = await fetch(SAVE_SUB_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subscription: subscription.toJSON(),
                topics,
            }),
        });

        if (!response.ok) {
            throw new Error('Abonelik kaydedilemedi.');
        }

        // Save endpoint locally
        localStorage.setItem(ENDPOINT_STORAGE_KEY, subscription.endpoint);

        return true;
    } catch (error) {
        console.error('Push subscription error:', error);
        throw error;
    }
}

/**
 * Unsubscribe from push notifications
 */
async function unsubscribe(): Promise<boolean> {
    try {
        if (!('serviceWorker' in navigator)) {
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
        }

        // Remove local endpoint
        localStorage.removeItem(ENDPOINT_STORAGE_KEY);

        return true;
    } catch (error) {
        console.error('Push unsubscribe error:', error);
        throw error;
    }
}

/**
 * Get saved endpoint from local storage
 */
function getSavedEndpoint(): string | null {
    return localStorage.getItem(ENDPOINT_STORAGE_KEY);
}

/**
 * Validate and renew subscription if needed
 */
async function validateAndRenewSubscription(): Promise<boolean> {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return false;
        }

        const savedEndpoint = getSavedEndpoint();
        if (!savedEndpoint) {
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Subscription lost, clear local storage
            localStorage.removeItem(ENDPOINT_STORAGE_KEY);
            return false;
        }

        // Check if endpoint matches
        if (subscription.endpoint !== savedEndpoint) {
            // Re-subscribe
            await subscribe(['global']);
        }

        return true;
    } catch (error) {
        console.error('Subscription validation error:', error);
        return false;
    }
}

// Export push service
export const pushService = {
    subscribe,
    unsubscribe,
    getSavedEndpoint,
    validateAndRenewSubscription,
};
