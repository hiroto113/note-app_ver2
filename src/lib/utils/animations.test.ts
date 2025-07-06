import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	DEFAULT_ANIMATION,
	getMotionPreference,
	shouldAnimate,
	fadeInUp,
	fadeInDown,
	scaleIn,
	slideInLeft,
	slideInRight,
	getStaggerDelay
} from './animations';

describe('animations', () => {
	let mockElement: Element;

	beforeEach(() => {
		mockElement = document.createElement('div');
		vi.clearAllMocks();

		// Mock window.matchMedia
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			configurable: true,
			value: vi.fn().mockImplementation((query) => ({
				matches: false,
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn()
			}))
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('DEFAULT_ANIMATION', () => {
		it('should have default animation config', () => {
			expect(DEFAULT_ANIMATION).toEqual({
				duration: 300,
				delay: 0,
				easing: expect.any(Function),
				threshold: 0.1
			});
		});
	});

	describe('getMotionPreference', () => {
		it('should detect motion preference', () => {
			const preference = getMotionPreference();
			expect(preference).toEqual({ reduceMotion: false });
		});

		it('should detect reduced motion preference', () => {
			Object.defineProperty(window, 'matchMedia', {
				writable: true,
				configurable: true,
				value: vi.fn().mockImplementation((query) => ({
					matches: query === '(prefers-reduced-motion: reduce)',
					media: query,
					onchange: null,
					addListener: vi.fn(),
					removeListener: vi.fn(),
					addEventListener: vi.fn(),
					removeEventListener: vi.fn(),
					dispatchEvent: vi.fn()
				}))
			});

			const preference = getMotionPreference();
			expect(preference).toEqual({ reduceMotion: true });
		});
	});

	describe('shouldAnimate', () => {
		it('should return true when animations are enabled', () => {
			expect(shouldAnimate()).toBe(true);
		});

		it('should return false when reduced motion is preferred', () => {
			Object.defineProperty(window, 'matchMedia', {
				writable: true,
				configurable: true,
				value: vi.fn().mockImplementation((query) => ({
					matches: query === '(prefers-reduced-motion: reduce)',
					media: query,
					onchange: null,
					addListener: vi.fn(),
					removeListener: vi.fn(),
					addEventListener: vi.fn(),
					removeEventListener: vi.fn(),
					dispatchEvent: vi.fn()
				}))
			});

			expect(shouldAnimate()).toBe(false);
		});
	});

	describe('fadeInUp', () => {
		it('should create fade in up transition with default options', () => {
			const transition = fadeInUp(mockElement);

			expect(transition).toEqual({
				duration: 300,
				delay: 0,
				easing: expect.any(Function),
				css: expect.any(Function)
			});
		});

		it('should create fade in up transition with custom options', () => {
			const transition = fadeInUp(mockElement, { duration: 500, delay: 100, distance: 50 });

			expect(transition.duration).toBe(500);
			expect(transition.delay).toBe(100);
		});

		it('should return no animation when reduced motion is preferred', () => {
			Object.defineProperty(window, 'matchMedia', {
				writable: true,
				configurable: true,
				value: vi.fn().mockImplementation((query) => ({
					matches: query === '(prefers-reduced-motion: reduce)',
					media: query,
					onchange: null,
					addListener: vi.fn(),
					removeListener: vi.fn(),
					addEventListener: vi.fn(),
					removeEventListener: vi.fn(),
					dispatchEvent: vi.fn()
				}))
			});

			const transition = fadeInUp(mockElement);

			expect(transition).toEqual({
				duration: 0,
				delay: 0,
				css: expect.any(Function)
			});
		});
	});

	describe('fadeInDown', () => {
		it('should create fade in down transition', () => {
			const transition = fadeInDown(mockElement);

			expect(transition.duration).toBe(300);
			expect(transition.css).toBeDefined();
		});
	});

	describe('scaleIn', () => {
		it('should create scale in transition', () => {
			const transition = scaleIn(mockElement);

			expect(transition.duration).toBe(200);
			expect(transition.css).toBeDefined();
		});
	});

	describe('slideInLeft', () => {
		it('should create slide in left transition', () => {
			const transition = slideInLeft(mockElement);

			expect(transition.duration).toBe(300);
			expect(transition.css).toBeDefined();
		});
	});

	describe('slideInRight', () => {
		it('should create slide in right transition', () => {
			const transition = slideInRight(mockElement);

			expect(transition.duration).toBe(300);
			expect(transition.css).toBeDefined();
		});
	});

	describe('getStaggerDelay', () => {
		it('should calculate stagger delay correctly', () => {
			expect(getStaggerDelay(0)).toBe(0);
			expect(getStaggerDelay(1)).toBe(50);
			expect(getStaggerDelay(2)).toBe(100);
		});

		it('should handle custom base delay and stagger', () => {
			expect(getStaggerDelay(1, 100, 25)).toBe(125);
			expect(getStaggerDelay(2, 100, 25)).toBe(150);
		});
	});
});
