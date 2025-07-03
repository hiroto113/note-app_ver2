import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// アクセシビリティ設定の型定義
export interface A11yConfig {
	announcements: string[];
	focusManagement: boolean;
	keyboardShortcuts: boolean;
	skipLinks: boolean;
}

export interface A11yPreferences {
	reduceMotion: boolean;
	highContrast: boolean;
	fontSize: 'small' | 'medium' | 'large';
}

// デフォルト設定
const defaultConfig: A11yConfig = {
	announcements: [],
	focusManagement: true,
	keyboardShortcuts: true,
	skipLinks: true
};

const defaultPreferences: A11yPreferences = {
	reduceMotion: false,
	highContrast: false,
	fontSize: 'medium'
};

// アナウンスメント用ストア
export const announcements = writable<string[]>([]);

// アクセシビリティ設定ストア
export const a11yConfig = writable<A11yConfig>(defaultConfig);

// ユーザー設定ストア
export const a11yPreferences = writable<A11yPreferences>(defaultPreferences);

// アナウンスメント関数
export function announce(message: string) {
	if (!browser) return;

	announcements.update((messages) => {
		const newMessages = [...messages, message];

		// 最大5件まで保持
		if (newMessages.length > 5) {
			newMessages.shift();
		}

		return newMessages;
	});

	// 一定時間後にメッセージをクリア
	setTimeout(() => {
		announcements.update((messages) => messages.filter((msg) => msg !== message));
	}, 5000);
}

// フォーカス管理ユーティリティ
export function manageFocus(element: HTMLElement, delay = 0) {
	if (!browser) return;

	setTimeout(() => {
		element.focus();

		// フォーカスが当たったことをアナウンス（必要に応じて）
		const label =
			element.getAttribute('aria-label') ||
			element.getAttribute('alt') ||
			element.textContent?.trim();

		if (label) {
			announce(`フォーカス: ${label}`);
		}
	}, delay);
}

// キーボードショートカット管理
export function setupKeyboardShortcuts() {
	if (!browser) return;

	document.addEventListener('keydown', (event) => {
		// Ctrl + / でショートカットヘルプを表示
		if (event.ctrlKey && event.key === '/') {
			event.preventDefault();
			announce(
				'キーボードショートカット: Tab でナビゲーション, Enter で選択, Escape でキャンセル, / で検索'
			);
		}

		// / キーで検索フォーカス（フォーム要素内でない場合）
		if (event.key === '/' && !isFormElement(event.target as Element)) {
			event.preventDefault();
			const searchInput = document.querySelector(
				'input[type="search"], input[name="search"]'
			) as HTMLElement;
			if (searchInput) {
				manageFocus(searchInput);
				announce('検索フィールドにフォーカスしました');
			}
		}

		// Escape キーでモーダルやメニューを閉じる
		if (event.key === 'Escape') {
			const activeModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
			const activeMenu = document.querySelector('[role="menu"][aria-expanded="true"]');

			if (activeModal || activeMenu) {
				event.preventDefault();
				// モーダル/メニューのクローズ処理をトリガー
				document.dispatchEvent(new CustomEvent('escape-pressed'));
			}
		}
	});
}

// フォーム要素かどうかを判定
function isFormElement(element: Element): boolean {
	const formElements = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'];
	return formElements.includes(element.tagName) || element.hasAttribute('contenteditable');
}

// ユーザー設定の初期化
export function initializeA11yPreferences() {
	if (!browser) return;

	// prefers-reduced-motion の検出
	const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
	a11yPreferences.update((prefs) => ({
		...prefs,
		reduceMotion: mediaQuery.matches
	}));

	// メディアクエリの変更を監視
	mediaQuery.addEventListener('change', (e) => {
		a11yPreferences.update((prefs) => ({
			...prefs,
			reduceMotion: e.matches
		}));
	});

	// ハイコントラストモードの検出
	const contrastQuery = window.matchMedia('(prefers-contrast: high)');
	a11yPreferences.update((prefs) => ({
		...prefs,
		highContrast: contrastQuery.matches
	}));

	contrastQuery.addEventListener('change', (e) => {
		a11yPreferences.update((prefs) => ({
			...prefs,
			highContrast: e.matches
		}));
	});
}

// ページタイトルの更新とアナウンス
export function updatePageTitle(title: string) {
	if (!browser) return;

	document.title = title;
	announce(`ページが変更されました: ${title}`);
}

// ルート変更時のアナウンス
export function announceRouteChange(routeName: string) {
	announce(`${routeName}ページに移動しました`);
}
