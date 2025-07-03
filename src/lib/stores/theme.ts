import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// テーマの型定義
export type Theme = 'light' | 'dark';
export type ThemeMode = 'light' | 'dark' | 'system';

// テーマストアの型定義
interface ThemeStore {
	current: Theme;
	mode: ThemeMode;
}

// ローカルストレージキー
const STORAGE_KEY = 'theme-preference';

// システムのダークモード設定を取得
function getSystemTheme(): Theme {
	if (!browser) return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// 保存されたテーマ設定を取得
function getSavedThemeMode(): ThemeMode {
	if (!browser) return 'system';
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved === 'light' || saved === 'dark' || saved === 'system') {
			return saved;
		}
	} catch (error) {
		console.warn('Failed to read theme preference from localStorage:', error);
	}
	return 'system';
}

// 実際のテーマを決定
function resolveTheme(mode: ThemeMode): Theme {
	if (mode === 'system') {
		return getSystemTheme();
	}
	return mode;
}

// 初期値を設定
const initialMode = getSavedThemeMode();
const initialTheme = resolveTheme(initialMode);

// ストアを作成
function createThemeStore() {
	const { subscribe, update } = writable<ThemeStore>({
		current: initialTheme,
		mode: initialMode
	});

	return {
		subscribe,

		// テーマモードを設定
		setMode: (mode: ThemeMode) => {
			update(() => {
				const newTheme = resolveTheme(mode);
				const newStore = { current: newTheme, mode };

				// ローカルストレージに保存
				if (browser) {
					try {
						localStorage.setItem(STORAGE_KEY, mode);
					} catch (error) {
						console.warn('Failed to save theme preference to localStorage:', error);
					}
				}

				// DOMクラスを更新
				applyTheme(newTheme);

				return newStore;
			});
		},

		// ライト/ダークを切り替え
		toggle: () => {
			update((store) => {
				const newMode: ThemeMode = store.current === 'light' ? 'dark' : 'light';
				const newStore = { current: newMode, mode: newMode };

				// ローカルストレージに保存
				if (browser) {
					try {
						localStorage.setItem(STORAGE_KEY, newMode);
					} catch (error) {
						console.warn('Failed to save theme preference to localStorage:', error);
					}
				}

				// DOMクラスを更新
				applyTheme(newMode);

				return newStore;
			});
		},

		// システム設定変更時の更新
		updateSystemTheme: () => {
			update((store) => {
				if (store.mode === 'system') {
					const systemTheme = getSystemTheme();
					if (systemTheme !== store.current) {
						applyTheme(systemTheme);
						return { ...store, current: systemTheme };
					}
				}
				return store;
			});
		}
	};
}

// DOMにテーマクラスを適用
function applyTheme(theme: Theme) {
	if (!browser) return;

	const root = document.documentElement;
	if (theme === 'dark') {
		root.classList.add('dark');
	} else {
		root.classList.remove('dark');
	}
}

// テーマストアをエクスポート
export const themeStore = createThemeStore();

// ブラウザ環境での初期化
if (browser) {
	// 初期テーマを適用
	applyTheme(initialTheme);

	// システム設定変更の監視
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery.addEventListener('change', () => {
		themeStore.updateSystemTheme();
	});
}
