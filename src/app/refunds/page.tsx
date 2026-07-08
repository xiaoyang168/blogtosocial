export default function RefundsPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
        <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400">
          <p className="text-sm text-zinc-500 mb-6">Last updated: July 2026</p>

          <h2 className="text-xl font-semibold mt-6 mb-3">1. Eligibility</h2>
          <p>We offer refunds under the following conditions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You request a refund within 14 days of your purchase</li>
            <li>You have not used more than 10% of your plan's monthly generation limit</li>
            <li>The service was not functioning as described due to a technical issue on our end</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">2. Non-Refundable Cases</h2>
          <p>Refunds will not be issued if:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>More than 14 days have passed since purchase</li>
            <li>You have substantially used the service (exceeded 10% of monthly quota)</li>
            <li>The issue was caused by third-party services (AI provider downtime, etc.)</li>
            <li>You violated our Terms of Service</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">3. How to Request a Refund</h2>
          <p>Send an email to <strong>support@blogtosocial.top</strong> with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your account email</li>
            <li>Reason for refund request</li>
            <li>Date of purchase</li>
          </ul>
          <p>We will review your request within 5 business days.</p>

          <h2 className="text-xl font-semibold mt-6 mb-3">4. Processing Time</h2>
          <p>Approved refunds are processed within 7-10 business days. The refund will be issued to the original payment method.</p>

          <h2 className="text-xl font-semibold mt-6 mb-3">5. Contact</h2>
          <p>For refund-related questions, contact us at support@blogtosocial.top.</p>
        </div>
      </div>
    </div>
  );
}
