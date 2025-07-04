<script lang="ts">
	import StatusBadge from './StatusBadge.svelte';
	import type { Post } from '$lib/server/db/schema';

	export let post: Post & { author: { id: string; username: string } };

	function formatDate(dateString: string | Date) {
		const date = new Date(dateString);
		return date.toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function handleEdit() {
		window.location.href = `/admin/posts/${post.id}/edit`;
	}

	function handleDelete() {
		if (
			confirm(`「${post.title}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`)
		) {
			deletePost();
		}
	}

	async function deletePost() {
		try {
			const response = await fetch(`/api/admin/posts/${post.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				// Reload page to refresh the list
				window.location.reload();
			} else {
				const error = await response.json();
				alert(`削除に失敗しました: ${error.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Delete error:', error);
			alert('削除中にエラーが発生しました。');
		}
	}
</script>

<div
	class="rounded-lg border border-gray-200 bg-white shadow transition-shadow duration-200 hover:shadow-md"
	data-testid="post-card-{post.id}"
	role="listitem"
	aria-label="記事: {post.title}"
>
	<div class="p-6">
		<div class="flex items-start justify-between">
			<div class="min-w-0 flex-1">
				<h3 class="truncate text-lg font-medium text-gray-900">
					<a
						href="/posts/{post.slug}"
						target="_blank"
						class="transition-colors hover:text-blue-600"
						title="記事を表示"
					>
						{post.title}
					</a>
				</h3>

				{#if post.excerpt}
					<p class="mt-1 line-clamp-2 text-sm text-gray-600">
						{post.excerpt}
					</p>
				{/if}
			</div>

			<div class="ml-4 flex-shrink-0">
				<StatusBadge status={post.status} />
			</div>
		</div>

		<div class="mt-4 flex items-center justify-between text-sm text-gray-500">
			<div class="flex items-center space-x-4">
				<span>作成者: {post.author.username}</span>
				{#if post.publishedAt}
					<span>公開: {formatDate(post.publishedAt)}</span>
				{/if}
				<span>更新: {formatDate(post.updatedAt)}</span>
			</div>
		</div>

		<div class="mt-4 flex items-center justify-end space-x-3">
			<button
				on:click={handleEdit}
				data-testid="edit-post-{post.id}"
				aria-label="記事『{post.title}』を編集"
				class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				編集
			</button>

			<button
				on:click={handleDelete}
				data-testid="delete-post-{post.id}"
				aria-label="記事『{post.title}』を削除"
				class="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
			>
				削除
			</button>
		</div>
	</div>
</div>
