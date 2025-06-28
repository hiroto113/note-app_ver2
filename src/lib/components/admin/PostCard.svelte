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
		if (confirm(`「${post.title}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
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

<div class="bg-white shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
	<div class="p-6">
		<div class="flex items-start justify-between">
			<div class="flex-1 min-w-0">
				<h3 class="text-lg font-medium text-gray-900 truncate">
					<a 
						href="/posts/{post.slug}" 
						target="_blank"
						class="hover:text-blue-600 transition-colors"
						title="記事を表示"
					>
						{post.title}
					</a>
				</h3>
				
				{#if post.excerpt}
					<p class="mt-1 text-sm text-gray-600 line-clamp-2">
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
				class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
			>
				編集
			</button>
			
			<button
				on:click={handleDelete}
				class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
			>
				削除
			</button>
		</div>
	</div>
</div>