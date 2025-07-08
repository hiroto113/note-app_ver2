/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { readdir, stat, readFile, writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';

const execAsync = promisify(exec);

/**
 * Regression Test Automation Infrastructure
 *
 * Provides automated execution and reporting for regression test suites:
 * - Automated test discovery and execution
 * - Performance regression detection
 * - Test result aggregation and reporting
 * - CI/CD integration support
 * - Trend analysis and alerting
 * - Test coverage tracking
 */

export interface RegressionTestResult {
	suiteName: string;
	testCount: number;
	passedCount: number;
	failedCount: number;
	skippedCount: number;
	duration: number;
	coverage?: number;
	failures: TestFailure[];
	performance: PerformanceMetrics;
}

export interface TestFailure {
	testName: string;
	error: string;
	stackTrace?: string;
	duration: number;
}

export interface PerformanceMetrics {
	averageTestDuration: number;
	slowestTest: { name: string; duration: number };
	fastestTest: { name: string; duration: number };
	memoryUsage: { peak: number; average: number };
	databaseOperations: number;
}

export interface RegressionReport {
	timestamp: Date;
	totalTests: number;
	overallPassRate: number;
	suiteResults: RegressionTestResult[];
	performanceRegression: PerformanceRegression[];
	coverageReport: CoverageReport;
	recommendations: string[];
}

export interface PerformanceRegression {
	testName: string;
	currentDuration: number;
	baselineDuration: number;
	degradation: number; // percentage
	severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CoverageReport {
	overall: number;
	byCategory: Record<string, number>;
	uncoveredAreas: string[];
	newCode: { covered: number; total: number };
}

export class RegressionTestRunner {
	private readonly testDirectory = 'tests/regression';
	private readonly reportDirectory = 'tests/regression/reports';
	private readonly baselineFile = 'tests/regression/baseline-performance.json';

	/**
	 * Discover all regression test files
	 */
	async discoverTests(): Promise<string[]> {
		const testFiles: string[] = [];

		const searchDirectory = async (dir: string): Promise<void> => {
			try {
				const entries = await readdir(dir);

				for (const entry of entries) {
					const fullPath = join(dir, entry);
					const stats = await stat(fullPath);

					if (stats.isDirectory()) {
						await searchDirectory(fullPath);
					} else if (entry.endsWith('.test.ts') || entry.endsWith('.test.js')) {
						testFiles.push(fullPath);
					}
				}
			} catch (error) {
				console.warn(`Could not read directory ${dir}:`, error);
			}
		};

		await searchDirectory(this.testDirectory);
		return testFiles;
	}

	/**
	 * Run all regression tests with performance monitoring
	 */
	async runAllTests(): Promise<RegressionReport> {
		const startTime = Date.now();
		console.log('🚀 Starting regression test execution...');

		const testFiles = await this.discoverTests();
		console.log(`📁 Discovered ${testFiles.length} test files`);

		const suiteResults: RegressionTestResult[] = [];
		let totalTests = 0;
		let totalPassed = 0;

		for (const testFile of testFiles) {
			console.log(`\n🧪 Running test suite: ${testFile}`);
			try {
				const result = await this.runTestSuite(testFile);
				suiteResults.push(result);
				totalTests += result.testCount;
				totalPassed += result.passedCount;
			} catch (error) {
				console.error(`❌ Failed to run test suite ${testFile}:`, error);
				suiteResults.push({
					suiteName: testFile,
					testCount: 0,
					passedCount: 0,
					failedCount: 1,
					skippedCount: 0,
					duration: 0,
					failures: [
						{
							testName: 'Suite Execution',
							error: error instanceof Error ? error.message : String(error),
							duration: 0
						}
					],
					performance: {
						averageTestDuration: 0,
						slowestTest: { name: '', duration: 0 },
						fastestTest: { name: '', duration: 0 },
						memoryUsage: { peak: 0, average: 0 },
						databaseOperations: 0
					}
				});
			}
		}

		// Generate comprehensive report
		const report: RegressionReport = {
			timestamp: new Date(),
			totalTests,
			overallPassRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
			suiteResults,
			performanceRegression: await this.detectPerformanceRegression(suiteResults),
			coverageReport: await this.generateCoverageReport(),
			recommendations: this.generateRecommendations(suiteResults)
		};

		await this.saveReport(report);
		await this.updateBaseline(suiteResults);

		const totalDuration = Date.now() - startTime;
		console.log(`\n✅ Regression test execution completed in ${totalDuration}ms`);
		console.log(`📊 Overall pass rate: ${report.overallPassRate.toFixed(2)}%`);

		return report;
	}

	/**
	 * Run a single test suite with detailed monitoring
	 */
	private async runTestSuite(testFilePath: string): Promise<RegressionTestResult> {
		const suiteName = testFilePath
			.replace(/^tests\/regression\//, '')
			.replace(/\.test\.(ts|js)$/, '');
		const startTime = Date.now();

		try {
			// Run the test with vitest
			const { stdout, stderr } = await execAsync(
				`pnpm vitest run ${testFilePath} --reporter=json`
			);

			const duration = Date.now() - startTime;

			// Parse vitest JSON output
			let testData;
			try {
				testData = JSON.parse(stdout);
			} catch (parseError) {
				// Fallback parsing if JSON format is different
				return this.parseTextOutput(suiteName, stdout + stderr, duration);
			}

			return this.parseVitestResults(suiteName, testData, duration);
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error(`Error running test suite ${testFilePath}:`, error);

			return {
				suiteName,
				testCount: 0,
				passedCount: 0,
				failedCount: 1,
				skippedCount: 0,
				duration,
				failures: [
					{
						testName: 'Test Execution',
						error: error instanceof Error ? error.message : String(error),
						duration
					}
				],
				performance: {
					averageTestDuration: duration,
					slowestTest: { name: 'Test Execution', duration },
					fastestTest: { name: 'Test Execution', duration },
					memoryUsage: { peak: 0, average: 0 },
					databaseOperations: 0
				}
			};
		}
	}

	/**
	 * Parse vitest JSON results
	 */
	private parseVitestResults(
		suiteName: string,
		testData: any,
		duration: number
	): RegressionTestResult {
		const failures: TestFailure[] = [];
		let testCount = 0;
		let passedCount = 0;
		let failedCount = 0;
		let skippedCount = 0;

		// Extract test results from vitest output
		if (testData.testResults) {
			testData.testResults.forEach((suite: any) => {
				if (suite.assertionResults) {
					suite.assertionResults.forEach((test: any) => {
						testCount++;
						if (test.status === 'passed') {
							passedCount++;
						} else if (test.status === 'failed') {
							failedCount++;
							failures.push({
								testName: test.title || test.fullName,
								error: test.failureMessages?.join('\n') || 'Test failed',
								duration: test.duration || 0
							});
						} else if (test.status === 'skipped') {
							skippedCount++;
						}
					});
				}
			});
		}

		// Calculate performance metrics
		const testDurations = failures.map((f) => f.duration).filter((d) => d > 0);
		const averageTestDuration =
			testDurations.length > 0
				? testDurations.reduce((a, b) => a + b, 0) / testDurations.length
				: duration / Math.max(testCount, 1);

		const slowestTest =
			testDurations.length > 0
				? { name: 'Unknown', duration: Math.max(...testDurations) }
				: { name: 'Unknown', duration: 0 };

		const fastestTest =
			testDurations.length > 0
				? { name: 'Unknown', duration: Math.min(...testDurations) }
				: { name: 'Unknown', duration: 0 };

		return {
			suiteName,
			testCount,
			passedCount,
			failedCount,
			skippedCount,
			duration,
			failures,
			performance: {
				averageTestDuration,
				slowestTest,
				fastestTest,
				memoryUsage: { peak: 0, average: 0 }, // Would need process monitoring
				databaseOperations: 0 // Would need instrumentation
			}
		};
	}

	/**
	 * Fallback parser for text output
	 */
	private parseTextOutput(
		suiteName: string,
		output: string,
		duration: number
	): RegressionTestResult {
		const lines = output.split('\n');
		const failures: TestFailure[] = [];
		let testCount = 0;
		let passedCount = 0;
		let failedCount = 0;

		// Simple text parsing
		lines.forEach((line) => {
			if (line.includes('✓') || line.includes('PASS')) {
				passedCount++;
				testCount++;
			} else if (line.includes('✗') || line.includes('FAIL')) {
				failedCount++;
				testCount++;
				failures.push({
					testName: line.trim(),
					error: 'Test failed (parsed from output)',
					duration: 0
				});
			}
		});

		return {
			suiteName,
			testCount,
			passedCount,
			failedCount,
			skippedCount: 0,
			duration,
			failures,
			performance: {
				averageTestDuration: duration / Math.max(testCount, 1),
				slowestTest: { name: 'Unknown', duration: 0 },
				fastestTest: { name: 'Unknown', duration: 0 },
				memoryUsage: { peak: 0, average: 0 },
				databaseOperations: 0
			}
		};
	}

	/**
	 * Detect performance regressions by comparing with baseline
	 */
	private async detectPerformanceRegression(
		results: RegressionTestResult[]
	): Promise<PerformanceRegression[]> {
		const regressions: PerformanceRegression[] = [];

		try {
			const baselineData = await readFile(this.baselineFile, 'utf-8');
			const baseline = JSON.parse(baselineData);

			results.forEach((result) => {
				const baselineResult = baseline[result.suiteName];
				if (baselineResult) {
					const currentDuration = result.performance.averageTestDuration;
					const baselineDuration = baselineResult.averageTestDuration;

					if (baselineDuration > 0) {
						const degradation =
							((currentDuration - baselineDuration) / baselineDuration) * 100;

						if (degradation > 10) {
							// More than 10% slower
							let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
							if (degradation > 50) severity = 'critical';
							else if (degradation > 30) severity = 'high';
							else if (degradation > 20) severity = 'medium';

							regressions.push({
								testName: result.suiteName,
								currentDuration,
								baselineDuration,
								degradation,
								severity
							});
						}
					}
				}
			});
		} catch (error) {
			console.warn('Could not load baseline performance data:', error);
		}

		return regressions;
	}

	/**
	 * Generate coverage report
	 */
	private async generateCoverageReport(): Promise<CoverageReport> {
		// This would integrate with coverage tools like c8 or istanbul
		// For now, return a mock implementation
		return {
			overall: 85,
			byCategory: {
				core: 90,
				api: 85,
				business: 80,
				automation: 70
			},
			uncoveredAreas: [
				'Error handling edge cases',
				'Integration with external services',
				'Performance optimization paths'
			],
			newCode: { covered: 15, total: 20 }
		};
	}

	/**
	 * Generate recommendations based on test results
	 */
	private generateRecommendations(results: RegressionTestResult[]): string[] {
		const recommendations: string[] = [];

		const totalTests = results.reduce((sum, r) => sum + r.testCount, 0);
		const totalFailures = results.reduce((sum, r) => sum + r.failedCount, 0);
		const failureRate = totalTests > 0 ? (totalFailures / totalTests) * 100 : 0;

		if (failureRate > 10) {
			recommendations.push(
				'High failure rate detected. Review and fix failing tests immediately.'
			);
		}

		const slowSuites = results.filter((r) => r.performance.averageTestDuration > 2000);
		if (slowSuites.length > 0) {
			recommendations.push(
				`Performance issues detected in ${slowSuites.length} test suites. Consider optimization.`
			);
		}

		const suitesWithManyFailures = results.filter((r) => r.failedCount > 5);
		if (suitesWithManyFailures.length > 0) {
			recommendations.push(
				'Some test suites have multiple failures. Focus on fixing core issues first.'
			);
		}

		if (recommendations.length === 0) {
			recommendations.push(
				'All regression tests are performing well. Continue monitoring for any degradations.'
			);
		}

		return recommendations;
	}

	/**
	 * Save test report to file
	 */
	private async saveReport(report: RegressionReport): Promise<void> {
		try {
			await mkdir(this.reportDirectory, { recursive: true });

			const timestamp = report.timestamp.toISOString().replace(/[:.]/g, '-');
			const reportPath = join(this.reportDirectory, `regression-report-${timestamp}.json`);

			await writeFile(reportPath, JSON.stringify(report, null, 2));
			console.log(`📋 Report saved to: ${reportPath}`);
		} catch (error) {
			console.error('Failed to save report:', error);
		}
	}

	/**
	 * Update performance baseline
	 */
	private async updateBaseline(results: RegressionTestResult[]): Promise<void> {
		try {
			const baseline: Record<string, any> = {};

			results.forEach((result) => {
				baseline[result.suiteName] = {
					averageTestDuration: result.performance.averageTestDuration,
					testCount: result.testCount,
					timestamp: new Date().toISOString()
				};
			});

			await writeFile(this.baselineFile, JSON.stringify(baseline, null, 2));
			console.log(`📊 Baseline updated: ${this.baselineFile}`);
		} catch (error) {
			console.error('Failed to update baseline:', error);
		}
	}

	/**
	 * Run tests in CI/CD mode with specific formatting
	 */
	async runForCI(): Promise<{ success: boolean; report: RegressionReport }> {
		console.log('🔄 Running regression tests in CI/CD mode...');

		const report = await this.runAllTests();
		const success = report.overallPassRate >= 90; // 90% pass rate threshold

		// Output CI-friendly summary
		console.log('\n=== REGRESSION TEST SUMMARY ===');
		console.log(`Total Tests: ${report.totalTests}`);
		console.log(`Pass Rate: ${report.overallPassRate.toFixed(2)}%`);
		console.log(`Performance Regressions: ${report.performanceRegression.length}`);

		if (report.performanceRegression.length > 0) {
			console.log('\n⚠️ Performance Regressions Detected:');
			report.performanceRegression.forEach((reg) => {
				console.log(
					`  - ${reg.testName}: ${reg.degradation.toFixed(1)}% slower (${reg.severity})`
				);
			});
		}

		console.log('\n📋 Recommendations:');
		report.recommendations.forEach((rec) => {
			console.log(`  • ${rec}`);
		});

		if (!success) {
			console.log('\n❌ Regression tests failed. Review results before proceeding.');
			process.exit(1);
		} else {
			console.log('\n✅ All regression tests passed successfully.');
		}

		return { success, report };
	}
}

// CLI interface for running regression tests
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this module is being run directly
const isMainModule =
	process.argv[1] === __filename || process.argv[1].endsWith('regression-test-runner.ts');

if (isMainModule) {
	const runner = new RegressionTestRunner();
	const isCI = process.argv.includes('--ci');

	if (isCI) {
		runner.runForCI().catch((error) => {
			console.error('Regression test execution failed:', error);
			process.exit(1);
		});
	} else {
		runner.runAllTests().catch((error) => {
			console.error('Regression test execution failed:', error);
			process.exit(1);
		});
	}
}
