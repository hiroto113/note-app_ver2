import { getMotionPreference } from './animations';

// Intersection Observer の設定
export interface IntersectionConfig {
	threshold: number;
	rootMargin: string;
	triggerOnce: boolean;
}

// デフォルト設定
export const DEFAULT_INTERSECTION_CONFIG: IntersectionConfig = {
	threshold: 0.1,
	rootMargin: '0px 0px -50px 0px',
	triggerOnce: true
};

// 要素が画面内に入ったかどうかを監視するアクション
export function inView(
	element: Element,
	{
		threshold = DEFAULT_INTERSECTION_CONFIG.threshold,
		rootMargin = DEFAULT_INTERSECTION_CONFIG.rootMargin,
		triggerOnce = DEFAULT_INTERSECTION_CONFIG.triggerOnce,
		onIntersect
	}: Partial<IntersectionConfig> & {
		onIntersect: (entry: IntersectionObserverEntry) => void;
	}
) {
	// prefers-reduced-motion が有効な場合は即座に実行
	const { reduceMotion } = getMotionPreference();
	if (reduceMotion) {
		// 少し遅延させて自然に見せる
		setTimeout(() => {
			onIntersect({
				isIntersecting: true,
				target: element
			} as IntersectionObserverEntry);
		}, 50);
		return { destroy: () => {} };
	}

	// Intersection Observer をブラウザが支援していない場合の fallback
	if (typeof window === 'undefined' || !window.IntersectionObserver) {
		onIntersect({
			isIntersecting: true,
			target: element
		} as IntersectionObserverEntry);
		return { destroy: () => {} };
	}

	let hasTriggered = false;

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && (!triggerOnce || !hasTriggered)) {
					hasTriggered = true;
					onIntersect(entry);
				}
			});
		},
		{
			threshold,
			rootMargin
		}
	);

	observer.observe(element);

	return {
		destroy() {
			observer.unobserve(element);
			observer.disconnect();
		}
	};
}

// 複数要素に段階的なアニメーションを適用するヘルパー
export function createStaggeredInView(
	elements: Element[],
	{
		baseDelay = 0,
		staggerMs = 100,
		onIntersect
	}: {
		baseDelay?: number;
		staggerMs?: number;
		onIntersect: (element: Element, index: number) => void;
	}
) {
	const { reduceMotion } = getMotionPreference();

	// アニメーションを無効にする場合
	if (reduceMotion) {
		elements.forEach((element, index) => {
			setTimeout(() => onIntersect(element, index), baseDelay + index * 10);
		});
		return { destroy: () => {} };
	}

	const observers: Array<{ destroy: () => void }> = [];

	elements.forEach((element, index) => {
		const delay = baseDelay + index * staggerMs;

		const observer = inView(element, {
			onIntersect: () => {
				setTimeout(() => onIntersect(element, index), delay);
			}
		});

		observers.push(observer);
	});

	return {
		destroy() {
			observers.forEach((observer) => observer.destroy());
		}
	};
}

// スクロール位置に基づくパララックス効果（軽量版）
export function createParallax(
	element: Element,
	{ speed = 0.5, direction = 'up' }: { speed?: number; direction?: 'up' | 'down' } = {}
) {
	const { reduceMotion } = getMotionPreference();

	// アニメーションを無効にする場合
	if (reduceMotion || typeof window === 'undefined') {
		return { destroy: () => {} };
	}

	let ticking = false;

	function updateTransform() {
		const rect = element.getBoundingClientRect();
		const windowHeight = window.innerHeight;
		const elementTop = rect.top;
		const elementHeight = rect.height;

		// 要素が画面内にある場合のみ計算
		if (elementTop < windowHeight && elementTop + elementHeight > 0) {
			const scrolled = windowHeight - elementTop;
			const rate = scrolled / (windowHeight + elementHeight);
			const displacement = (rate - 0.5) * speed * 100;

			const translateY = direction === 'up' ? -displacement : displacement;

			if (element instanceof HTMLElement) {
				element.style.transform = `translateY(${translateY}px)`;
			}
		}

		ticking = false;
	}

	function handleScroll() {
		if (!ticking) {
			requestAnimationFrame(updateTransform);
			ticking = true;
		}
	}

	// 初期実行
	updateTransform();

	// スクロールイベントリスナーを追加
	window.addEventListener('scroll', handleScroll, { passive: true });

	return {
		destroy() {
			window.removeEventListener('scroll', handleScroll);
			if (element instanceof HTMLElement) {
				element.style.transform = '';
			}
		}
	};
}
