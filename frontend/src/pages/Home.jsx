import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle, Star } from 'lucide-react';

export default function Home() {
  useEffect(() => {
    document.title = "RefundFlow - Hassle-Free Order Returns & Refunds";
  }, []);

  return (
    <div className="animate-fade-in-up">
      <div className="flex flex-col md:flex-row items-center gap-12 py-16">
        <div className="md:w-1/2 text-center md:text-left">
          <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-800 tracking-tight mb-6 leading-tight">
            Hassle-Free <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Refunds</span>
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-lg mx-auto md:mx-0">
            We believe in making it right. Manage your orders, submit refund requests, and track their status in real-time with complete transparency.
          </p>
          <div className="flex justify-center md:justify-start gap-4">
            <Link to="/register" className="px-8 py-3 rounded-full text-white bg-primary hover:bg-blue-600 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
              Get Started
            </Link>
            <Link to="/about" className="px-8 py-3 rounded-full text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 font-semibold shadow-sm transition-all">
              Learn More
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-50 transform scale-110"></div>
            <img 
              src="/images/hero.png" 
              alt="Dashboard visualization" 
              className="relative z-10 w-full max-w-lg rounded-3xl transform hover:scale-105 transition-transform duration-500 shadow-2xl border border-white/50" 
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 py-12 mt-8">
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="w-14 h-14 bg-blue-100 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Fast Processing</h3>
          <p className="text-slate-500">We review and process your requests within 24-48 hours. Our automated system speeds things up.</p>
        </div>
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Easy Tracking</h3>
          <p className="text-slate-500">Log in anytime to see the status of your refund. Real-time updates directly on your dashboard.</p>
        </div>
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Secure & Fair</h3>
          <p className="text-slate-500">Covered under our generous 7-day refund policy. Simply request, submit proof, and we'll handle the rest.</p>
        </div>
      </div>

      {/* Team / Tracking Section */}
      <div className="py-16 animate-fade-in-up border-t border-slate-100">
        <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-12">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-4">Dedicated to Your Satisfaction</h2>
            <p className="text-lg text-slate-500 mb-6">Behind every refund request is a team of professionals actively tracking and processing returns to ensure you get your money back faster than ever.</p>
            <ul className="text-slate-600 space-y-3">
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /> Human-reviewed tickets to ensure fairness</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /> Active tracking systems monitoring real-time</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /> Dedicated cross-platform merchant support</li>
            </ul>
          </div>
          <div className="md:w-1/2 flex justify-center">
             <img 
               src="/images/office.png" 
               alt="Team of workers standing and tracking refunds in a modern office" 
               className="w-full max-w-md rounded-[2rem] shadow-2xl transform -rotate-1 hover:rotate-0 transition-transform duration-500 border border-slate-100" 
             />
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-16 mb-8 relative">
        <div className="absolute inset-0 bg-blue-50 transform -skew-y-2 z-0 rounded-3xl"></div>
        <div className="relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">What Our Customers Say</h2>
            <p className="text-slate-500 mt-2">Join thousands of satisfied shoppers who trust RefundFlow</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card p-8 rounded-2xl">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />)}
              </div>
              <p className="text-slate-600 italic mb-6">"I had to return a defective chair, and the process was so seamless. My refund was approved in less than 24 hours. Incredible!"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold">M</div>
                <div>
                  <h4 className="font-bold text-slate-800">Michael S.</h4>
                  <p className="text-sm text-slate-500">Verified Buyer</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-8 rounded-2xl">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />)}
              </div>
              <p className="text-slate-600 italic mb-6">"Finally, a service that doesn't make you feel like a criminal for changing your mind. The whole UI is just beautiful and simple."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center font-bold">S</div>
                <div>
                  <h4 className="font-bold text-slate-800">Sarah T.</h4>
                  <p className="text-sm text-slate-500">Verified Buyer</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-8 rounded-2xl">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />)}
              </div>
              <p className="text-slate-600 italic mb-6">"As a merchant, using RefundFlow has entirely eliminated my support tickets. Customers love the transparency. Win-win!"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold">D</div>
                <div>
                  <h4 className="font-bold text-slate-800">David R.</h4>
                  <p className="text-sm text-slate-500">Store Owner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
