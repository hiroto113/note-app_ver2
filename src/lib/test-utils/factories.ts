import { Factory } from 'fishery';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import type {
	NewUser,
	NewPost,
	NewCategory,
	NewSession,
	NewMedia,
	NewQualityMetrics
} from '../server/db/schema';

/**
 * TypeScript-first Test Data Factories using Fishery
 * 2025 Best Practice: Type-safe, composable, realistic test data
 */

// User Factory
export const userFactory = Factory.define<NewUser>(({ sequence, params }) => ({
	id: params.id || randomUUID(),
	username: params.username || `user${sequence}`,
	hashedPassword: params.hashedPassword || '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // 'password'
	createdAt: params.createdAt || new Date(),
	updatedAt: params.updatedAt || new Date()
}));

// Admin User Factory
export const adminUserFactory = userFactory.params({
	username: 'admin',
	hashedPassword: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // 'password'
});

// Category Factory
export const categoryFactory = Factory.define<NewCategory>(({ sequence, params }) => {
	const name = params.name || `Category ${sequence}`;
	const slug = params.slug || name.toLowerCase().replace(/\s+/g, '-');
	
	return {
		name,
		slug,
		description: params.description || `Description for ${name}`,
		createdAt: params.createdAt || new Date(),
		updatedAt: params.updatedAt || new Date()
	};
});

// Predefined Category Factories
export const techCategoryFactory = categoryFactory.params({
	name: 'Technology',
	slug: 'technology',
	description: 'Posts about technology and programming'
});

export const aiCategoryFactory = categoryFactory.params({
	name: 'AI & Machine Learning',
	slug: 'ai-ml',
	description: 'Posts about AI and Machine Learning'
});

// Post Factory
export const postFactory = Factory.define<NewPost>(({ sequence, params }) => {
	const title = params.title || `Post Title ${sequence}`;
	const slug = params.slug || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
	
	return {
		title,
		slug,
		content: params.content || `# ${title}\n\nThis is the content for ${title}.\n\n## Section\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.`,
		excerpt: params.excerpt || `This is the excerpt for ${title}.`,
		status: (params.status as 'draft' | 'published') || 'draft',
		publishedAt: params.publishedAt || null,
		createdAt: params.createdAt || new Date(),
		updatedAt: params.updatedAt || new Date(),
		userId: params.userId || 'default-user-id'
	};
});

// Published Post Factory
export const publishedPostFactory = postFactory.params({
	status: 'published',
	publishedAt: new Date()
});

// Draft Post Factory
export const draftPostFactory = postFactory.params({
	status: 'draft',
	publishedAt: null
});

// Session Factory
export const sessionFactory = Factory.define<NewSession>(({ params }) => ({
	id: params.id || randomUUID(),
	userId: params.userId || 'default-user-id',
	expiresAt: params.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
	createdAt: params.createdAt || new Date()
}));

// Media Factory
export const mediaFactory = Factory.define<NewMedia>(({ sequence, params }) => {
	const filename = params.filename || `image-${sequence}.jpg`;
	const originalName = params.originalName || `Original Image ${sequence}.jpg`;
	
	return {
		filename,
		originalName,
		mimeType: params.mimeType || 'image/jpeg',
		size: params.size || Math.floor(Math.random() * 1000000) + 100000, // 100KB - 1MB
		url: params.url || `/uploads/${filename}`,
		uploadedBy: params.uploadedBy || 'default-user-id',
		uploadedAt: params.uploadedAt || new Date()
	};
});

// Quality Metrics Factory
export const qualityMetricsFactory = Factory.define<NewQualityMetrics>(({ sequence, params }) => ({
	id: params.id || randomUUID(),
	timestamp: params.timestamp || new Date(),
	commitHash: params.commitHash || `abc123${sequence}`,
	branch: params.branch || 'main',
	
	// Lighthouse scores (0-100)
	lighthousePerformance: params.lighthousePerformance ?? Math.floor(Math.random() * 20) + 80, // 80-100
	lighthouseAccessibility: params.lighthouseAccessibility ?? Math.floor(Math.random() * 20) + 80,
	lighthouseBestPractices: params.lighthouseBestPractices ?? Math.floor(Math.random() * 20) + 80,
	lighthouseSeo: params.lighthouseSeo ?? Math.floor(Math.random() * 20) + 80,
	lighthousePwa: params.lighthousePwa ?? Math.floor(Math.random() * 20) + 60,
	
	// Core Web Vitals
	lcp: params.lcp ?? Math.floor(Math.random() * 1000) + 1000, // 1-2s
	fid: params.fid ?? Math.floor(Math.random() * 50) + 10, // 10-60ms
	cls: params.cls ?? Math.floor(Math.random() * 100) + 10, // 0.01-0.11 (x1000)
	
	// Test results
	testUnitTotal: params.testUnitTotal ?? Math.floor(Math.random() * 50) + 50,
	testUnitPassed: params.testUnitPassed ?? null,
	testUnitFailed: params.testUnitFailed ?? null,
	testUnitCoverage: params.testUnitCoverage ?? Math.floor(Math.random() * 20) + 70, // 70-90%
	testIntegrationTotal: params.testIntegrationTotal ?? Math.floor(Math.random() * 20) + 10,
	testIntegrationPassed: params.testIntegrationPassed ?? null,
	testIntegrationFailed: params.testIntegrationFailed ?? null,
	testIntegrationCoverage: params.testIntegrationCoverage ?? Math.floor(Math.random() * 20) + 60,
	testE2eTotal: params.testE2eTotal ?? Math.floor(Math.random() * 10) + 5,
	testE2ePassed: params.testE2ePassed ?? null,
	testE2eFailed: params.testE2eFailed ?? null,
	testE2eCoverage: params.testE2eCoverage ?? Math.floor(Math.random() * 20) + 50,
	
	// Performance metrics
	bundleSize: params.bundleSize ?? Math.floor(Math.random() * 200000) + 300000, // 300-500KB
	loadTime: params.loadTime ?? Math.floor(Math.random() * 1000) + 500, // 0.5-1.5s
	ttfb: params.ttfb ?? Math.floor(Math.random() * 200) + 100, // 100-300ms
	
	// Accessibility
	wcagScore: params.wcagScore ?? Math.floor(Math.random() * 20) + 80,
	axeViolations: params.axeViolations ?? Math.floor(Math.random() * 5),
	
	createdAt: params.createdAt || new Date()
}));

// High Quality Metrics Factory
export const highQualityMetricsFactory = qualityMetricsFactory.params({
	lighthousePerformance: 95,
	lighthouseAccessibility: 98,
	lighthouseBestPractices: 92,
	lighthouseSeo: 100,
	testUnitCoverage: 95,
	testIntegrationCoverage: 90,
	bundleSize: 250000, // 250KB
	loadTime: 800, // 0.8s
	axeViolations: 0
});

// Poor Quality Metrics Factory
export const poorQualityMetricsFactory = qualityMetricsFactory.params({
	lighthousePerformance: 65,
	lighthouseAccessibility: 70,
	lighthouseBestPractices: 60,
	lighthouseSeo: 75,
	testUnitCoverage: 45,
	testIntegrationCoverage: 30,
	bundleSize: 800000, // 800KB
	loadTime: 3000, // 3s
	axeViolations: 8
});

/**
 * Utility Functions for Complex Test Scenarios
 */

// Note: createPostWithCategories is implemented in TestFixtures class

// Generate post with categories data (no DB interaction)
export function createPostWithCategoriesData(
	postData: Partial<NewPost> = {},
	categoriesData: Partial<NewCategory>[] = []
) {
	const post = postFactory.build(postData);
	const categories = categoriesData.map(catData => categoryFactory.build(catData));
	
	return { post, categories };
}

// Generate realistic blog content
export const blogPostContentTemplates = {
	technology: {
		title: 'Understanding Modern Web Development',
		content: `# Understanding Modern Web Development

Modern web development has evolved significantly over the past decade. In this post, we'll explore the current landscape and best practices.

## Frontend Frameworks

Today's frontend development is dominated by component-based frameworks:

- **React**: Declarative UI library
- **Vue**: Progressive framework
- **Svelte**: Compile-time optimization

## Backend Technologies

Backend development has also seen major innovations:

### Node.js Ecosystem
- Express.js for traditional REST APIs
- Fastify for high performance
- Next.js for full-stack applications

### Database Solutions
- PostgreSQL for relational data
- MongoDB for document storage
- Redis for caching

## Best Practices

1. **Type Safety**: Use TypeScript
2. **Testing**: Implement comprehensive test coverage
3. **Performance**: Optimize for Core Web Vitals
4. **Security**: Follow OWASP guidelines

The future of web development continues to evolve with new tools and methodologies emerging regularly.`,
		excerpt: 'Explore the current landscape of modern web development, from frontend frameworks to backend technologies and best practices.'
	},
	aiMl: {
		title: 'Introduction to Machine Learning',
		content: `# Introduction to Machine Learning

Machine Learning (ML) is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.

## Types of Machine Learning

### Supervised Learning
In supervised learning, algorithms learn from labeled training data:
- **Classification**: Predicting categories
- **Regression**: Predicting continuous values

### Unsupervised Learning
Unsupervised learning finds patterns in data without labels:
- **Clustering**: Grouping similar data points
- **Dimensionality Reduction**: Simplifying data

### Reinforcement Learning
Learning through interaction with an environment:
- **Q-Learning**: Value-based methods
- **Policy Gradient**: Policy-based methods

## Popular Algorithms

1. **Linear Regression**: Simple and interpretable
2. **Random Forest**: Ensemble method
3. **Neural Networks**: Deep learning foundation
4. **Support Vector Machines**: Effective for classification

## Applications

Machine learning is transforming various industries:
- Healthcare: Diagnostic assistance
- Finance: Fraud detection
- Transportation: Autonomous vehicles
- Entertainment: Recommendation systems

The field continues to advance rapidly with new breakthroughs in deep learning and AI research.`,
		excerpt: 'Learn the fundamentals of machine learning, including types, algorithms, and real-world applications across various industries.'
	}
};

// Helper to create realistic posts
export function createTechPostData(overrides: Partial<NewPost> = {}) {
	return postFactory.build({
		...blogPostContentTemplates.technology,
		status: 'published',
		publishedAt: new Date(),
		...overrides
	});
}

export function createAiMlPostData(overrides: Partial<NewPost> = {}) {
	return postFactory.build({
		...blogPostContentTemplates.aiMl,
		status: 'published',
		publishedAt: new Date(),
		...overrides
	});
}

/**
 * Utility for creating hashed passwords (for user factories)
 */
export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 10);
}

/**
 * Export all factories as a namespace for easier imports
 */
export const factories = {
	user: userFactory,
	adminUser: adminUserFactory,
	category: categoryFactory,
	techCategory: techCategoryFactory,
	aiCategory: aiCategoryFactory,
	post: postFactory,
	publishedPost: publishedPostFactory,
	draftPost: draftPostFactory,
	session: sessionFactory,
	media: mediaFactory,
	qualityMetrics: qualityMetricsFactory,
	highQualityMetrics: highQualityMetricsFactory,
	poorQualityMetrics: poorQualityMetricsFactory
};

export default factories;
