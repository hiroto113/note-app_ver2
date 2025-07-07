<script lang="ts">
	import type { QualityTrend } from '$lib/server/quality-metrics';

	export let title: string;
	export let value: number | null | undefined;
	export let unit: string;
	export let trend: QualityTrend | undefined = undefined;
	export let type: 'performance' | 'coverage' | 'size' | 'time' = 'performance';

	// Format value based on type
	function formatValue(val: number | null | undefined): string {
		if (val === null || val === undefined) return 'N/A';

		switch (type) {
			case 'size':
				return (val / 1024).toFixed(1); // Convert bytes to KB
			case 'coverage':
				return (val / 100).toFixed(1); // Convert percentage x100 to percentage
			default:
				return val.toString();
		}
	}

	// Get color classes based on type and value
	function getValueColor(val: number | null | undefined): string {
		if (val === null || val === undefined) return 'text-gray-400';

		switch (type) {
			case 'performance':
				return val >= 90
					? 'text-green-600'
					: val >= 70
						? 'text-yellow-600'
						: 'text-red-600';
			case 'coverage':
				const coverage = val / 100;
				return coverage >= 80
					? 'text-green-600'
					: coverage >= 60
						? 'text-yellow-600'
						: 'text-red-600';
			case 'size':
				const sizeKb = val / 1024;
				return sizeKb <= 500
					? 'text-green-600'
					: sizeKb <= 1000
						? 'text-yellow-600'
						: 'text-red-600';
			case 'time':
				return val <= 1000
					? 'text-green-600'
					: val <= 3000
						? 'text-yellow-600'
						: 'text-red-600';
			default:
				return 'text-gray-900';
		}
	}

	// Get trend icon and color
	function getTrendIcon(trend: QualityTrend): string {
		switch (trend.trend) {
			case 'up':
				return '↑';
			case 'down':
				return '↓';
			default:
				return '→';
		}
	}

	function getTrendColor(trend: QualityTrend): string {
		// For size and time metrics, down is good (smaller/faster)
		if (type === 'size' || type === 'time') {
			switch (trend.trend) {
				case 'down':
					return 'text-green-600';
				case 'up':
					return 'text-red-600';
				default:
					return 'text-gray-600';
			}
		}

		// For performance and coverage, up is good
		switch (trend.trend) {
			case 'up':
				return 'text-green-600';
			case 'down':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	}
</script>

<div class="rounded-lg bg-white p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<div class="flex-1">
			<p class="text-sm font-medium text-gray-600">{title}</p>
			<p class="mt-2 text-3xl font-bold {getValueColor(value)}">
				{formatValue(value)}{unit}
			</p>
		</div>

		{#if trend}
			<div class="flex flex-col items-end">
				<div class="flex items-center space-x-1">
					<span class="text-lg {getTrendColor(trend)}">
						{getTrendIcon(trend)}
					</span>
					<span class="text-sm font-medium {getTrendColor(trend)}">
						{Math.abs(trend.changePercent)}%
					</span>
				</div>
				<p class="text-xs text-gray-500">vs previous</p>
			</div>
		{/if}
	</div>

	<!-- Additional context for some metrics -->
	{#if type === 'performance' && value !== null && value !== undefined}
		<div class="mt-4 h-2 w-full rounded-full bg-gray-200">
			<div
				class="h-2 rounded-full transition-all duration-300 {value >= 90
					? 'bg-green-500'
					: value >= 70
						? 'bg-yellow-500'
						: 'bg-red-500'}"
				style="width: {value}%"
			></div>
		</div>
	{/if}

	{#if type === 'coverage' && value !== null && value !== undefined}
		<div class="mt-4 h-2 w-full rounded-full bg-gray-200">
			<div
				class="h-2 rounded-full transition-all duration-300 {value >= 8000
					? 'bg-green-500'
					: value >= 6000
						? 'bg-yellow-500'
						: 'bg-red-500'}"
				style="width: {value / 100}%"
			></div>
		</div>
	{/if}
</div>
