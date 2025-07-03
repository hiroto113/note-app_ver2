<script>
	import OGPTags from '$lib/components/seo/OGPTags.svelte';
</script>

<OGPTags
	title="About - このサイトについて"
	description="My Notesは効率的なノート管理とブログ投稿のためのWebアプリケーションです。使いやすいインターフェースで知識を整理し、共有できます。"
	type="website"
/>

<svelte:head>
	<title>About - My Notes</title>
</svelte:head>

<article class="prose prose-lg dark:prose-invert mx-auto max-w-4xl">
	<header class="mb-12 text-center">
		<h1 class="mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100">About My Notes</h1>
		<p class="text-xl text-gray-600 dark:text-gray-300">
			効率的な知識管理のためのWebアプリケーション
		</p>
	</header>

	<section class="mb-12">
		<h2 class="mb-6 text-2xl font-semibold">My Notesとは</h2>
		<div class="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
			<p class="leading-relaxed text-gray-700 dark:text-gray-300">
				My
				Notesは、個人の学習や業務での知識管理を効率化するために開発されたWebアプリケーションです。
				直感的なインターフェースと豊富な機能により、アイデアの記録から情報の整理、他者との共有まで、
				知識管理のワークフローを一元化できます。
			</p>
		</div>
	</section>

	<section class="mb-12">
		<h2 class="mb-6 text-2xl font-semibold">主な機能</h2>
		<div class="grid gap-6 md:grid-cols-2">
			<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
				<h3 class="mb-3 flex items-center text-lg font-semibold">
					<svg
						class="mr-2 h-5 w-5 text-blue-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
						/>
					</svg>
					リッチテキストエディタ
				</h3>
				<p class="text-gray-600 dark:text-gray-400">
					Markdownサポートと直感的な編集機能で、美しい文書を効率的に作成できます。
				</p>
			</div>

			<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
				<h3 class="mb-3 flex items-center text-lg font-semibold">
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
							d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"
						/>
					</svg>
					カテゴリ管理
				</h3>
				<p class="text-gray-600 dark:text-gray-400">
					柔軟なカテゴリシステムで、大量のノートを体系的に整理・分類できます。
				</p>
			</div>

			<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
				<h3 class="mb-3 flex items-center text-lg font-semibold">
					<svg
						class="mr-2 h-5 w-5 text-purple-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
					全文検索
				</h3>
				<p class="text-gray-600 dark:text-gray-400">
					高速な全文検索機能で、必要な情報を瞬時に見つけることができます。
				</p>
			</div>

			<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
				<h3 class="mb-3 flex items-center text-lg font-semibold">
					<svg
						class="mr-2 h-5 w-5 text-orange-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
						/>
					</svg>
					簡単共有
				</h3>
				<p class="text-gray-600 dark:text-gray-400">
					ワンクリックで記事を公開し、URLで簡単に他者と共有できます。
				</p>
			</div>
		</div>
	</section>

	<section class="mb-12">
		<h2 class="mb-6 text-2xl font-semibold">技術仕様</h2>
		<div class="rounded-lg bg-gray-50 p-6 dark:bg-gray-800">
			<div class="grid gap-6 md:grid-cols-2">
				<div>
					<h3 class="mb-3 font-semibold">フロントエンド</h3>
					<ul class="space-y-1 text-gray-600 dark:text-gray-400">
						<li>• SvelteKit</li>
						<li>• TypeScript</li>
						<li>• Tailwind CSS</li>
						<li>• Progressive Web App (PWA)</li>
					</ul>
				</div>
				<div>
					<h3 class="mb-3 font-semibold">バックエンド</h3>
					<ul class="space-y-1 text-gray-600 dark:text-gray-400">
						<li>• Node.js</li>
						<li>• SQLite + Drizzle ORM</li>
						<li>• Auth.js (認証)</li>
						<li>• RESTful API</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<section class="mb-12">
		<h2 class="mb-6 text-2xl font-semibold">開発理念</h2>
		<div class="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
			<p class="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">
				My
				Notesは「シンプルで使いやすく、それでいて高機能」という理念のもと開発されています。
				複雑な操作を必要とせず、誰でも直感的に使えるインターフェースを追求しています。
			</p>
			<p class="leading-relaxed text-gray-700 dark:text-gray-300">
				また、パフォーマンス、アクセシビリティ、セキュリティといった基本的な品質を重視し、
				すべてのユーザーが快適に利用できるWebアプリケーションを目指しています。
			</p>
		</div>
	</section>

	<section class="text-center">
		<h2 class="mb-6 text-2xl font-semibold">始めましょう</h2>
		<p class="mb-6 text-gray-600 dark:text-gray-400">
			My Notesで効率的な知識管理を始めてみませんか？
		</p>
		<div class="space-x-4">
			<a
				href="/posts"
				class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				記事を読む
			</a>
			<a
				href="/admin"
				class="inline-flex items-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
			>
				管理画面へ
			</a>
		</div>
	</section>
</article>
