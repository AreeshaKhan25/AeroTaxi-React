import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { PageHero } from '@/components/common/PageHero';
import { RichText } from '@/components/common/RichText';
import { usePageTitle } from '@/hooks/usePageTitle';
import { LEGAL_DOCUMENTS, type LegalBlock, type LegalDocument } from '@/content/legal';
import { SITE } from '@/lib/site';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function Block({ block }: { block: LegalBlock }) {
  if (block.type === 'h3') {
    return (
      <h3 className="mb-3 mt-6 text-base font-bold text-gray-900">
        <RichText text={block.text} />
      </h3>
    );
  }

  if (block.type === 'ul') {
    return (
      <ul className="mb-6 list-disc space-y-2 pl-6 text-gray-600">
        {block.items.map((item) => (
          <li key={item}>
            <RichText text={item} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="mb-4 leading-relaxed text-gray-600">
      <RichText text={block.text} />
    </p>
  );
}

export default function LegalDocumentPage({ doc }: { doc: LegalDocument }) {
  usePageTitle(doc.title);

  const toc = useMemo(
    () => doc.sections.map((section) => ({ id: slugify(section.heading), label: section.heading })),
    [doc],
  );

  const others = LEGAL_DOCUMENTS.filter((entry) => entry.slug !== doc.slug);

  return (
    <>
      <PageHero title={doc.title} subtitle={doc.meta} />

      <section className="py-12">
        <div className="container-page">
          <div className="flex flex-col gap-10 lg:flex-row">
            {/* Table of contents */}
            <aside className="hidden w-64 flex-shrink-0 lg:block">
              <nav aria-label="On this page" className="sticky top-24">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                  On this page
                </p>
                <ul className="space-y-1 border-l border-gray-200">
                  {toc.map((entry) => (
                    <li key={entry.id}>
                      <a
                        href={`#${entry.id}`}
                        className="-ml-px block border-l-2 border-transparent py-1.5 pl-3 text-sm text-gray-500 transition hover:border-primary-700 hover:text-primary-700"
                      >
                        {entry.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Document */}
            <article className="prose-legal min-w-0 flex-1 rounded-2xl bg-white p-6 shadow-card sm:p-9">
              {doc.intro?.map((paragraph) => (
                <p key={paragraph} className="mb-4 leading-relaxed text-gray-600">
                  <RichText text={paragraph} />
                </p>
              ))}

              {doc.sections.map((section) => (
                <section key={section.heading} id={slugify(section.heading)} className="scroll-mt-24">
                  <h2 className="mb-4 mt-9 text-xl font-bold text-gray-900 first:mt-0 sm:text-2xl">
                    {section.heading}
                  </h2>
                  {section.blocks.map((block, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Block key={index} block={block} />
                  ))}
                </section>
              ))}

              <footer className="mt-10 border-t border-gray-100 pt-6">
                <p className="mb-4 text-sm text-gray-400">
                  {SITE.legalName} — {SITE.address.inline}. Company file number{' '}
                  {SITE.companyFileNumber}.
                </p>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
                  Related documents
                </p>
                <ul className="flex flex-wrap gap-x-5 gap-y-2">
                  {others.map((entry) => (
                    <li key={entry.slug}>
                      <Link
                        to={entry.path}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" aria-hidden />
                        {entry.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </footer>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
