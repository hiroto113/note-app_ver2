<script lang="ts">
	// スクリーンリーダー専用コンテンツ
	// 視覚的には非表示だが、スクリーンリーダーでは読み上げられる
</script>

<span class="sr-only">
	<slot />
</span>

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
