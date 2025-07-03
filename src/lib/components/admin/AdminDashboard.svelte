<script lang="ts">
	// 管理ダッシュボードの重いコンポーネント
	export const stats = {
		totalPosts: 0,
		totalCategories: 0,
		publishedPosts: 0
	};

	// ダミーのダッシュボードデータ（実際の実装では API から取得）
	const dashboardData = {
		recentPosts: [],
		analytics: {
			views: 0,
			visitors: 0
		}
	};
</script>

<div class="space-y-6">
	<!-- 詳細統計 -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg
						class="h-6 w-6 text-blue-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
						/>
					</svg>
				</div>
				<div class="ml-4">
					<div class="text-sm font-medium text-gray-500 dark:text-gray-400">
						今日の閲覧数
					</div>
					<div class="text-2xl font-bold text-gray-900 dark:text-gray-100">
						{dashboardData.analytics.views}
					</div>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg
						class="h-6 w-6 text-green-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
						/>
					</svg>
				</div>
				<div class="ml-4">
					<div class="text-sm font-medium text-gray-500 dark:text-gray-400">訪問者数</div>
					<div class="text-2xl font-bold text-gray-900 dark:text-gray-100">
						{dashboardData.analytics.visitors}
					</div>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg
						class="h-6 w-6 text-purple-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
						/>
					</svg>
				</div>
				<div class="ml-4">
					<div class="text-sm font-medium text-gray-500 dark:text-gray-400">成長率</div>
					<div class="text-2xl font-bold text-gray-900 dark:text-gray-100">+5.2%</div>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg
						class="h-6 w-6 text-orange-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"
						/>
					</svg>
				</div>
				<div class="ml-4">
					<div class="text-sm font-medium text-gray-500 dark:text-gray-400">
						人気カテゴリ
					</div>
					<div class="text-lg font-bold text-gray-900 dark:text-gray-100">技術</div>
				</div>
			</div>
		</div>
	</div>

	<!-- 最近の活動 -->
	<div class="rounded-lg bg-white shadow dark:bg-gray-800">
		<div class="px-4 py-5 sm:p-6">
			<h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
				最近の活動
			</h3>
			<div class="mt-5">
				{#if dashboardData.recentPosts.length === 0}
					<div class="py-6 text-center">
						<svg
							class="mx-auto h-12 w-12 text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
							最近の活動はありません
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							新しい記事を作成してみましょう
						</p>
					</div>
				{:else}
					<!-- 最近の投稿一覧（実装時に追加） -->
					<div class="space-y-3">
						<!-- 投稿リストがここに表示される -->
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
