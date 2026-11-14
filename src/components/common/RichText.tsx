import { Fragment, useMemo } from 'react';
import { Link } from 'react-router-dom';

/**
 * Renders a tiny inline markup subset used by our long-form copy:
 *
 *   **bold**              → <strong>
 *   [label](/route)       → react-router <Link>
 *   [label](https://…)    → <a target="_blank">
 *   [label](mailto:…)     → <a>
 *
 * Keeping the content as plain strings makes the legal pages readable and
 * diff-friendly, without reaching for `dangerouslySetInnerHTML`.
 */
const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

export function RichText({ text }: { text: string }) {
  const nodes = useMemo(() => parse(text), [text]);
  return <>{nodes}</>;
}

function parse(text: string): React.ReactNode[] {
  return text.split(TOKEN).map((part, index) => {
    if (!part) return null;

    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) {
      return (
        <strong key={index} className="font-semibold text-gray-900">
          {bold[1]}
        </strong>
      );
    }

    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      if (href.startsWith('/')) {
        return (
          <Link key={index} to={href} className="font-medium text-primary-700 hover:underline">
            {label}
          </Link>
        );
      }
      const external = href.startsWith('http');
      return (
        <a
          key={index}
          href={href}
          className="font-medium text-primary-700 hover:underline"
          {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        >
          {label}
        </a>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}
