import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Code2,
  Eye,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Maximize2,
  Minimize2,
  ExternalLink,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Layers,
  Sparkles,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export type ResponseFormat = 'HTML' | 'JSON' | 'MARKDOWN' | 'IMAGE' | 'VIDEO' | 'TEXT';

export interface ExecutionLogDetail {
  id?: string;
  jobId?: string;
  jobName?: string;
  jobUrl?: string;
  method?: string;
  statusCode?: number | null;
  httpStatus?: number | null;
  responseTime?: number | null;
  durationMs?: number | null;
  executedAt?: string | Date;
  startedAt?: string | Date;
  status?: string;
  responseBody?: string | null;
  responseHeaders?: string | Record<string, string> | null;
  requestHeaders?: Record<string, string> | null;
  errorMessage?: string | null;
  contentType?: string | null;
  workerId?: string | null;
}

interface ResponsePreviewModalProps {
  log: ExecutionLogDetail | null;
  onClose: () => void;
}

export function detectResponseType(body: string, contentTypeHeader?: string | null): ResponseFormat {
  const trimmed = (body || '').trim();
  const ct = (contentTypeHeader || '').toLowerCase();

  // Image detection
  if (
    ct.includes('image/') ||
    trimmed.startsWith('data:image/') ||
    /^https?:\/\/.*\.(png|jpg|jpeg|gif|svg|webp|avif)(\?.*)?$/i.test(trimmed)
  ) {
    return 'IMAGE';
  }

  // Video detection
  if (
    ct.includes('video/') ||
    trimmed.startsWith('data:video/') ||
    /^https?:\/\/.*\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)
  ) {
    return 'VIDEO';
  }

  // HTML detection
  if (
    ct.includes('text/html') ||
    ct.includes('application/xhtml+xml') ||
    /^\s*<!DOCTYPE\s+html/i.test(trimmed) ||
    /^\s*<html/i.test(trimmed) ||
    (trimmed.includes('<head>') && trimmed.includes('</body>')) ||
    (trimmed.includes('<!DOCTYPE') || trimmed.includes('</html>'))
  ) {
    return 'HTML';
  }

  // JSON detection
  if (ct.includes('application/json') || ct.includes('text/json')) {
    return 'JSON';
  }
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'JSON';
    } catch {
      // ignore parse error
    }
  }

  // Markdown detection
  if (
    ct.includes('markdown') ||
    /^\s*(#+ |> |-\s+|\*\s+|\d+\.\s+|```)/m.test(trimmed) ||
    (trimmed.includes('**') && trimmed.includes('\n')) ||
    (trimmed.includes('](') && trimmed.includes('http'))
  ) {
    return 'MARKDOWN';
  }

  return 'TEXT';
}

/**
 * Lightweight Markdown parsing helper rendering clean JSX.
 */
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;

        // Headings
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-lg font-bold text-zinc-900 dark:text-zinc-100 pb-1 border-b border-zinc-200 dark:border-zinc-800 mt-2">
              {trimmed.replace('# ', '')}
            </h1>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-2">
              {trimmed.replace('## ', '')}
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1.5">
              {trimmed.replace('### ', '')}
            </h3>
          );
        }

        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <li key={idx} className="ml-4 list-disc text-zinc-700 dark:text-zinc-300">
              {formatInlineMarkdown(trimmed.substring(2))}
            </li>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="pl-3 border-l-2 border-indigo-500 text-zinc-600 dark:text-zinc-400 italic bg-indigo-50/50 dark:bg-indigo-950/20 py-1 rounded-r">
              {formatInlineMarkdown(trimmed.substring(2))}
            </blockquote>
          );
        }

        // Code block line / horizontal rule
        if (trimmed.startsWith('---') || trimmed.startsWith('***')) {
          return <hr key={idx} className="my-2 border-zinc-200 dark:border-zinc-800" />;
        }

        return <p key={idx} className="break-words">{formatInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

function formatInlineMarkdown(text: string) {
  // Replace bold, italic, code
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-zinc-900 dark:text-zinc-100">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono px-1 py-0.5 rounded text-[11px]">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

/**
 * Syntax highlighted JSON display component
 */
function PrettyJsonView({ code }: { code: string }) {
  const formatted = useMemo(() => {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return code;
    }
  }, [code]);

  return (
    <pre className="p-4 bg-zinc-950 text-zinc-200 font-mono text-xs leading-relaxed rounded-lg border border-zinc-800 overflow-x-auto whitespace-pre">
      {formatted}
    </pre>
  );
}

export default function ResponsePreviewModal({ log, onClose }: ResponsePreviewModalProps) {
  if (!log) return null;

  const rawBody = log.responseBody || log.errorMessage || '';
  const detectedFormat = detectResponseType(rawBody, log.contentType);

  const [activeFormat, setActiveFormat] = useState<ResponseFormat>(detectedFormat);
  const [activeTab, setActiveTab] = useState<'preview' | 'headers' | 'raw'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAllFormats, setShowAllFormats] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parsedHeaders = useMemo(() => {
    if (!log.responseHeaders) return null;
    if (typeof log.responseHeaders === 'object') return log.responseHeaders;
    try {
      return JSON.parse(log.responseHeaders);
    } catch {
      return null;
    }
  }, [log.responseHeaders]);

  const httpCode = log.statusCode || log.httpStatus || 200;
  const isSuccess = httpCode >= 200 && httpCode < 300;
  const executedTime = log.executedAt || log.startedAt || new Date().toISOString();
  const duration = log.responseTime || log.durationMs || 0;

  // Prepare HTML preview document by injecting target origin base tag for relative CSS/images
  const preparedHtmlDoc = useMemo(() => {
    if (!rawBody) return '';
    if (!log.jobUrl || (!log.jobUrl.startsWith('http://') && !log.jobUrl.startsWith('https://'))) {
      return rawBody;
    }
    try {
      const parsedUrl = new URL(log.jobUrl);
      const baseUrl = parsedUrl.origin;
      const baseTag = `<base href="${baseUrl}/">`;
      if (/<head[^>]*>/i.test(rawBody)) {
        return rawBody.replace(/<head[^>]*>/i, `$&\n  ${baseTag}`);
      }
      return `<!DOCTYPE html><html><head>${baseTag}</head><body>${rawBody}</body></html>`;
    } catch {
      return rawBody;
    }
  }, [rawBody, log.jobUrl]);

  // Dynamically compute relevant formats so HTML doesn't clutter with IMAGE/VIDEO options unless requested
  const smartFormats = useMemo<ResponseFormat[]>(() => {
    if (showAllFormats) {
      return ['HTML', 'JSON', 'MARKDOWN', 'TEXT', 'IMAGE', 'VIDEO'];
    }

    const set = new Set<ResponseFormat>();
    if (detectedFormat === 'HTML') {
      set.add('HTML');
      set.add('TEXT');
      set.add('JSON');
    } else if (detectedFormat === 'JSON') {
      set.add('JSON');
      set.add('TEXT');
      set.add('MARKDOWN');
    } else if (detectedFormat === 'IMAGE') {
      set.add('IMAGE');
      set.add('TEXT');
    } else if (detectedFormat === 'VIDEO') {
      set.add('VIDEO');
      set.add('TEXT');
    } else if (detectedFormat === 'MARKDOWN') {
      set.add('MARKDOWN');
      set.add('TEXT');
      set.add('HTML');
    } else {
      set.add('TEXT');
      set.add('JSON');
      set.add('HTML');
      set.add('MARKDOWN');
    }

    // Always include active format if user manually switched to it
    set.add(activeFormat);
    return Array.from(set);
  }, [detectedFormat, activeFormat, showAllFormats]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col transition-all duration-300 max-w-full overflow-hidden ${
          isFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-4xl max-h-[92vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 rounded-t-xl gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`p-2 rounded-lg shrink-0 ${isSuccess ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {isSuccess ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  {log.jobName || 'HTTP Execution'}
                </span>
                <span className={`text-[10px] sm:text-[11px] font-mono font-bold px-1.5 sm:px-2 py-0.5 rounded ${
                  isSuccess
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                }`}>
                  HTTP {httpCode}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 font-mono truncate mt-0.5 flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="truncate">{log.jobUrl || 'Target Endpoint'}</span>
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Execution Metadata Pill Strip */}
        <div className="px-4 sm:px-5 py-2 bg-zinc-100/50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-zinc-600 dark:text-zinc-400 text-[11px] sm:text-xs">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              {new Date(executedTime).toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <span className="text-zinc-400 font-sans">Latency:</span>
              <strong className="text-zinc-800 dark:text-zinc-200">{duration}ms</strong>
            </span>
            {log.method && (
              <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {log.method}
              </span>
            )}
            {log.workerId && (
              <span className="text-zinc-500 text-[10px] sm:text-[11px]">
                Worker: {log.workerId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={log.status === 'FAILED' ? 'failed' : 'success'} />
          </div>
        </div>

        {/* Format Selector Bar & View Mode Tabs */}
        <div className="px-3 sm:px-5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 max-w-full">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-xs font-medium overflow-x-auto max-w-full shrink-0">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Response Preview
            </button>
            <button
              onClick={() => setActiveTab('headers')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'headers'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Headers ({parsedHeaders ? Object.keys(parsedHeaders).length : 0})
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'raw'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Raw Body
            </button>
          </div>

          {/* Smart Format Switcher (Filtered dynamically by detected response type) */}
          {activeTab === 'preview' && (
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5 shrink-0">
              <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1 whitespace-nowrap shrink-0">
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                Format:
              </span>
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-md text-[11px] overflow-x-auto shrink-0">
                {smartFormats.map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setActiveFormat(fmt)}
                    className={`px-2 py-0.5 rounded font-mono font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      activeFormat === fmt
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}

                {!showAllFormats && (
                  <button
                    onClick={() => setShowAllFormats(true)}
                    className="px-1.5 py-0.5 text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 font-mono underline whitespace-nowrap shrink-0"
                    title="Show all format options"
                  >
                    +More
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Content Body */}
        <div className="p-5 flex-1 overflow-y-auto min-h-[300px]">
          {activeTab === 'headers' && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Response HTTP Headers
              </h4>
              {parsedHeaders && Object.keys(parsedHeaders).length > 0 ? (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 w-1/3">Header</th>
                        <th className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {Object.entries(parsedHeaders).map(([key, val]) => (
                        <tr key={key} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                          <td className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-semibold">{key}</td>
                          <td className="px-4 py-2 text-zinc-800 dark:text-zinc-200 break-all">{String(val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No response headers were captured for this execution.</p>
              )}
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-500">
                  Total Size: {new Blob([rawBody]).size} bytes
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied to Clipboard' : 'Copy Raw Body'}
                </button>
              </div>
              <pre className="p-4 bg-zinc-950 text-zinc-200 font-mono text-xs leading-relaxed rounded-lg border border-zinc-800 overflow-x-auto whitespace-pre-wrap break-all">
                {rawBody || '(Empty response body)'}
              </pre>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="h-full flex flex-col">
              {/* 1. HTML PREVIEW MODE */}
              {activeFormat === 'HTML' && (
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                    <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                      <FileText className="w-3.5 h-3.5" /> HTML Rendered Document Preview
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy HTML Code
                    </button>
                  </div>
                    <div className="flex-1 min-h-[400px] border border-zinc-300 dark:border-zinc-800 rounded-lg overflow-hidden bg-white shadow-inner">
                      <iframe
                        title="HTML Response Rendered Preview"
                        srcDoc={preparedHtmlDoc}
                        sandbox="allow-same-origin allow-scripts"
                        className="w-full h-full min-h-[400px] bg-white border-0"
                      />
                    </div>
                </div>
              )}

              {/* 2. JSON PREVIEW MODE */}
              {activeFormat === 'JSON' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Code2 className="w-3.5 h-3.5" /> Pretty-Printed JSON
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy JSON
                    </button>
                  </div>
                  <PrettyJsonView code={rawBody} />
                </div>
              )}

              {/* 3. MARKDOWN PREVIEW MODE */}
              {activeFormat === 'MARKDOWN' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                    <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-semibold">
                      <FileText className="w-3.5 h-3.5" /> Rendered Markdown Document
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Markdown
                    </button>
                  </div>
                  <div className="p-5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-[500px] overflow-y-auto">
                    <MarkdownRenderer content={rawBody} />
                  </div>
                </div>
              )}

              {/* 4. IMAGE PREVIEW MODE */}
              {activeFormat === 'IMAGE' && (
                <div className="space-y-3 text-center">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                      <ImageIcon className="w-3.5 h-3.5" /> Image Media Preview
                    </span>
                    {rawBody.startsWith('http') && (
                      <a
                        href={rawBody}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-indigo-500 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open Direct Image
                      </a>
                    )}
                  </div>
                  <div className="p-6 bg-zinc-100 dark:bg-zinc-900/80 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center min-h-[300px]">
                    <img
                      src={rawBody}
                      alt="Response Media Output"
                      className="max-w-full max-h-[420px] object-contain rounded-lg shadow-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-950"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 5. VIDEO PREVIEW MODE */}
              {activeFormat === 'VIDEO' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                    <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                      <VideoIcon className="w-3.5 h-3.5" /> Video Media Player
                    </span>
                    {rawBody.startsWith('http') && (
                      <a
                        href={rawBody}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-indigo-500 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Download Video
                      </a>
                    )}
                  </div>
                  <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-center min-h-[300px]">
                    <video
                      controls
                      src={rawBody}
                      className="w-full max-h-[420px] rounded-lg shadow-lg bg-black"
                    >
                      Your browser does not support HTML5 video playback.
                    </video>
                  </div>
                </div>
              )}

              {/* 6. PLAIN TEXT MODE (NO HORIZONTAL SCROLLBAR - WRAPPED TEXT) */}
              {activeFormat === 'TEXT' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                    <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-semibold">
                      <FileText className="w-3.5 h-3.5" /> Plain Wrapped Text
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Text
                    </button>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 font-mono text-xs leading-relaxed rounded-lg border border-zinc-200 dark:border-zinc-800 whitespace-pre-wrap break-words overflow-x-hidden max-w-full select-text">
                    {rawBody || '(No response text returned)'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 rounded-b-xl flex items-center justify-between text-xs">
          <div className="text-zinc-500 font-mono flex items-center gap-2">
            <span>Detected Format: <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{detectedFormat}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium rounded-lg text-xs transition-colors shadow-xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
