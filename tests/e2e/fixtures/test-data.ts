/**
 * E2Eテスト用のテストデータ
 */

export const testUsers = {
  admin: {
    username: 'admin',
    password: 'admin123'
  },
  testUser: {
    username: 'testuser',
    password: 'testpass123'
  }
};

export const testPosts = {
  samplePost1: {
    title: 'Getting Started with SvelteKit',
    slug: 'getting-started-sveltekit',
    excerpt: 'Learn the basics of SvelteKit and how to get started with your first project.'
  },
  samplePost2: {
    title: 'Understanding AI and Machine Learning',
    slug: 'understanding-ai-ml',
    excerpt: 'An introduction to Artificial Intelligence and Machine Learning concepts.'
  }
};

export const testCategories = {
  technology: {
    name: 'Technology',
    slug: 'technology'
  },
  ai: {
    name: 'AI & Machine Learning',
    slug: 'ai-ml'
  }
};

export const testContent = {
  newPost: {
    title: 'E2E Test Post',
    content: '# E2E Test Post\n\nThis is a test post created during E2E testing.\n\n## Features\n\n- Automated testing\n- User interface validation\n- End-to-end workflows',
    excerpt: 'A test post created during E2E testing'
  },
  newCategory: {
    name: 'E2E Testing',
    description: 'Category created during E2E testing'
  }
};