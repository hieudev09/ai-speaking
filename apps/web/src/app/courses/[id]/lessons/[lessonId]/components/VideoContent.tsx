interface VideoContent {
  url?: string;
  youtubeId?: string;
  title?: string;
  description?: string;
}

function isYouTubeId(id: string) {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

export function VideoContent({ content }: { content: VideoContent }) {
  const { url, youtubeId, title, description } = content;

  // Detect YouTube URLs and extract video ID
  let embedId = youtubeId;
  if (!embedId && url) {
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    if (ytMatch) embedId = ytMatch[1];
  }

  if (embedId && isYouTubeId(embedId)) {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900">
          <div className="relative pb-[56.25%]">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${embedId}?rel=0&modestbranding=1`}
              title={title ?? 'Lesson video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
        {description && (
          <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
        )}
      </div>
    );
  }

  if (url) {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            controls
            className="w-full"
            src={url}
            title={title ?? 'Lesson video'}
          />
        </div>
        {description && (
          <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-700/40 bg-slate-800/30 py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/20">
        <svg className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-medium text-slate-300">Video not available</p>
        <p className="mt-1 text-sm text-slate-500">Video content will be added soon.</p>
      </div>
    </div>
  );
}
