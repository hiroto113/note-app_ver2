<script lang="ts">
	import { adminApi } from '$lib/api';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		upload: { url: string; filename: string };
		error: { message: string };
	}>();

	export let accept = 'image/*';
	export let maxSize = 5 * 1024 * 1024; // 5MB
	export let type: 'image' | 'document' = 'image';

	let fileInput: HTMLInputElement;
	let uploading = false;
	let dragOver = false;

	// ファイル選択時の処理
	async function handleFileSelect(files: FileList) {
		if (files.length === 0) return;

		const file = files[0];

		// ファイルサイズチェック
		if (file.size > maxSize) {
			const maxMB = maxSize / (1024 * 1024);
			dispatch('error', { message: `ファイルサイズは${maxMB}MB以下にしてください` });
			return;
		}

		await uploadFile(file);
	}

	// ファイルアップロード
	async function uploadFile(file: File) {
		uploading = true;
		try {
			const result = await adminApi.uploadFile(file, type);
			dispatch('upload', {
				url: result.file.url,
				filename: result.file.name
			});
		} catch (error) {
			console.error('Upload error:', error);
			dispatch('error', {
				message: error instanceof Error ? error.message : 'アップロードに失敗しました'
			});
		} finally {
			uploading = false;
			// ファイル入力をリセット
			if (fileInput) {
				fileInput.value = '';
			}
		}
	}

	// ドラッグ&ドロップ処理
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;

		const files = event.dataTransfer?.files;
		if (files) {
			handleFileSelect(files);
		}
	}

	// ファイル選択ダイアログを開く
	function openFileDialog() {
		fileInput?.click();
	}
</script>

<div
	class="rounded-lg border-2 border-dashed p-6 text-center transition-colors {dragOver
		? 'border-indigo-500 bg-indigo-50'
		: 'border-gray-300 hover:border-gray-400'}"
	on:dragover={handleDragOver}
	on:dragleave={handleDragLeave}
	on:drop={handleDrop}
	role="button"
	tabindex="0"
	on:click={openFileDialog}
	on:keydown={(e) => e.key === 'Enter' && openFileDialog()}
>
	{#if uploading}
		<div class="flex flex-col items-center">
			<div class="mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
			<p class="text-sm text-gray-600">アップロード中...</p>
		</div>
	{:else}
		<div class="flex flex-col items-center">
			<svg
				class="mb-2 h-12 w-12 text-gray-400"
				stroke="currentColor"
				fill="none"
				viewBox="0 0 48 48"
			>
				<path
					d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<p class="mb-1 text-sm text-gray-600">
				ドラッグ&ドロップまたはクリックしてファイルを選択
			</p>
			<p class="text-xs text-gray-500">
				{type === 'image' ? 'JPEG, PNG, GIF, WebP, SVG' : 'PDF, TXT, MD'}
				(最大 {Math.round(maxSize / (1024 * 1024))}MB)
			</p>
		</div>
	{/if}

	<input
		bind:this={fileInput}
		type="file"
		{accept}
		class="hidden"
		on:change={(e) => {
			const target = e.target as HTMLInputElement;
			if (target.files) handleFileSelect(target.files);
		}}
	/>
</div>
