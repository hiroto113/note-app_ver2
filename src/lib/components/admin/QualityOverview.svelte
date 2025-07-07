<script lang="ts">
	import type { QualityMetrics, QualityTrend } from '$lib/server/quality-metrics';

	export let data: {
		dashboard: {
			latest: QualityMetrics | null;
			trends: QualityTrend[];
			history: QualityMetrics[];
		};
		statistics: {
			averageLighthouseScore: number;
			testSuccessRate: number;
			averageLoadTime: number;
			trendsCount: {
				improving: number;
				declining: number;
				stable: number;
			};
		};
	};

	// Calculate overall health score
	function calculateHealthScore(): number {
		if (!data.dashboard.latest) return 0;

		const latest = data.dashboard.latest;
		let score = 0;
		let factors = 0;

		// Lighthouse scores (40% weight)
		const lighthouseScores = [
			latest.lighthousePerformance,
			latest.lighthouseAccessibility,
			latest.lighthouseBestPractices,
			latest.lighthouseSeo
		].filter(Boolean) as number[];

		if (lighthouseScores.length > 0) {
			const avgLighthouse =
				lighthouseScores.reduce((sum, score) => sum + score, 0) / lighthouseScores.length;
			score += avgLighthouse * 0.4;
			factors += 0.4;
		}

		// Test coverage (30% weight)
		if (latest.testUnitCoverage) {
			score += (latest.testUnitCoverage / 100) * 0.3;
			factors += 0.3;
		}

		// Performance (30% weight)
		if (latest.loadTime) {
			// Convert load time to score (lower is better)
			const loadScore = Math.max(0, 100 - latest.loadTime / 50); // 5000ms = 0 score
			score += loadScore * 0.3;
			factors += 0.3;
		}

		return factors > 0 ? Math.round(score / factors) : 0;
	}

	function getHealthColor(score: number): string {
		if (score >= 90) return 'text-green-600';
		if (score >= 70) return 'text-yellow-600';
		return 'text-red-600';
	}

	function getHealthStatus(score: number): string {
		if (score >= 90) return 'Excellent';
		if (score >= 70) return 'Good';
		if (score >= 50) return 'Fair';
		return 'Needs Improvement';
	}

	$: healthScore = calculateHealthScore();
</script>

<div class="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-semibold text-gray-900">Overall Health Score</h3>
			<p class="text-sm text-gray-600">Based on performance, coverage, and quality metrics</p>
		</div>
		<div class="text-right">
			<div class="text-4xl font-bold {getHealthColor(healthScore)}">
				{healthScore}
			</div>
			<div class="text-sm font-medium {getHealthColor(healthScore)}">
				{getHealthStatus(healthScore)}
			</div>
		</div>
	</div>

	<!-- Health Score Breakdown -->
	{#if data.dashboard.latest}
		<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
			<!-- Lighthouse Health -->
			<div class="rounded-lg bg-white p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">Lighthouse</p>
						<p class="text-lg font-semibold text-gray-900">
							{data.statistics.averageLighthouseScore}/100
						</p>
					</div>
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
						<svg
							class="h-4 w-4 text-blue-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>
				</div>
			</div>

			<!-- Test Coverage Health -->
			<div class="rounded-lg bg-white p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">Test Coverage</p>
						<p class="text-lg font-semibold text-gray-900">
							{data.statistics.testSuccessRate.toFixed(1)}%
						</p>
					</div>
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
						<svg
							class="h-4 w-4 text-green-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
				</div>
			</div>

			<!-- Performance Health -->
			<div class="rounded-lg bg-white p-4 shadow-sm">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">Avg Load Time</p>
						<p class="text-lg font-semibold text-gray-900">
							{data.statistics.averageLoadTime}ms
						</p>
					</div>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100"
					>
						<svg
							class="h-4 w-4 text-purple-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Recent Activity -->
	{#if data.dashboard.history.length > 0}
		<div class="mt-6">
			<h4 class="mb-3 text-sm font-medium text-gray-700">Recent Activity</h4>
			<div class="space-y-2">
				{#each data.dashboard.history.slice(0, 3) as metric}
					<div class="flex items-center justify-between rounded-lg bg-white p-3 text-sm">
						<div class="flex items-center space-x-3">
							<div class="h-2 w-2 rounded-full bg-blue-500"></div>
							<span class="text-gray-600">
								Branch: {metric.branch} | Commit: {metric.commitHash.substring(
									0,
									7
								)}
							</span>
						</div>
						<span class="text-gray-500">
							{new Date(metric.timestamp).toLocaleDateString()}
						</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
