interface TextContent {
  html?: string;
  markdown?: string;
  text?: string;
}

export function TextContent({ content }: { content: TextContent }) {
  const body = content.html ?? content.text ?? '';

  if (!body) {
    return (
      <div className="rounded-xl border border-slate-700/40 bg-slate-800/30 px-5 py-8 text-center text-slate-500">
        No text content available.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-slate-800/30 p-6 md:p-8">
      <div
        className="prose prose-invert prose-slate max-w-none
          prose-headings:text-white prose-headings:font-semibold
          prose-p:text-slate-300 prose-p:leading-relaxed
          prose-strong:text-indigo-300
          prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
          prose-code:rounded prose-code:bg-slate-700/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-indigo-300
          prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700/50
          prose-blockquote:border-l-indigo-500 prose-blockquote:text-slate-400
          prose-ul:text-slate-300 prose-ol:text-slate-300
          prose-li:marker:text-indigo-400"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </div>
  );
}
