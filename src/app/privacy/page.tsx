export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400">
          <p className="text-sm text-zinc-500 mb-6">Last updated: July 2026</p>

          <h2 className="text-xl font-semibold mt-6 mb-3">1. Information We Collect</h2>
          <p>We collect:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email address (for account creation and authentication)</li>
            <li>Content you submit for AI generation</li>
            <li>Usage data (number of generations, platform selections)</li>
            <li>Payment information (processed securely by our payment provider)</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">2. How We Use Your Information</h2>
          <p>We use your data to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide and improve the BlogToSocial service</li>
            <li>Process AI content generation via DeepSeek API</li>
            <li>Manage your account and subscription</li>
            <li>Enforce usage limits and prevent abuse</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">3. Data Retention</h2>
          <p>Generated content is not permanently stored unless you have a paid plan with history enabled. Free tier content is processed and immediately discarded. Usage logs are retained for 30 days.</p>

          <h2 className="text-xl font-semibold mt-6 mb-3">4. Third-Party Services</h2>
          <p>We use:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> for authentication and database storage</li>
            <li><strong>DeepSeek</strong> for AI content generation</li>
            <li><strong>Paddle</strong> for payment processing</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">5. Cookies</h2>
          <p>We use essential cookies for authentication and session management. We do not use tracking or advertising cookies.</p>

          <h2 className="text-xl font-semibold mt-6 mb-3">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access your personal data</li>
            <li>Request deletion of your account and data</li>
            <li>Export your data</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">7. Security</h2>
          <p>We implement industry-standard security measures including encryption, secure authentication, and regular security audits.</p>

          <h2 className="text-xl font-semibold mt-6 mb-3">8. Contact</h2>
          <p>For privacy-related questions, contact us at privacy@blogtosocial.top.</p>
        </div>
      </div>
    </div>
  );
}
