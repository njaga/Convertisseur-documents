import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import editorialData from '../../content/tool-editorial.json';

type EditorialEntry = {
  heading: string;
  intro: string[];
  steps: Array<{ title: string; description: string }>;
  faqs: Array<{ question: string; answer: string }>;
  related: Array<{ href: string; label: string; description: string }>;
};

const editorialByPath = editorialData as Record<string, EditorialEntry>;

const normalizePath = (pathname: string) => pathname.replace(/\/$/, '') || '/';

export default function ToolEditorial() {
  const { pathname } = useLocation();
  const content = editorialByPath[normalizePath(pathname)];

  if (!content) return null;

  return (
    <section className="border-t border-gray-200 bg-white" aria-labelledby="tool-editorial-title">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2457E6]">Guide de l’outil</p>
          <h2 id="tool-editorial-title" className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 md:text-3xl">
            {content.heading}
          </h2>
          <div className="mt-5 space-y-3 text-base leading-7 text-gray-600">
            {content.intro.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-lg font-semibold text-gray-950">Comment ça marche ?</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {content.steps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2457E6] text-xs text-white">{index + 1}</span>
                  {step.title}
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600">{step.description}</p>
              </article>
            ))}
          </div>
        </div>

        {content.faqs.length > 0 && (
          <div className="mt-14 grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <h3 className="text-lg font-semibold text-gray-950">Questions fréquentes</h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Les réponses portent sur le fonctionnement actuel de Doxali et les limites propres à cet outil.
              </p>
            </div>
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {content.faqs.map(item => (
                <details key={item.question} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-medium text-gray-900 marker:hidden">
                    <span>{item.question}</span>
                    <span className="mt-1 text-[#2457E6] transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="max-w-2xl pt-3 text-sm leading-6 text-gray-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        <div className="mt-14">
          <h3 className="text-lg font-semibold text-gray-950">Outils associés</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {content.related.map(item => (
              <Link
                key={item.href}
                to={item.href}
                className="group rounded-2xl border border-gray-200 p-5 transition-colors hover:border-[#2457E6]/40 hover:bg-blue-50/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <CheckCircle2 size={16} className="text-[#2457E6]" />
                    {item.label}
                  </div>
                  <ArrowRight size={16} className="text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#2457E6]" />
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-500">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
