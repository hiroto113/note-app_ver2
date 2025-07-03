<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let active = true;
	export let restoreFocus = true;

	let containerElement: HTMLElement;
	let previouslyFocusedElement: HTMLElement | null = null;

	onMount(() => {
		if (restoreFocus) {
			previouslyFocusedElement = document.activeElement as HTMLElement;
		}

		if (active) {
			enableFocusTrap();
		}

		return () => {
			disableFocusTrap();
		};
	});

	onDestroy(() => {
		if (restoreFocus && previouslyFocusedElement) {
			previouslyFocusedElement.focus();
		}
	});

	$: if (active) {
		enableFocusTrap();
	} else {
		disableFocusTrap();
	}

	function enableFocusTrap() {
		if (!containerElement) return;

		// フォーカス可能な要素を取得
		const focusableElements = getFocusableElements();

		if (focusableElements.length === 0) return;

		// 最初の要素にフォーカス
		focusableElements[0].focus();

		// キーボードイベントリスナーを追加
		containerElement.addEventListener('keydown', handleKeyDown);
	}

	function disableFocusTrap() {
		if (!containerElement) return;
		containerElement.removeEventListener('keydown', handleKeyDown);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key !== 'Tab') return;

		const focusableElements = getFocusableElements();
		if (focusableElements.length === 0) return;

		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		if (event.shiftKey) {
			// Shift + Tab: 逆方向
			if (document.activeElement === firstElement) {
				event.preventDefault();
				lastElement.focus();
			}
		} else {
			// Tab: 順方向
			if (document.activeElement === lastElement) {
				event.preventDefault();
				firstElement.focus();
			}
		}
	}

	function getFocusableElements(): HTMLElement[] {
		if (!containerElement) return [];

		const selector = [
			'a[href]',
			'button:not([disabled])',
			'input:not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'[tabindex]:not([tabindex="-1"])',
			'[contenteditable="true"]'
		].join(', ');

		return Array.from(containerElement.querySelectorAll(selector)) as HTMLElement[];
	}
</script>

<div bind:this={containerElement}>
	<slot />
</div>
