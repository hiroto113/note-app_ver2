<script lang="ts">
	import OGPTags from '$lib/components/seo/OGPTags.svelte';

	let formData = {
		name: '',
		email: '',
		subject: '',
		message: ''
	};

	let isSubmitting = false;
	let submitStatus: 'idle' | 'success' | 'error' = 'idle';

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isSubmitting = true;

		try {
			// 実際の実装では、APIエンドポイントに送信
			await new Promise((resolve) => setTimeout(resolve, 1000));

			submitStatus = 'success';
			formData = { name: '', email: '', subject: '', message: '' };
		} catch {
			submitStatus = 'error';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<OGPTags
	title="お問い合わせ"
	description="My Notesに関するご質問、ご要望、不具合報告はこちらからお気軽にお問い合わせください。"
	type="website"
/>

<svelte:head>
	<title>お問い合わせ - My Notes</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<header class="mb-12 text-center">
		<h1 class="mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100">お問い合わせ</h1>
		<p class="text-xl text-gray-600 dark:text-gray-300">ご質問やご要望はお気軽にどうぞ</p>
	</header>

	<div class="grid gap-8 lg:grid-cols-3">
		<!-- お問い合わせフォーム -->
		<div class="lg:col-span-2">
			<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
				<h2 class="mb-6 text-2xl font-semibold">メッセージを送信</h2>

				{#if submitStatus === 'success'}
					<div
						class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
					>
						<div class="flex items-center">
							<svg
								class="mr-2 h-5 w-5 text-green-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<p class="text-green-800 dark:text-green-200">
								メッセージを送信しました。お返事までしばらくお待ちください。
							</p>
						</div>
					</div>
				{/if}

				{#if submitStatus === 'error'}
					<div
						class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
					>
						<div class="flex items-center">
							<svg
								class="mr-2 h-5 w-5 text-red-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
							<p class="text-red-800 dark:text-red-200">
								送信に失敗しました。しばらく時間をおいて再度お試しください。
							</p>
						</div>
					</div>
				{/if}

				<form on:submit={handleSubmit} class="space-y-6">
					<div class="grid gap-6 md:grid-cols-2">
						<div>
							<label
								for="name"
								class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								お名前 <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="name"
								bind:value={formData.name}
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
								placeholder="山田太郎"
							/>
						</div>

						<div>
							<label
								for="email"
								class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								メールアドレス <span class="text-red-500">*</span>
							</label>
							<input
								type="email"
								id="email"
								bind:value={formData.email}
								required
								class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
								placeholder="example@email.com"
							/>
						</div>
					</div>

					<div>
						<label
							for="subject"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							件名 <span class="text-red-500">*</span>
						</label>
						<select
							id="subject"
							bind:value={formData.subject}
							required
							class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
						>
							<option value="">件名を選択してください</option>
							<option value="general">一般的なお問い合わせ</option>
							<option value="bug">不具合の報告</option>
							<option value="feature">機能の要望</option>
							<option value="account">アカウントについて</option>
							<option value="privacy">プライバシーについて</option>
							<option value="other">その他</option>
						</select>
					</div>

					<div>
						<label
							for="message"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							メッセージ <span class="text-red-500">*</span>
						</label>
						<textarea
							id="message"
							bind:value={formData.message}
							required
							rows="6"
							class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
							placeholder="お問い合わせ内容をできるだけ詳しくお書きください"
						></textarea>
					</div>

					<button
						type="submit"
						disabled={isSubmitting}
						class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isSubmitting}
							<svg
								class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							送信中...
						{:else}
							メッセージを送信
						{/if}
					</button>
				</form>
			</div>
		</div>

		<!-- サイドバー -->
		<div class="space-y-6">
			<!-- よくある質問 -->
			<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
				<h3 class="mb-4 text-lg font-semibold">よくある質問</h3>
				<div class="space-y-4">
					<div>
						<h4 class="mb-1 font-medium text-gray-900 dark:text-gray-100">
							パスワードを忘れました
						</h4>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							GitHub認証を使用しているため、GitHubアカウントでログインしてください。
						</p>
					</div>

					<div>
						<h4 class="mb-1 font-medium text-gray-900 dark:text-gray-100">
							記事が保存されません
						</h4>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							ブラウザのキャッシュをクリアするか、別のブラウザでお試しください。
						</p>
					</div>

					<div>
						<h4 class="mb-1 font-medium text-gray-900 dark:text-gray-100">
							データをエクスポートしたい
						</h4>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							管理画面の設定から記事データをエクスポートできます。
						</p>
					</div>
				</div>
			</div>

			<!-- 連絡先情報 -->
			<div class="rounded-lg bg-gray-50 p-6 dark:bg-gray-800">
				<h3 class="mb-4 text-lg font-semibold">その他の連絡方法</h3>
				<div class="space-y-3">
					<div class="flex items-center">
						<svg
							class="mr-3 h-5 w-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
							/>
						</svg>
						<span class="text-sm text-gray-600 dark:text-gray-400">
							support@mynotes.example.com
						</span>
					</div>

					<div class="flex items-center">
						<svg
							class="mr-3 h-5 w-5 text-gray-400"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
								clip-rule="evenodd"
							/>
						</svg>
						<a
							href="https://github.com/user/repo"
							target="_blank"
							rel="noopener noreferrer"
							class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
						>
							GitHub Issues
						</a>
					</div>
				</div>
			</div>

			<!-- 対応時間 -->
			<div class="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
				<h3 class="mb-4 text-lg font-semibold">対応時間</h3>
				<div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
					<p><strong>平日:</strong> 10:00 - 18:00</p>
					<p><strong>土日祝:</strong> 対応なし</p>
					<p class="mt-3 text-xs">※緊急の場合は24時間以内に対応いたします</p>
				</div>
			</div>
		</div>
	</div>
</div>
