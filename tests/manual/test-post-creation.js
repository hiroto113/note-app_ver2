// Manual test script for post creation
// Run with: node tests/manual/test-post-creation.js

async function testPostCreation() {
	const baseUrl = 'http://localhost:5175';

	console.log('1. Testing login...');

	// Step 1: Login
	const loginResponse = await fetch(`${baseUrl}/auth/signin/credentials`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			username: 'admin',
			password: 'adminpass' // 実際のパスワードに置き換える必要があるかも
		}),
		credentials: 'include'
	});

	console.log('Login response status:', loginResponse.status);

	if (!loginResponse.ok) {
		console.error('Login failed:', await loginResponse.text());
		return;
	}

	// Extract cookies
	const cookies = loginResponse.headers.get('set-cookie');
	console.log('Cookies received:', cookies ? 'Yes' : 'No');

	// Step 2: Get session
	console.log('\n2. Testing session...');
	const sessionResponse = await fetch(`${baseUrl}/auth/session`, {
		headers: {
			Cookie: cookies || ''
		}
	});

	const sessionData = await sessionResponse.json();
	console.log('Session data:', JSON.stringify(sessionData, null, 2));

	// Step 3: Test categories endpoint first
	console.log('\n3. Testing categories endpoint...');
	const categoriesResponse = await fetch(`${baseUrl}/api/admin/categories`, {
		headers: {
			Cookie: cookies || ''
		}
	});

	console.log('Categories response status:', categoriesResponse.status);
	if (categoriesResponse.ok) {
		const categories = await categoriesResponse.json();
		console.log('Categories:', JSON.stringify(categories, null, 2));
	} else {
		console.error('Categories fetch failed:', await categoriesResponse.text());
	}

	// Step 4: Create post
	console.log('\n4. Testing post creation...');
	const postData = {
		title: 'Test Post from Manual Script',
		content: '# Test Content\n\nThis is a test post created via manual script.',
		excerpt: 'Test excerpt',
		status: 'draft',
		categoryIds: []
	};

	const createResponse = await fetch(`${baseUrl}/api/admin/posts`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Cookie: cookies || ''
		},
		body: JSON.stringify(postData)
	});

	console.log('Create post response status:', createResponse.status);

	if (createResponse.ok) {
		const createdPost = await createResponse.json();
		console.log('Created post:', JSON.stringify(createdPost, null, 2));
	} else {
		const errorText = await createResponse.text();
		console.error('Post creation failed:', errorText);
	}
}

// Run the test
testPostCreation().catch(console.error);
