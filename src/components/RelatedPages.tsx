import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';

export interface RelatedPage {
    title: string;
    subtitle: string;
    page: string;
    color: string;
    icon?: LucideIcon;
}

interface RelatedPagesProps {
    pages: RelatedPage[];
    title?: string;
}

export function RelatedPages({ pages, title = "Diğer İlgili Sayfalar" }: RelatedPagesProps) {
    if (!pages || pages.length === 0) return null;

    return (
        <div className="mt-16 pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                <ArrowRight className="text-indigo-600" />
                {title}
            </h2>

            <div className={`grid grid-cols-1 md:grid-cols-${Math.min(pages.length, 3)} gap-6`}>
                {pages.map((link, idx) => (
                    <a
                        key={idx}
                        href={link.page.startsWith('/') ? link.page : `/${link.page}`}
                        className="group block"
                    >
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full hover:shadow-xl hover:border-indigo-100 transition-all duration-300 relative overflow-hidden">
                            {/* Hover effect background decoration */}
                            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${link.color} opacity-5 group-hover:opacity-10 transition-opacity`} />

                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${link.color} text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform`}>
                                    {link.icon ? <link.icon size={24} /> : <ArrowRight size={24} />}
                                </div>

                                <h3 className={`text-lg font-bold mb-2 group-hover:text-indigo-600 transition-colors`}>
                                    {link.title}
                                </h3>

                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {link.subtitle}
                                </p>

                                <div className="mt-4 flex items-center text-xs font-bold text-indigo-600 tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                    İncele <ArrowRight size={14} className="ml-1" />
                                </div>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
