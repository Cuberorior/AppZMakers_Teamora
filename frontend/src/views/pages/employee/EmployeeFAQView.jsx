import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { BACKEND_URL } from '../../../config';

export function EmployeeFAQView() {
  const [openIndex, setOpenIndex] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/faqs?targetRole=employee`);
        if (res.ok) {
          const data = await res.json();
          setFaqs(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-400 opacity-20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-100 flex items-center gap-3">
              <HelpCircle className="w-10 h-10 text-indigo-100" />
              Frequently Asked Questions
            </h1>
            <p className="text-indigo-100 font-medium text-lg max-w-2xl">
              Find answers to common questions about attendance, leave, security, and general system usage below.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-6xl mx-auto pb-12">
        {faqs.map((faq, index) => (
          <div key={index} className={`group/faq bg-indigo-50/70 dark:bg-slate-800/80 backdrop-blur-sm border ${openIndex === index ? 'border-indigo-400 dark:border-indigo-500 shadow-md shadow-indigo-500/20 scale-[1.01]' : 'border-indigo-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5'} rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2`} style={{ animationDelay: `${index * 30}ms` }}>
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-8 py-6 flex items-center justify-between text-left focus:outline-none transition-colors duration-300 group-hover/faq:bg-indigo-100/60 dark:group-hover/faq:bg-slate-700/60"
            >
              <span className="font-bold text-slate-800 dark:text-slate-100 text-lg pr-6">{index + 1}. {faq.question}</span>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ease-out transform group-hover/faq:scale-110 group-hover/faq:rotate-180 group-hover/faq:shadow-sm ${openIndex === index ? 'bg-indigo-500 text-white rotate-180' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 group-hover/faq:bg-indigo-50 group-hover/faq:text-indigo-500 dark:group-hover/faq:bg-indigo-900/50 dark:group-hover/faq:text-indigo-400'}`}>
                {openIndex === index ? <ChevronUp className="w-6 h-6 transition-transform duration-500" /> : <ChevronDown className="w-6 h-6 transition-transform duration-500" />}
              </div>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-8 pb-6 pt-2 text-slate-600 dark:text-slate-400 text-base leading-relaxed border-t border-slate-100 dark:border-slate-800/50 mx-8 mt-2">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
