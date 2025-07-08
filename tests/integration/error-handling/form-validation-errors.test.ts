import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDb } from '../setup';
import { testIsolation } from '../utils/test-isolation';
import { validatePost, validateCategory, createValidationErrorResponse } from '$lib/server/validation';

/**
 * Form Validation Error Tests
 * 
 * Tests form validation error scenarios including:
 * - Post creation and update validation
 * - Category validation errors
 * - Input validation and sanitization
 * - Error response format consistency
 */
describe('Form Validation Error Tests', () => {
	let testUserId: string;

	beforeEach(async () => {
		testUserId = await testIsolation.createTestUser();
	});

	afterEach(async () => {
		// Cleanup handled by test isolation
	});

	describe('Post Validation Errors', () => {
		it('should validate required post fields', async () => {
			const invalidPostData = [
				{
					data: {},
					expectedFields: ['title', 'content']
				},
				{
					data: { title: '' },
					expectedFields: ['title', 'content']
				},
				{
					data: { content: '' },
					expectedFields: ['title', 'content']
				},
				{
					data: { title: 'Valid Title' },
					expectedFields: ['content']
				},
				{
					data: { content: 'Valid content' },
					expectedFields: ['title']
				}
			];

			for (const { data, expectedFields } of invalidPostData) {
				const validation = validatePost(data);
				
				expect(validation.isValid).toBe(false);
				
				for (const field of expectedFields) {
					const hasFieldError = validation.errors.some(error => 
						error.field === field
					);
					expect(hasFieldError).toBe(true);
				}
			}
		});

		it('should validate post field lengths', async () => {
			const lengthTestCases = [
				{
					data: {
						title: 'a'.repeat(256), // Too long
						content: 'Valid content here'
					},
					expectedField: 'title'
				},
				{
					data: {
						title: 'Valid Title',
						content: 'Valid content',
						excerpt: 'a'.repeat(501) // Too long
					},
					expectedField: 'excerpt'
				}
			];

			for (const { data, expectedField } of lengthTestCases) {
				const validation = validatePost(data);
				
				expect(validation.isValid).toBe(false);
				
				const hasExpectedError = validation.errors.some(error => 
					error.field === expectedField && error.message.includes('characters')
				);
				expect(hasExpectedError).toBe(true);
			}
		});

		it('should validate post status values', async () => {
			// Test invalid status values
			const invalidStatuses = [
				'invalid',
				'PUBLISHED', // Wrong case
				'draft-saved', // Invalid format
				'public',
				123 // Wrong type
			];

			for (const status of invalidStatuses) {
				const postData = {
					title: 'Valid Title',
					content: 'Valid content',
					status: status as any
				};

				const validation = validatePost(postData);
				
				expect(validation.isValid).toBe(false);
				
				const hasStatusError = validation.errors.some(error => 
					error.field === 'status'
				);
				expect(hasStatusError).toBe(true);
			}

			// Test valid status values
			const validStatuses = ['draft', 'published'];
			
			for (const status of validStatuses) {
				const postData = {
					title: 'Valid Title',
					content: 'Valid content',
					status
				};

				const validation = validatePost(postData);
				
				// Should not have status-related errors
				const hasStatusError = validation.errors.some(error => 
					error.field === 'status'
				);
				expect(hasStatusError).toBe(false);
			}
		});

		it('should validate post category associations', async () => {
			// Test invalid category IDs - only testing scenarios that actual validation handles
			const invalidCategoryData = [
				{
					data: {
						title: 'Valid Title',
						content: 'Valid content',
						categoryIds: [-1] // Negative ID
					},
					expectedField: 'categoryIds'
				},
				{
					data: {
						title: 'Valid Title',
						content: 'Valid content',
						categoryIds: [0] // Zero ID
					},
					expectedField: 'categoryIds'
				},
				{
					data: {
						title: 'Valid Title',
						content: 'Valid content',
						categoryIds: 'invalid' // Not an array
					},
					expectedField: 'categoryIds'
				}
			];

			for (const { data, expectedField } of invalidCategoryData) {
				const validation = validatePost(data as any);
				
				expect(validation.isValid).toBe(false);
				
				const hasExpectedError = validation.errors.some(error => 
					error.field === expectedField
				);
				expect(hasExpectedError).toBe(true);
			}

			// Test valid category IDs
			const validData = {
				title: 'Valid Title',
				content: 'Valid content',
				categoryIds: [1, 2, 3] // Valid positive integers
			};

			const validation = validatePost(validData);
			const hasCategoryError = validation.errors.some(error => 
				error.field === 'categoryIds'
			);
			expect(hasCategoryError).toBe(false);
		});

		it('should accept valid post data', async () => {
			const validPostData = {
				title: 'Valid Post Title',
				content: 'This is valid post content that meets all requirements.',
				excerpt: 'Valid excerpt',
				status: 'draft',
				categoryIds: [1, 2, 3]
			};

			const validation = validatePost(validPostData);
			
			expect(validation.isValid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});
	});

	describe('Category Validation Errors', () => {
		it('should validate required category fields', async () => {
			const invalidCategoryData = [
				{
					data: {},
					expectedFields: ['name']
				},
				{
					data: { name: '' },
					expectedFields: ['name']
				},
				{
					data: { name: '   ' }, // Whitespace only
					expectedFields: ['name']
				}
			];

			for (const { data, expectedFields } of invalidCategoryData) {
				const validation = validateCategory(data);
				
				expect(validation.isValid).toBe(false);
				
				for (const field of expectedFields) {
					const hasFieldError = validation.errors.some(error => 
						error.field === field
					);
					expect(hasFieldError).toBe(true);
				}
			}
		});

		it('should validate category name length', async () => {
			const lengthTests = [
				{
					name: 'a'.repeat(101), // Too long
					expectedError: true
				},
				{
					name: 'Valid Category Name', // Valid length
					expectedError: false
				}
			];

			for (const { name, expectedError } of lengthTests) {
				const categoryData = { name };
				const validation = validateCategory(categoryData);
				
				if (expectedError) {
					expect(validation.isValid).toBe(false);
					expect(validation.errors.some(error => 
						error.field === 'name' && error.message.includes('100 characters')
					)).toBe(true);
				} else {
					const hasNameError = validation.errors.some(error => 
						error.field === 'name'
					);
					expect(hasNameError).toBe(false);
				}
			}
		});

		it('should validate category description length', async () => {
			const descriptionTests = [
				{
					data: {
						name: 'Valid Category',
						description: 'a'.repeat(501) // Too long
					},
					expectedField: 'description'
				}
			];

			for (const { data, expectedField } of descriptionTests) {
				const validation = validateCategory(data);
				
				expect(validation.isValid).toBe(false);
				
				const hasExpectedError = validation.errors.some(error => 
					error.field === expectedField && error.message.includes('500 characters')
				);
				expect(hasExpectedError).toBe(true);
			}

			// Test valid description
			const validData = {
				name: 'Valid Category',
				description: 'Valid description within limits'
			};
			
			const validation = validateCategory(validData);
			
			const hasDescriptionError = validation.errors.some(error => 
				error.field === 'description'
			);
			expect(hasDescriptionError).toBe(false);
		});

		it('should validate category ID for updates', async () => {
			const idTests = [
				{
					data: { name: 'Valid Name', id: -1 },
					expectedError: true
				},
				{
					data: { name: 'Valid Name', id: 0 },
					expectedError: true
				},
				{
					data: { name: 'Valid Name', id: 1.5 },
					expectedError: true
				},
				{
					data: { name: 'Valid Name', id: 1 },
					expectedError: false
				}
			];

			for (const { data, expectedError } of idTests) {
				const validation = validateCategory(data);
				
				const hasIdError = validation.errors.some(error => 
					error.field === 'id'
				);
				expect(hasIdError).toBe(expectedError);
			}
		});

		it('should accept valid category data', async () => {
			const validCategoryData = [
				{
					name: 'Technology',
					description: 'Technology related posts'
				},
				{
					name: 'Travel',
					description: 'Travel experiences and tips'
				},
				{
					name: 'Food'
					// description is optional
				}
			];

			for (const categoryData of validCategoryData) {
				const validation = validateCategory(categoryData);
				
				expect(validation.isValid).toBe(true);
				expect(validation.errors).toHaveLength(0);
			}
		});
	});

	describe('Input Sanitization and Edge Cases', () => {
		it('should handle malformed input data gracefully', async () => {
			const malformedInputs = [
				null,
				undefined,
				'not an object',
				123,
				[]
			];

			for (const input of malformedInputs) {
				try {
					const validation = validatePost(input as any);
					
					// Should handle gracefully without crashing
					expect(validation.isValid).toBe(false);
					expect(Array.isArray(validation.errors)).toBe(true);
				} catch (error) {
					// If it throws, should be a proper error message
					expect(error as Error).toBeInstanceOf(Error);
					expect((error as Error).message).toBeDefined();
				}
			}
		});

		it('should handle extremely large input sizes', async () => {
			const extremelyLargeData = {
				title: 'a'.repeat(10000),
				content: 'b'.repeat(100000) // Large content
			};

			const validation = validatePost(extremelyLargeData);
			
			// Should handle without crashing and reject appropriately
			expect(validation.isValid).toBe(false);
			
			const hasSizeError = validation.errors.some(error => 
				error.message.includes('characters') || 
				error.message.includes('length')
			);
			expect(hasSizeError).toBe(true);
		});

		it('should handle concurrent validation requests', async () => {
			// Test concurrent validation handling
			const concurrentValidations = Array.from({ length: 10 }, (_, i) => 
				validatePost({
					title: `Concurrent Title ${i}`,
					content: `Concurrent content ${i}`,
					status: i % 2 === 0 ? 'draft' : 'published'
				})
			);

			const results = concurrentValidations;
			
			// All validations should complete successfully
			results.forEach((result, index) => {
				expect(result.isValid).toBe(true);
				expect(Array.isArray(result.errors)).toBe(true);
			});
		});
	});

	describe('Validation Error Response Format', () => {
		it('should create consistent validation error responses', async () => {
			const invalidData = {
				title: '', // Empty title
				content: '' // Empty content
			};

			const validation = validatePost(invalidData);
			expect(validation.isValid).toBe(false);

			const errorResponse = createValidationErrorResponse(validation.errors);
			const responseData = await errorResponse.json();

			// Check response format
			expect(errorResponse.status).toBe(400);
			expect(responseData).toHaveProperty('error');
			expect(responseData).toHaveProperty('details');
			expect(responseData.error).toBe('Validation failed');
			expect(Array.isArray(responseData.details)).toBe(true);
			expect(responseData.details.length).toBeGreaterThan(0);

			// Check individual error format
			responseData.details.forEach((error: any) => {
				expect(error as Error).toHaveProperty('field');
				expect(error as Error).toHaveProperty('message');
				expect(typeof error.field).toBe('string');
				expect(typeof error.message).toBe('string');
			});
		});

		it('should handle validation errors with proper HTTP status codes', async () => {
			const errorScenarios = [
				{
					data: { title: '', content: '' },
					expectedStatus: 400,
					description: 'Missing required fields'
				},
				{
					data: {
						title: 'a'.repeat(300),
						content: 'Valid content'
					},
					expectedStatus: 400,
					description: 'Field too long'
				}
			];

			for (const { data, expectedStatus } of errorScenarios) {
				const validation = validatePost(data);
				
				if (!validation.isValid) {
					const errorResponse = createValidationErrorResponse(validation.errors);
					expect(errorResponse.status).toBe(expectedStatus);
				}
			}
		});

		it('should include helpful error messages for debugging', async () => {
			const testCases = [
				{
					data: { title: '' },
					expectedMessageParts: ['title', 'required']
				},
				{
					data: { title: 'Valid', content: '' },
					expectedMessageParts: ['content', 'required']
				},
				{
					data: { title: 'Valid', content: 'Valid', status: 'invalid' },
					expectedMessageParts: ['status']
				}
			];

			for (const { data, expectedMessageParts } of testCases) {
				const validation = validatePost(data);
				
				if (!validation.isValid) {
					const allErrorMessages = validation.errors
						.map(e => e.message.toLowerCase())
						.join(' ');
					
					for (const part of expectedMessageParts) {
						expect(allErrorMessages).toContain(part.toLowerCase());
					}
				}
			}
		});

		it('should provide field-specific error information', async () => {
			const validation = validatePost({
				title: '', // Empty title
				content: '', // Empty content
				excerpt: 'a'.repeat(600), // Too long excerpt
				status: 'invalid' // Invalid status
			});

			expect(validation.isValid).toBe(false);

			// Should have errors for multiple fields
			const errorFields = validation.errors.map(e => e.field);
			expect(errorFields).toContain('title');
			expect(errorFields).toContain('content');
			expect(errorFields).toContain('excerpt');
			expect(errorFields).toContain('status');

			// Each error should be descriptive
			validation.errors.forEach(error => {
				expect(error.message.length).toBeGreaterThan(10);
				expect(error.message.toLowerCase()).toContain(error.field.toLowerCase());
			});
		});
	});
});