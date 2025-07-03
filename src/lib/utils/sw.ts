/**
 * Service Worker 登録ユーティリティ
 */

/**
 * Service Worker を登録
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
	// ブラウザがService Workerをサポートしているかチェック
	if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
		console.log('Service Worker is not supported');
		return null;
	}

	// 開発環境では登録しない（オプション）
	if (import.meta.env.DEV) {
		console.log('Service Worker registration skipped in development');
		return null;
	}

	try {
		console.log('Registering Service Worker...');

		const registration = await navigator.serviceWorker.register('/sw.js', {
			scope: '/',
			updateViaCache: 'none' // 常に最新のSWをチェック
		});

		console.log('Service Worker registered successfully:', registration);

		// 更新チェック
		registration.addEventListener('updatefound', () => {
			const newWorker = registration.installing;
			if (newWorker) {
				console.log('New Service Worker found, installing...');

				newWorker.addEventListener('statechange', () => {
					if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
						// 新しいSWがインストールされ、既存のSWが動作中の場合
						console.log('New Service Worker installed, waiting for activation');
						notifyUserOfUpdate();
					}
				});
			}
		});

		// 定期的な更新チェック（24時間ごと）
		setInterval(
			() => {
				registration.update();
			},
			24 * 60 * 60 * 1000
		);

		return registration;
	} catch (error) {
		console.error('Service Worker registration failed:', error);
		return null;
	}
}

/**
 * ユーザーに更新を通知
 */
function notifyUserOfUpdate() {
	// 実際の実装では、トースト通知やモーダルで更新を促す
	console.log('アプリケーションの新しいバージョンが利用可能です');

	// 簡単な確認ダイアログ（実際の実装では適切なUIコンポーネントを使用）
	if (confirm('アプリケーションの新しいバージョンが利用可能です。今すぐ更新しますか？')) {
		window.location.reload();
	}
}

/**
 * Service Worker のメッセージを送信
 */
export function sendMessageToSW(message: Record<string, unknown>): Promise<unknown> {
	return new Promise((resolve, reject) => {
		if (!navigator.serviceWorker.controller) {
			reject(new Error('Service Worker is not controlling this page'));
			return;
		}

		const messageChannel = new MessageChannel();

		messageChannel.port1.onmessage = (event) => {
			if (event.data.error) {
				reject(new Error(event.data.error));
			} else {
				resolve(event.data);
			}
		};

		navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
	});
}

/**
 * キャッシュをクリア
 */
export async function clearAllCaches(): Promise<void> {
	if ('caches' in window) {
		const cacheNames = await caches.keys();
		await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
		console.log('All caches cleared');
	}
}

/**
 * オフライン状態を監視
 */
export function setupOfflineMonitoring() {
	if (typeof window === 'undefined') return;

	function updateOnlineStatus() {
		const isOnline = navigator.onLine;

		// 実際の実装では、アプリケーションの状態管理システムに通知
		console.log(`Application is ${isOnline ? 'online' : 'offline'}`);

		// カスタムイベントを発火
		window.dispatchEvent(
			new CustomEvent('connectionchange', {
				detail: { isOnline }
			})
		);
	}

	window.addEventListener('online', updateOnlineStatus);
	window.addEventListener('offline', updateOnlineStatus);

	// 初期状態を設定
	updateOnlineStatus();
}

/**
 * バックグラウンド同期を要求
 */
export async function requestBackgroundSync(tag: string): Promise<void> {
	if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
		const registration = await navigator.serviceWorker.ready;
		// TypeScript の型定義にない場合があるため、unknown でキャスト
		await (
			registration as ServiceWorkerRegistration & {
				sync: { register: (tag: string) => Promise<void> };
			}
		).sync.register(tag);
		console.log(`Background sync requested: ${tag}`);
	} else {
		console.log('Background sync is not supported');
	}
}

/**
 * プッシュ通知の許可を要求
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
	if ('Notification' in window) {
		const permission = await Notification.requestPermission();
		console.log(`Notification permission: ${permission}`);
		return permission;
	}
	return 'denied';
}

/**
 * プッシュ通知を購読
 */
export async function subscribeToPushNotifications(
	vapidPublicKey: string
): Promise<PushSubscription | null> {
	if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
		console.log('Push notifications are not supported');
		return null;
	}

	try {
		const registration = await navigator.serviceWorker.ready;

		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
		});

		console.log('Push notification subscription successful');
		return subscription;
	} catch (error) {
		console.error('Push notification subscription failed:', error);
		return null;
	}
}

/**
 * VAPID キーをUint8Arrayに変換
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}
