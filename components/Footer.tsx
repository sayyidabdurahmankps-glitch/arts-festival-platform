"use client"

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-900 bg-[#050505] py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="text-center md:text-left">
            <h2 className="text-xl font-black text-white tracking-tighter mb-1">
              Fest<span className="text-indigo-500">OS</span>
            </h2>
            <p className="text-sm font-medium text-zinc-600">
              © {new Date().getFullYear()} Anwarul Huda Islamic Complex. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-6 items-center text-sm font-medium text-zinc-500">
            <Link href="/events" className="hover:text-zinc-300 transition-colors">Schedule</Link>
            <Link href="/search" className="hover:text-zinc-300 transition-colors">Search Participant</Link>
            
            <span className="w-1 h-1 bg-zinc-800 rounded-full hidden lg:block"></span>
            
            {/* Staff Access Buttons */}
            <div className="flex flex-wrap justify-center gap-4 items-center">
              <Link 
                href="/media/login" 
                className=" text-black hover:text-purple-400 transition-colors"
              >
                Media Portal
              </Link>
              <Link 
                href="/judge/login" 
                className="  text-black hover:text-indigo-400 transition-colors"
              >
                Judge Portal
              </Link>
              <Link 
                href="/admin/login" 
                className=" px-4 py-1.5 rounded-lg text-black  border border-black-800 hover:border-zinc-600 hover:text-white transition-all"
              >
                Admin Access
              </Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}