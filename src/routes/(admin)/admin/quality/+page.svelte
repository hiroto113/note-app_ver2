<script lang="ts">
	import { onMount } from 'svelte';
	import MetricCard from '$lib/components/admin/MetricCard.svelte';
	import TrendChart from '$lib/components/admin/TrendChart.svelte';
	import QualityOverview from '$lib/components/admin/QualityOverview.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let refreshing = false;

	async function refreshData() {
		refreshing = true;
		try {
			// Reload page data
			window.location.reload();
		} catch (error) {
			console.error('Failed to refresh data:', error);
		} finally {
			refreshing = false;
		}
	}
</script>

<svelte:head>
	<title>Quality Dashboard - Admin</title>
	<meta name="description" content="Quality metrics and performance dashboard" />
</svelte:head>

<div class="container mx-auto px-4 py-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Quality Dashboard</h1>
			<p class="mt-2 text-gray-600">Monitor code quality, performance, and test metrics</p>
		</div>
		<button
			on:click={refreshData}
			disabled={refreshing}
			class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
		>
			{refreshing ? 'Refreshing...' : 'Refresh Data'}
		</button>
	</div>

	<!-- Quality Overview -->
	<div class="mb-8">
		<QualityOverview {data} />
	</div>

	<!-- Key Metrics Grid -->
	<div class="mb-8">
		<h2 class="mb-4 text-xl font-semibold text-gray-900">Key Metrics</h2>
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{#if data.dashboard.latest}
				<!-- Lighthouse Performance -->
				<MetricCard
					title="Lighthouse Performance"
					value={data.dashboard.latest.lighthousePerformance}
					unit="/100"
					trend={data.dashboard.trends.find(t => t.metric === 'Lighthouse Performance')}
					type="performance"
				/>

				<!-- Test Coverage -->
				<MetricCard
					title="Test Coverage"
					value={data.dashboard.latest.testUnitCoverage}
					unit="%"
					trend={data.dashboard.trends.find(t => t.metric === 'Test Coverage')}
					type="coverage"
				/>

				<!-- Bundle Size -->
				<MetricCard
					title="Bundle Size"
					value={data.dashboard.latest.bundleSize}
					unit="KB"
					trend={data.dashboard.trends.find(t => t.metric === 'Bundle Size')}
					type="size"
				/>

				<!-- Load Time -->
				<MetricCard
					title="Load Time"
					value={data.dashboard.latest.loadTime}
					unit="ms"
					trend={data.dashboard.trends.find(t => t.metric === 'Load Time')}
					type="time"
				/>
			{:else}
				<div class="col-span-full">
					<div class="rounded-lg bg-gray-50 p-8 text-center">
						<p class="text-gray-600">No quality metrics available yet.</p>
						<p class="mt-2 text-sm text-gray-500">Metrics will appear after running CI/CD pipeline.</p>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Trend Charts -->
	{#if data.dashboard.history.length > 0}
		<div class="mb-8">
			<h2 class="mb-4 text-xl font-semibold text-gray-900">Trend Analysis</h2>
			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<!-- Performance Trends -->
				<TrendChart
					title="Performance Trends"
					data={data.dashboard.history}
					metrics={['lighthousePerformance', 'loadTime']}
					type="performance"
				/>

				<!-- Test Trends -->
				<TrendChart
					title="Test Coverage Trends"
					data={data.dashboard.history}
					metrics={['testUnitCoverage', 'testIntegrationCoverage']}
					type="coverage"
				/>
			</div>
		</div>
	{/if}

	<!-- Statistics Summary -->
	<div class="mb-8">
		<h2 class="mb-4 text-xl font-semibold text-gray-900">Statistics Summary</h2>
		<div class="rounded-lg bg-white p-6 shadow-sm">
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<div class="text-center">
					<p class="text-2xl font-bold text-gray-900">{data.statistics.averageLighthouseScore}</p>
					<p class="text-sm text-gray-600">Avg Lighthouse Score</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-bold text-gray-900">{data.statistics.testSuccessRate.toFixed(1)}%</p>
					<p class="text-sm text-gray-600">Test Success Rate</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-bold text-gray-900">{data.statistics.averageLoadTime}ms</p>
					<p class="text-sm text-gray-600">Avg Load Time</p>
				</div>
				<div class="text-center">
					<div class="flex justify-center space-x-2">
						<span class="text-green-600">↑{data.statistics.trendsCount.improving}</span>
						<span class="text-red-600">↓{data.statistics.trendsCount.declining}</span>
						<span class="text-gray-600">→{data.statistics.trendsCount.stable}</span>
					</div>
					<p class="text-sm text-gray-600">Trends</p>
				</div>
			</div>
		</div>
	</div>
</div>
