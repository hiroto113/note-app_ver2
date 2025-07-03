import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

// アニメーション設定の型定義
export interface AnimationConfig {
	duration: number;
	delay: number;
	easing: (t: number) => number;
	threshold: number;
}

// モーション設定の型定義
export interface MotionPreference {
	reduceMotion: boolean;
}

// デフォルトアニメーション設定
export const DEFAULT_ANIMATION: AnimationConfig = {
	duration: 300,
	delay: 0,
	easing: cubicOut,
	threshold: 0.1
};

// prefers-reduced-motion の状態を取得
export function getMotionPreference(): MotionPreference {
	if (typeof window === 'undefined') {
		return { reduceMotion: false };
	}

	const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
	return { reduceMotion: mediaQuery.matches };
}

// アニメーションを実行するかどうかを判定
export function shouldAnimate(): boolean {
	const { reduceMotion } = getMotionPreference();
	return !reduceMotion;
}

// フェードイン・アップ トランジション
export function fadeInUp(
	node: Element,
	{
		duration = 300,
		delay = 0,
		distance = 20
	}: { duration?: number; delay?: number; distance?: number } = {}
): TransitionConfig {
	if (!shouldAnimate()) {
		return {
			duration: 0,
			delay: 0,
			css: () => ''
		};
	}

	return {
		duration,
		delay,
		easing: cubicOut,
		css: (t: number) => `
			transform: translateY(${(1 - t) * distance}px);
			opacity: ${t};
		`
	};
}

// フェードイン・ダウン トランジション
export function fadeInDown(
	node: Element,
	{
		duration = 300,
		delay = 0,
		distance = 20
	}: { duration?: number; delay?: number; distance?: number } = {}
): TransitionConfig {
	if (!shouldAnimate()) {
		return {
			duration: 0,
			delay: 0,
			css: () => ''
		};
	}

	return {
		duration,
		delay,
		easing: cubicOut,
		css: (t: number) => `
			transform: translateY(${(1 - t) * -distance}px);
			opacity: ${t};
		`
	};
}

// スケール・フェードイン トランジション
export function scaleIn(
	node: Element,
	{
		duration = 200,
		delay = 0,
		start = 0.95
	}: { duration?: number; delay?: number; start?: number } = {}
): TransitionConfig {
	if (!shouldAnimate()) {
		return {
			duration: 0,
			delay: 0,
			css: () => ''
		};
	}

	return {
		duration,
		delay,
		easing: cubicOut,
		css: (t: number) => `
			transform: scale(${start + (1 - start) * t});
			opacity: ${t};
		`
	};
}

// スライドイン（左から）トランジション
export function slideInLeft(
	node: Element,
	{
		duration = 300,
		delay = 0,
		distance = 30
	}: { duration?: number; delay?: number; distance?: number } = {}
): TransitionConfig {
	if (!shouldAnimate()) {
		return {
			duration: 0,
			delay: 0,
			css: () => ''
		};
	}

	return {
		duration,
		delay,
		easing: cubicOut,
		css: (t: number) => `
			transform: translateX(${(1 - t) * -distance}px);
			opacity: ${t};
		`
	};
}

// スライドイン（右から）トランジション
export function slideInRight(
	node: Element,
	{
		duration = 300,
		delay = 0,
		distance = 30
	}: { duration?: number; delay?: number; distance?: number } = {}
): TransitionConfig {
	if (!shouldAnimate()) {
		return {
			duration: 0,
			delay: 0,
			css: () => ''
		};
	}

	return {
		duration,
		delay,
		easing: cubicOut,
		css: (t: number) => `
			transform: translateX(${(1 - t) * distance}px);
			opacity: ${t};
		`
	};
}

// 段階的な遅延を計算
export function getStaggerDelay(index: number, baseDelay = 0, staggerMs = 50): number {
	return baseDelay + index * staggerMs;
}
