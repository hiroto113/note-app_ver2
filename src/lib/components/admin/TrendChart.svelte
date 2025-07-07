<script lang="ts">
	import type { QualityMetrics } from '$lib/server/quality-metrics';

	export let title: string;
	export let data: QualityMetrics[];
	export let metrics: string[];
	export const type: 'performance' | 'coverage' | 'size' | 'time' = 'performance';

	// Simple chart implementation using SVG
	const chartWidth = 400;
	const chartHeight = 200;
	const padding = 40;

	// Process data for chart
	function processData() {
		if (data.length === 0) return [];

		const processed = data.map((item, index) => {
			const values: { [key: string]: number } = {};

			metrics.forEach((metric) => {
				let value = (item as any)[metric];

				// Normalize values based on type
				if (metric.includes('Coverage')) {
					value = value ? value / 100 : 0; // Convert percentage
				} else if (metric.includes('Size')) {
					value = value ? value / 1024 : 0; // Convert to KB
				}

				values[metric] = value || 0;
			});

			return {
				index,
				timestamp: item.timestamp,
				values
			};
		});

		return processed;
	}

	// Get chart points for a metric
	function getChartPoints(metric: string): string {
		const processedData = processData();
		if (processedData.length === 0) return '';

		const values = processedData.map((d) => d.values[metric]);
		const maxValue = Math.max(...values);
		const minValue = Math.min(...values);
		const range = maxValue - minValue || 1;

		const points = processedData.map((d, i) => {
			const x = padding + (i * (chartWidth - 2 * padding)) / (processedData.length - 1);
			const y =
				chartHeight -
				padding -
				((d.values[metric] - minValue) / range) * (chartHeight - 2 * padding);
			return `${x},${y}`;
		});

		return points.join(' ');
	}

	// Get color for metric
	function getMetricColor(metric: string, index: number): string {
		const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
		return colors[index % colors.length];
	}

	// Format label
	function formatLabel(metric: string): string {
		return metric.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
	}

	$: processedData = processData();
</script>

<div class="rounded-lg bg-white p-6 shadow-sm">
	<h3 class="mb-4 text-lg font-semibold text-gray-900">{title}</h3>

	{#if processedData.length > 0}
		<!-- Chart -->
		<div class="mb-4">
			<svg width={chartWidth} height={chartHeight} class="w-full">
				<!-- Grid lines -->
				<defs>
					<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
						<path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" stroke-width="1" />
					</pattern>
				</defs>
				<rect width="100%" height="100%" fill="url(#grid)" />

				<!-- Chart lines -->
				{#each metrics as metric, index}
					<polyline
						points={getChartPoints(metric)}
						fill="none"
						stroke={getMetricColor(metric, index)}
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				{/each}

				<!-- Data points -->
				{#each metrics as metric, index}
					{#each processedData as point, pointIndex}
						{@const x =
							padding +
							(pointIndex * (chartWidth - 2 * padding)) / (processedData.length - 1)}
						{@const maxValue = Math.max(...processedData.map((d) => d.values[metric]))}
						{@const minValue = Math.min(...processedData.map((d) => d.values[metric]))}
						{@const range = maxValue - minValue || 1}
						{@const y =
							chartHeight -
							padding -
							((point.values[metric] - minValue) / range) *
								(chartHeight - 2 * padding)}

						<circle
							cx={x}
							cy={y}
							r="3"
							fill={getMetricColor(metric, index)}
							stroke="white"
							stroke-width="2"
						>
							<title>{formatLabel(metric)}: {point.values[metric]}</title>
						</circle>
					{/each}
				{/each}
			</svg>
		</div>

		<!-- Legend -->
		<div class="flex flex-wrap gap-4">
			{#each metrics as metric, index}
				<div class="flex items-center space-x-2">
					<div
						class="h-3 w-3 rounded-full"
						style="background-color: {getMetricColor(metric, index)}"
					></div>
					<span class="text-sm text-gray-600">{formatLabel(metric)}</span>
				</div>
			{/each}
		</div>

		<!-- Latest values -->
		<div class="mt-4 grid grid-cols-2 gap-4">
			{#each metrics as metric}
				{@const latestValue = processedData[processedData.length - 1]?.values[metric]}
				<div class="text-center">
					<p class="text-sm text-gray-600">{formatLabel(metric)}</p>
					<p class="text-lg font-semibold text-gray-900">
						{latestValue?.toFixed(1) || 'N/A'}
					</p>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex h-48 items-center justify-center text-gray-500">
			<div class="text-center">
				<p>No trend data available</p>
				<p class="text-sm">Data will appear after running quality checks</p>
			</div>
		</div>
	{/if}
</div>
