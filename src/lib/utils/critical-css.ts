/**
 * Critical CSS処理ユーティリティ
 */

/**
 * Above-the-foldに必要な基本CSS
 */
export const criticalCSS = `
/* Reset and base styles */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  line-height: 1.15;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #1f2937;
  background-color: #ffffff;
}

/* Critical layout styles */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* Header styles */
header {
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
}

/* Navigation styles */
nav {
  display: flex;
  gap: 2rem;
}

nav a {
  text-decoration: none;
  color: #374151;
  font-weight: 500;
  transition: color 0.15s ease;
}

nav a:hover {
  color: #4f46e5;
}

/* Main content area */
main {
  min-height: calc(100vh - 200px);
  padding: 2rem 0;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  margin: 0 0 1rem 0;
  font-weight: 700;
  line-height: 1.25;
}

h1 {
  font-size: 2.5rem;
}

h2 {
  font-size: 2rem;
}

h3 {
  font-size: 1.5rem;
}

/* Links */
a {
  color: #4f46e5;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;
}

.btn-primary {
  background-color: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background-color: #4338ca;
}

/* Loading states */
.loading {
  opacity: 0.6;
  pointer-events: none;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  body {
    color: #f9fafb;
    background-color: #111827;
  }
  
  header {
    background-color: #111827;
    border-bottom-color: #374151;
  }
  
  nav a {
    color: #d1d5db;
  }
  
  nav a:hover {
    color: #818cf8;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .container {
    padding: 0 0.5rem;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  nav {
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }
}
`;

/**
 * Critical CSSをインライン化する
 */
export function inlineCriticalCSS(): string {
	return `<style>${criticalCSS}</style>`;
}

/**
 * 非クリティカルCSSを遅延読み込みする
 */
export function loadNonCriticalCSS(href: string = '/css/non-critical.css') {
	if (typeof document === 'undefined') return;

	// non-critical.cssが存在しない場合は何もしない
	if (href === '/css/non-critical.css') {
		return;
	}

	const link = document.createElement('link');
	link.rel = 'preload';
	link.as = 'style';
	link.href = href;
	link.onload = function () {
		(this as HTMLLinkElement).rel = 'stylesheet';
	};
	document.head.appendChild(link);
}

/**
 * CSS読み込みの優先度を制御
 */
export function optimizeCSSLoading() {
	if (typeof document === 'undefined') return;

	// 既存のCSSリンクを遅延読み込みに変更
	const styleSheets = document.querySelectorAll('link[rel="stylesheet"]');
	styleSheets.forEach((sheet) => {
		const link = sheet as HTMLLinkElement;
		if (!link.href.includes('critical')) {
			link.rel = 'preload';
			link.as = 'style';
			link.onload = function () {
				(this as HTMLLinkElement).rel = 'stylesheet';
			};
		}
	});
}
