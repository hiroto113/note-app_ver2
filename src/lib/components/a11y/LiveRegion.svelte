<script lang="ts">
	import { onMount } from 'svelte';
	
	export let message = '';
	export let level: 'polite' | 'assertive' | 'off' = 'polite';
	export let clearOnUpdate = true;
	export let delay = 100; // メッセージ表示の遅延（ms）
	
	let liveRegion: HTMLElement;
	let displayMessage = '';
	let timeoutId: number | null = null;
	
	// メッセージが変更されたときの処理
	$: if (message && liveRegion) {
		updateMessage(message);
	}
	
	function updateMessage(newMessage: string) {
		// 既存のタイムアウトをクリア
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		
		// clearOnUpdateが有効な場合、一旦メッセージをクリア
		if (clearOnUpdate && displayMessage) {
			displayMessage = '';
			
			// 少し遅延してからメッセージを設定（スクリーンリーダーが変更を検知しやすくする）
			timeoutId = window.setTimeout(() => {
				displayMessage = newMessage;
			}, delay);
		} else {
			// 直接メッセージを設定
			timeoutId = window.setTimeout(() => {
				displayMessage = newMessage;
			}, delay);
		}
	}
	
	// メッセージをクリアする外部関数
	export function clear() {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		displayMessage = '';
	}
	
	// メッセージを即座に設定する外部関数
	export function announce(text: string, immediate = false) {
		if (immediate) {
			displayMessage = text;
		} else {
			updateMessage(text);
		}
	}
	
	onMount(() => {
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	});
</script>

<!-- 
	aria-live region: スクリーンリーダーに動的な変更を通知
	- polite: 現在の読み上げが終了してから通知
	- assertive: 即座に読み上げを中断して通知
	- off: 通知しない
-->
<div
	bind:this={liveRegion}
	aria-live={level}
	aria-atomic="true"
	aria-relevant="additions text"
	class="sr-only"
>
	{displayMessage}
</div>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>