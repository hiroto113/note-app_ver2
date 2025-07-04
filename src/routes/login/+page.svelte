<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import { page } from '$app/stores';

	let username = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleSubmit() {
		loading = true;
		error = '';

		try {
			const result = await signIn('credentials', {
				username,
				password,
				redirect: false
			});

			if (result?.error) {
				error = 'ログインに失敗しました。ユーザー名またはパスワードが正しくありません。';
			} else {
				// Redirect to admin or original page
				const callbackUrl = $page.url.searchParams.get('callbackUrl') || '/admin';
				window.location.href = callbackUrl;
			}
		} catch (err) {
			error = 'ログイン処理中にエラーが発生しました。';
			console.error('Login error:', err);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>ログイン - My Notes</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div>
			<h1 class="mt-6 text-center text-3xl font-extrabold text-gray-900">管理者ログイン</h1>
			<p class="mt-2 text-center text-sm text-gray-600">
				管理画面にアクセスするにはログインが必要です
			</p>
		</div>

		<form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit} role="form" aria-label="管理者ログインフォーム">
			<div class="space-y-4">
				<div>
					<label for="username" class="block text-sm font-medium text-gray-700">
						ユーザー名
					</label>
					<input
						id="username"
						name="username"
						type="text"
						required
						bind:value={username}
						disabled={loading}
						class="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-50 sm:text-sm"
						placeholder="ユーザー名を入力"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">
						パスワード
					</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						bind:value={password}
						disabled={loading}
						class="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:opacity-50 sm:text-sm"
						placeholder="パスワードを入力"
					/>
				</div>
			</div>

			{#if error}
				<div class="rounded-md border border-red-200 bg-red-50 p-3">
					<p class="text-sm text-red-600">{error}</p>
				</div>
			{/if}

			<div>
				<button
					type="submit"
					disabled={loading}
					class="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading}
						ログイン中...
					{:else}
						ログイン
					{/if}
				</button>
			</div>
		</form>

		<div class="text-center">
			<a href="/" class="text-sm text-blue-600 hover:text-blue-800"> ← サイトトップに戻る </a>
		</div>
	</div>
</div>
