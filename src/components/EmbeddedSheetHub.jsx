import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SHEET_SCALE = 0.8;
const SHEET_WIDTH_PERCENT = `${100 / SHEET_SCALE}%`;
const SHEET_HEIGHT = '97.5vh';
const SHEET_VIEWPORT_HEIGHT = '78vh';

function buildGoogleSheetEmbedUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!value) return '';

  try {
    const url = new URL(value);
    const segments = url.pathname.split('/').filter(Boolean);
    const docIndex = segments.indexOf('d');
    const sheetId = docIndex >= 0 ? segments[docIndex + 1] : '';
    const hashParams = new URLSearchParams(String(url.hash || '').replace(/^#/, ''));
    const gid = url.searchParams.get('gid') || hashParams.get('gid') || '0';

    if (!sheetId) return value;
    return `https://docs.google.com/spreadsheets/d/${sheetId}/preview?gid=${encodeURIComponent(gid)}&rm=minimal`;
  } catch {
    return value;
  }
}

export default function EmbeddedSheetHub({
  title = 'Live Spreadsheet',
  sourceUrl,
}) {
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [darkView, setDarkView] = useState(true);

  const baseEmbedUrl = useMemo(() => buildGoogleSheetEmbedUrl(sourceUrl), [sourceUrl]);
  const iframeUrl = useMemo(() => {
    if (!baseEmbedUrl) return '';
    const separator = baseEmbedUrl.includes('?') ? '&' : '?';
    return `${baseEmbedUrl}${separator}refresh=${refreshNonce}`;
  }, [baseEmbedUrl, refreshNonce]);

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span>{title}</span>
              <Badge className="border-cyan-400/35 bg-cyan-500/12 text-cyan-100">Google Sheets</Badge>
              <Badge className="border-emerald-400/35 bg-emerald-500/12 text-emerald-100">Live owner updates</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => setDarkView(prev => !prev)}
                className="rounded-2xl border border-white/15 bg-white/8 text-zinc-100 hover:bg-white/12"
              >
                {darkView ? 'Light View' : 'Dark View'}
              </Button>
              <Button
                type="button"
                onClick={() => setRefreshNonce(prev => prev + 1)}
                className="rounded-2xl border border-cyan-400/35 bg-[linear-gradient(135deg,rgba(5,10,20,0.96),rgba(14,116,144,0.18),rgba(8,47,73,0.24))] text-cyan-50 hover:bg-[linear-gradient(135deg,rgba(10,16,28,0.98),rgba(14,116,144,0.24),rgba(8,47,73,0.3))]"
              >
                Refresh Sheet
              </Button>
              <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex">
                <Button
                  type="button"
                  className="rounded-2xl border border-emerald-400/35 bg-[linear-gradient(135deg,rgba(5,10,20,0.96),rgba(5,150,105,0.18),rgba(6,78,59,0.24))] text-emerald-50 hover:bg-[linear-gradient(135deg,rgba(10,16,28,0.98),rgba(5,150,105,0.24),rgba(6,78,59,0.3))]"
                >
                  Open Full Sheet
                </Button>
              </a>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!!iframeUrl ? (
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,18,24,0.98),rgba(8,10,14,0.98))] p-3 shadow-[0_22px_60px_rgba(0,0,0,0.28)]">
              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white" style={{ height: SHEET_VIEWPORT_HEIGHT }}>
                <iframe
                  key={iframeUrl}
                  src={iframeUrl}
                  title={title}
                  className="block rounded-[24px] bg-white"
                  style={{
                    width: SHEET_WIDTH_PERCENT,
                    height: SHEET_HEIGHT,
                    transform: `scale(${SHEET_SCALE})`,
                    transformOrigin: 'top left',
                    filter: darkView ? 'invert(0.94) hue-rotate(180deg) saturate(0.88) contrast(0.96)' : undefined,
                  }}
                  referrerPolicy="strict-origin-when-cross-origin"
                  loading="lazy"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-red-400/25 bg-red-500/8 p-4 text-sm text-red-100">
              No sheet URL is configured yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
