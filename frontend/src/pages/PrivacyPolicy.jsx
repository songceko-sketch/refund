import React, { useEffect } from 'react';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy - RefundFlow";
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 animate-fade-in-up">
      <div className="glass-card p-10 rounded-3xl">
        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-6">Privacy Policy</h1>
        
        <div className="prose prose-slate prose-lg max-w-none text-slate-600 space-y-6">
          <p className="text-sm text-slate-400 uppercase tracking-widest font-semibold mb-8 border-b border-slate-100 pb-4">Last Updated: April 2026</p>
          
          <h2 className="text-2xl font-bold text-slate-800">1. Information We Collect</h2>
          <p>
            When you use RefundFlow, we collect information that you manually provide to us during registration, such as your email address and password (which is securely hashed). We also collect data regarding your purchases and refund requests.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-8">2. How We Use Your Information</h2>
          <p>
            The information collected is used exclusively to provide, maintain, and improve our refund management services. This includes:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Processing your log-in securely via JSON Web Tokens.</li>
            <li>Validating whether your refund falls within the 7-day eligibility period.</li>
            <li>Tracking your orders and updating their statuses.</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-800 mt-8">3. Data Sharing</h2>
          <p>
            We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information. We may release information when its release is appropriate to comply with the law, enforce our site policies, or protect ours or others' rights, property, or safety.
          </p>

          <h2 className="text-2xl font-bold text-slate-800 mt-8">4. Data Security</h2>
          <p>
            We implement a variety of standard security measures to maintain the safety of your personal information when you log in, place a request, or interact with our databases.
          </p>
          
          <div className="mt-10 p-4 bg-slate-50 rounded-xl text-sm border border-slate-200">
            If you have any questions regarding this privacy policy, you may contact our administrators via the platform.
          </div>
        </div>
      </div>
    </div>
  );
}
