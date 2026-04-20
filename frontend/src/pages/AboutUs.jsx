import React, { useEffect } from 'react';

export default function AboutUs() {
  useEffect(() => {
    document.title = "About Us - RefundFlow";
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-12 animate-fade-in-up">
      <div className="glass-card p-10 rounded-3xl">
        <div className="flex flex-col md:flex-row gap-12 items-center mb-12">
          <div className="md:w-1/2">
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-6">About Us</h1>
            <p className="text-lg text-slate-600 mb-4 whitespace-pre-line">
              Welcome to <strong>RefundFlow</strong>. We are dedicated to providing the most transparent, efficient, and customer-friendly refund process in the industry.
              {'\n\n'}
              Founded in 2026, our mission is simple: to bridge the trust gap between buyers and merchants. We understand that sometimes, products don't meet your expectations or simply aren't the right fit. When that happens, you shouldn't have to jump through hoops to get your money back.
            </p>
          </div>
          <div className="md:w-1/2 flex justify-center">
             <img 
               src="/images/office.png" 
               alt="A friendly diverse customer service worker sitting at a modern office desk with a RefundFlow logo" 
               className="w-full max-w-sm rounded-3xl shadow-xl transform rotate-2 hover:rotate-0 transition-transform duration-300"
             />
          </div>
        </div>
        
        <div className="prose prose-slate prose-lg max-w-none text-slate-600">
          <div className="flex flex-col md:flex-row-reverse gap-12 mb-8 items-center">
            <div className="md:w-1/2">
               <img 
                 src="/images/about.png" 
                 alt="Customer Support Team" 
                 className="w-full max-w-sm rounded-3xl shadow-lg border border-slate-100"
               />
            </div>
            <div className="md:w-1/2">
               <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">Our Values</h2>
               <ul className="list-disc pl-6 space-y-2 mb-8">
                 <li><strong>Transparency:</strong> Keep customers informed at every step of their refund journey.</li>
                 <li><strong>Speed:</strong> Resolve issues and process payments rapidly.</li>
                 <li><strong>Fairness:</strong> Enforce policies that protect both consumers and the business ecosystem.</li>
               </ul>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4">How it works</h2>
          <p className="mb-8">
            Our dedicated team reviews every request made through our platform within 24 hours. We evaluate items under our 7-day return policy and communicate directly with customers to verify details when necessary. 
          </p>

          <div className="mt-10 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center shadow-inner">
            <p className="text-blue-800 font-medium italic m-0 text-lg text-center w-full">
              "A frustrated customer is a missed opportunity. We treat every refund request as a chance to show our commitment to your satisfaction."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
