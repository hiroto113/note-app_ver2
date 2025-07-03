<script>
	import OGPTags from '$lib/components/seo/OGPTags.svelte';
</script>

<OGPTags
	title="プライバシーポリシー"
	description="My Notesのプライバシーポリシーです。個人情報の取り扱いについて詳しく説明しています。"
	type="website"
/>

<svelte:head>
	<title>プライバシーポリシー - My Notes</title>
</svelte:head>

<article class="prose prose-lg max-w-4xl mx-auto dark:prose-invert">
	<header class="text-center mb-12">
		<h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
			プライバシーポリシー
		</h1>
		<p class="text-lg text-gray-600 dark:text-gray-300">
			最終更新日: {new Date().toLocaleDateString('ja-JP')}
		</p>
	</header>

	<section class="mb-8">
		<h2 class="text-2xl font-semibold mb-4">1. はじめに</h2>
		<p class="text-gray-700 dark:text-gray-300 leading-relaxed">
			My Notes（以下「当サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。
			本プライバシーポリシーは、当サービスにおける個人情報の取り扱いについて説明するものです。
		</p>
	</section>

	<section class="mb-8">
		<h2 class="text-2xl font-semibold mb-4">2. 収集する情報</h2>
		<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
			<h3 class="text-lg font-semibold mb-3">2.1 アカウント情報</h3>
			<ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
				<li>GitHub認証によるユーザー名とメールアドレス</li>
				<li>プロフィール画像（GitHubから取得）</li>
				<li>アカウント作成日時</li>
			</ul>

			<h3 class="text-lg font-semibold mb-3">2.2 コンテンツ情報</h3>
			<ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mb-4">
				<li>作成された記事とその内容</li>
				<li>カテゴリ情報</li>
				<li>投稿日時と更新日時</li>
			</ul>

			<h3 class="text-lg font-semibold mb-3">2.3 技術情報</h3>
			<ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
				<li>IPアドレス</li>
				<li>ブラウザの種類とバージョン</li>
				<li>アクセス日時</li>
				<li>Cookie情報</li>
			</ul>
		</div>
	</section>

	<section class="mb-8">
		<h2 class="text-2xl font-semibold mb-4">3. 情報の利用目的</h2>
		<div class="space-y-4">
			<div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
				<h3 class="font-semibold mb-2">3.1 サービス提供</h3>
				<p class="text-gray-700 dark:text-gray-300">
					ユーザー認証、記事の作成・編集・表示、個人化されたコンテンツの提供
				</p>
			</div>
			
			<div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
				<h3 class="font-semibold mb-2">3.2 サービス改善</h3>
				<p class="text-gray-700 dark:text-gray-300">
					利用状況の分析、機能改善、新機能の開発
				</p>
			</div>
			
			<div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
				<h3 class="font-semibold mb-2">3.3 セキュリティ</h3>
				<p class="text-gray-700 dark:text-gray-300">
					不正利用の防止、セキュリティインシデントの検知と対応
				</p>
			</div>
		</div>
	</section>

	<section class="mb-8">
		<h2 class="text-2xl font-semibold mb-4">4. 情報の共有と開示</h2>
		<div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
			<p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
				当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供いたしません：
			</p>
			<ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
				<li>ユーザーの明示的な同意がある場合</li>
				<li>法的義務により開示が要求される場合</li>
				<li>ユーザーまたは公衆の安全を保護するために必要な場合</li>
				<li>サービス提供に必要な範囲で、信頼できる第三者サービス（例：GitHub）と連携する場合</li>
			</ul>
		</div>
	</section>

	<section class="mb-8">
		<h2 class="text-2xl font-semibold mb-4">5. Cookie について</h2>
		<div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
			<p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
				当サービスでは、ユーザー体験の向上のためにCookieを使用しています：
			</p>
			<ul class="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
				<li><strong>認証Cookie</strong>: ログイン状態の維持</li>
				<li><strong>設定Cookie</strong>: テーマやUIの設定保存</li>
				<li><strong>セッションCookie</strong>: セキュリティとパフォーマンスの向上</li>
			</ul>
			<p class="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
				ブラウザの設定によりCookieを無効化できますが、一部機能が正常に動作しない場合があります。
			</p>
		</div>
	</section>

	<section class="mb-8">
		<h2 class="text-2xl font-semibold mb-4">6. データの保存と保護</h2>
		<div class="grid md:grid-cols-2 gap-6">
			<div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
				<h3 class="font-semibold mb-2 flex items-center">
					<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
					暗号化
				</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					すべてのデータ通信はHTTPS で暗号化されています
				</p>
			</div>
			
			<div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
				<h3 class="font-semibold mb-2 flex items-center">
					<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
					</svg>
					サーバーセキュリティ
				</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					信頼できるクラウドサービスでデータを安全に保管
				</p>
			</div>
		</div>
	</section>

	<section class="mb-8">
		<h2 class="text-2xl font-semibold mb-4">7. ユーザーの権利</h2>
		<div class="space-y-4">
			<div class="border-l-4 border-blue-500 pl-4">
				<h3 class="font-semibold">データの確認・修正</h3>
				<p class="text-gray-600 dark:text-gray-400">
					管理画面からいつでも投稿した記事やプロフィール情報を確認・修正できます
				</p>
			</div>
			
			<div class="border-l-4 border-red-500 pl-4">
				<h3 class="font-semibold">データの削除</h3>
				<p class="text-gray-600 dark:text-gray-400">
					アカウント削除を希望される場合は、お問い合わせください
				</p>
			</div>
			
			<div class="border-l-4 border-green-500 pl-4">
				<h3 class="font-semibold">データのポータビリティ</h3>
				<p class="text-gray-600 dark:text-gray-400">
					記事データのエクスポート機能を提供しています
				</p>
			</div>
		</div>
	</section>

	<section class="mb-8">
		<h2 class="text-2xl font-semibold mb-4">8. プライバシーポリシーの変更</h2>
		<div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
			<p class="text-gray-700 dark:text-gray-300 leading-relaxed">
				当サービスは、必要に応じて本プライバシーポリシーを変更する場合があります。
				重要な変更については、サービス内での通知やメールでユーザーにお知らせいたします。
				継続してサービスをご利用いただくことで、変更後のプライバシーポリシーに同意したものとみなされます。
			</p>
		</div>
	</section>

	<section class="text-center">
		<h2 class="text-2xl font-semibold mb-4">9. お問い合わせ</h2>
		<p class="text-gray-600 dark:text-gray-400 mb-6">
			プライバシーに関するご質問やご不明な点がございましたら、お気軽にお問い合わせください。
		</p>
		<a
			href="/contact"
			class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
		>
			お問い合わせ
		</a>
	</section>
</article>