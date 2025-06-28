<script lang="ts">
	export let status: 'draft' | 'published';
	
	$: badgeClass = status === 'published' 
		? 'bg-green-100 text-green-800' 
		: 'bg-yellow-100 text-yellow-800';
	
	$: statusText = status === 'published' ? '公開' : '下書き';
</script>

<span 
	class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {badgeClass}"
>
	{statusText}
</span>