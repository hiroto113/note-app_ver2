export function generateSlug(title: string): string {
	return (
		title
			.toLowerCase()
			.trim()
			// Replace Japanese characters and spaces with hyphens
			.replace(/[\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF]+/g, '-')
			// Replace non-alphanumeric characters (except hyphens) with empty string
			.replace(/[^a-z0-9-]/g, '')
			// Replace multiple consecutive hyphens with single hyphen
			.replace(/-+/g, '-')
			// Remove leading and trailing hyphens
			.replace(/^-|-$/g, '')
			// Limit length
			.substring(0, 100)
	);
}
