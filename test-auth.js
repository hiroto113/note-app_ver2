import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Test authentication directly
console.log('Testing authentication...');

try {
	// Check if server is running
	const response = execSync('curl -s http://localhost:5173/', { encoding: 'utf8' });
	console.log('Server is running');

	// Test admin route
	const adminResponse = execSync('curl -s http://localhost:5173/admin/posts/new', {
		encoding: 'utf8'
	});
	console.log('Admin route response length:', adminResponse.length);

	// Test categories API
	const categoriesResponse = execSync('curl -s http://localhost:5173/api/admin/categories', {
		encoding: 'utf8'
	});
	console.log('Categories API response:', categoriesResponse);
} catch (error) {
	console.error('Test failed:', error.message);
}
