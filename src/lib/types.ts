export interface Post {
	slug: string;
	title: string;
	publishedAt: string;
	description: string;
	categories: string[];
}

export interface PostDetail extends Post {
	content: string;
}