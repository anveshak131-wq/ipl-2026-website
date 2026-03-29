// GET /api/ipl-live-score/save: return table data (optionally per match)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const KV = env.SPORTS_KV;
  if (!KV) {
    return new Response(JSON.stringify({ error: 'SPORTS_KV binding missing in env' }), { status: 500 });
  }

  const fnv1a64Hex = (input) => {
    let hash = 0xcbf29ce484222325n;
    const prime = 0x100000001b3n;
    for (let i = 0; i < input.length; i++) {
      hash ^= BigInt(input.charCodeAt(i));
      hash = (hash * prime) & 0xffffffffffffffffn;
    }
    return hash.toString(16).padStart(16, '0');
  };

  const getBallKey = (row, ex, wk) => {
    const innings = String(row?.[2] || '');
    const over = String(row?.[0] || '');
    const ball = String(row?.[1] || '');
    const striker = String(row?.[3] || '');
    const nonStriker = String(row?.[4] || '');
    const bowler = String(row?.[5] || '');
    const runs = String(row?.[6] || '');
    const notes = String(row?.[12] || '');

    const wideTotal = ex?.hasWide ? 1 + (Number(ex?.wideExtraRuns) || 0) : 0;
    const nb = ex?.hasNoBall ? 1 : 0;
    const byes = ex?.hasByes ? Number(ex?.byesRuns) || 0 : 0;
    const lb = ex?.hasLB ? Number(ex?.lbRuns) || 0 : 0;
    const wicket = wk?.hasWicket
      ? `W:${wk?.wicketType || ''}:${wk?.outBatter || ''}:${wk?.wicketTaker || ''}`
      : '';

    const signature = [
      innings,
      `${over}.${ball}`,
      striker,
      nonStriker,
      bowler,
      `R:${runs}`,
      `WD:${wideTotal}`,
      `NB:${nb}`,
      `B:${byes}`,
      `LB:${lb}`,
      wicket,
      `N:${notes}`,
    ].join('|');

    return fnv1a64Hex(signature);
  };

  const stableHash32 = (input) => {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const pick = (options, seed) => {
    if (!Array.isArray(options) || options.length === 0) return '';
    return options[stableHash32(seed) % options.length] || options[0];
  };

  const buildFallbackCommentary = ({ seed, runs, ex, wk }) => {
    if (wk?.hasWicket) {
      const outRole =
        wk.wicketType === 'Mankad (Run out at non-striker end)'
          ? ' (Non-striker)'
          : wk.outBatter === 'nonStriker'
            ? ' (Non-striker)'
            : '';
      const type = wk.wicketType ? ` (${wk.wicketType}${outRole})` : '';
      return pick(
        ['Wicket' + type + '.', 'Gone' + type + '! Big breakthrough.', 'Wicket falls' + type + '.'],
        `wicket:${seed}`,
      );
    }

    const lbRuns = ex?.hasLB ? Number(ex?.lbRuns) || 0 : 0;
    const byeRuns = ex?.hasByes ? Number(ex?.byesRuns) || 0 : 0;
    const wideRuns = ex?.hasWide ? 1 + (Number(ex?.wideExtraRuns) || 0) : 0;
    const hasNB = !!ex?.hasNoBall;

    const formatRunWord = (n) => `${n} ${n === 1 ? 'run' : 'runs'}`;

    if (wideRuns > 0) {
      return pick(
        [
          `Wide called. ${formatRunWord(wideRuns)} added.`,
          `Sprays it wide — ${formatRunWord(wideRuns)} to the batting side.`,
          `Down the wrong line, wide. ${formatRunWord(wideRuns)}.`,
        ],
        `wide:${seed}`,
      );
    }

    if (hasNB) {
      const base = pick(
        ['No-ball called. Free hit coming up.', 'Oversteps — no-ball. Free hit next.', 'No-ball. Extra run added.'],
        `nb:${seed}`,
      );
      if (lbRuns > 0) return `${base} Plus ${lbRuns} leg bye${lbRuns === 1 ? '' : 's'}.`;
      if (byeRuns > 0) return `${base} Plus ${byeRuns} bye${byeRuns === 1 ? '' : 's'}.`;
      if (runs > 0) return `${base} Plus ${formatRunWord(runs)}.`;
      return base;
    }

    if (lbRuns > 0) {
      return pick(
        [
          `Off the pads, ${lbRuns} leg bye${lbRuns === 1 ? '' : 's'}.`,
          `Clips the pad and they sneak ${lbRuns} leg bye${lbRuns === 1 ? '' : 's'}.`,
          `${lbRuns} leg bye${lbRuns === 1 ? '' : 's'} taken.`,
        ],
        `lb:${seed}`,
      );
    }

    if (byeRuns > 0) {
      return pick(
        [
          `Past the keeper, ${byeRuns} bye${byeRuns === 1 ? '' : 's'}.`,
          `${byeRuns} bye${byeRuns === 1 ? '' : 's'} taken.`,
          `They steal ${byeRuns} bye${byeRuns === 1 ? '' : 's'}.`,
        ],
        `byes:${seed}`,
      );
    }

    if (runs === 0) {
      return pick(['No run. Tidy delivery.', 'Dot ball. Good pressure.', 'Defended well — no run.'], `dot:${seed}`);
    }

    if (runs === 4) {
      return pick(['Four! Finds the boundary.', 'Cracked away for four.', 'Timed sweetly — four runs.'], `four:${seed}`);
    }

    if (runs === 6) {
      return pick(
        ['Six! Launched into the stands.', 'That is a maximum — six.', 'Sailed over the rope for six.'],
        `six:${seed}`,
      );
    }

    return pick(
      [`They take ${formatRunWord(runs)}.`, `${formatRunWord(runs)} picked up.`, `Good running — ${formatRunWord(runs)}.`],
      `runs:${seed}`,
    );
  };

  const extractJsonObject = (text) => {
    if (!text || typeof text !== 'string') return null;
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;

    // Try to extract the first {...} block
    const match = trimmed.match(/\{[\s\S]*\}/);
    return match ? match[0] : null;
  };

  const generateCommentaryWithOpenAI = async (events, apiKey, model) => {
    if (!apiKey || !Array.isArray(events) || events.length === 0) return {};

    const payload = events.map((e) => ({
      id: e.id,
      overBall: e.overBall,
      outcome: e.outcome,
      note: e.note,
    }));

    const prompt = [
      'Write short ball-by-ball cricket commentary.',
      'Return ONLY a JSON object mapping each "id" to a single-sentence commentary string.',
      'Rules:',
      '- Do not mention that AI is used.',
      '- No emojis.',
      '- Keep it under 120 characters per ball.',
      '- Do not repeat over/ball or player names (they are shown separately).',
      '- Use only the provided data; do not invent shots, fielders, or locations.',
      '',
      `INPUT JSON:\n${JSON.stringify(payload)}`,
    ].join('\n');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a professional cricket commentator.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: Math.min(2400, 200 + events.length * 20),
      }),
    });

    if (!response.ok) return {};
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const jsonText = extractJsonObject(content);
    if (!jsonText) return {};

    try {
      const parsed = JSON.parse(jsonText);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  try {
    // Support ?matchId=... for per-match table data
    const matchId = url.searchParams.get('matchId') || '';
    const withCommentary = url.searchParams.get('withCommentary') === '1';
    const key = matchId ? `ipl-live-score-${matchId}` : 'ipl-live-score';
    const value = await KV.get(key);
    if (!value) return new Response(JSON.stringify({ rows: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    let parsed;
    try {
      parsed = JSON.parse(value);
    } catch {
      // Legacy/raw payload: return as-is
      return new Response(value, { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (Array.isArray(parsed)) {
      return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const rows = Array.isArray(parsed?.rows) ? parsed.rows : [];
    const extrasData = parsed?.extrasData && typeof parsed.extrasData === 'object' ? parsed.extrasData : {};
    const wicketData = parsed?.wicketData && typeof parsed.wicketData === 'object' ? parsed.wicketData : {};

    if (!withCommentary) {
      return new Response(JSON.stringify({ rows, extrasData, wicketData }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const commentaryByBallKey =
      parsed?.commentaryByBallKey && typeof parsed.commentaryByBallKey === 'object' ? parsed.commentaryByBallKey : {};

    const commentaryData = {};
    const missing = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const innings = String(row?.[2] || '');
      if (innings !== '1' && innings !== '2') continue;

      const ex = { ...(extrasData[idx] || {}) };
      const wk = { ...(wicketData[idx] || {}) };
      const ballKey = getBallKey(row, ex, wk);

      const notes = String(row?.[12] || '').trim();
      if (notes) {
        commentaryData[idx] = notes;
        if (!commentaryByBallKey[ballKey]) commentaryByBallKey[ballKey] = notes;
        continue;
      }

      const existing = String(commentaryByBallKey[ballKey] || '').trim();
      if (existing) {
        commentaryData[idx] = existing;
        continue;
      }

      const over = row?.[0] || '';
      const ball = row?.[1] || '';
      const overBall = over && ball ? `${over}.${ball}` : '';
      const runs = Number.parseInt(String(row?.[6] || ''), 10) || 0;

      const wideTotal = ex.hasWide ? 1 + (Number(ex.wideExtraRuns) || 0) : 0;
      const nb = ex.hasNoBall ? 1 : 0;
      const byes = ex.hasByes ? Number(ex.byesRuns) || 0 : 0;
      const lb = ex.hasLB ? Number(ex.lbRuns) || 0 : 0;
      const wicketOutRole =
        wk?.wicketType === 'Mankad (Run out at non-striker end)'
          ? ' (Non-striker)'
          : wk?.outBatter === 'nonStriker'
            ? ' (Non-striker)'
            : '';
      const wicket =
        wk?.hasWicket ? `WICKET${wk.wicketType ? ` (${wk.wicketType}${wicketOutRole})` : ''}` : '';

      const outcomeParts = [];
      if (wicket) outcomeParts.push(wicket);
      if (wideTotal) outcomeParts.push(`WD ${wideTotal}`);
      if (nb) outcomeParts.push('NB +1');
      if (byes) outcomeParts.push(`B ${byes}`);
      if (lb) outcomeParts.push(`LB ${lb}`);
      if (!wideTotal) outcomeParts.push(`${runs} run${runs === 1 ? '' : 's'}`);

      missing.push({
        id: ballKey,
        idx,
        overBall,
        outcome: outcomeParts.filter(Boolean).join(', '),
        note: '',
        runs,
        ex,
        wk,
      });
    }

    if (missing.length > 0) {
      let generated = {};
      const apiKey = env.OPENAI_API_KEY;
      const model = env.OPENAI_LIVE_SCORE_MODEL || env.OPENAI_MODEL || 'gpt-4o-mini';

      if (apiKey) {
        try {
          // Batch into a single request; the prompt already contains structured JSON.
          generated = await generateCommentaryWithOpenAI(missing, apiKey, model);
        } catch {}
      }

      missing.forEach((m) => {
        const ai = generated && typeof generated === 'object' ? String(generated[m.id] || '').trim() : '';
        const seed = `${m.id}:${m.overBall}`;
        const finalText = ai || buildFallbackCommentary({ seed, runs: m.runs, ex: m.ex, wk: m.wk });
        commentaryData[m.idx] = finalText;
        commentaryByBallKey[m.id] = finalText;
      });

      parsed.commentaryByBallKey = commentaryByBallKey;
      await KV.put(key, JSON.stringify(parsed));
    }

    return new Response(
      JSON.stringify({ rows, extrasData, wicketData, commentaryData }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}

// Cloudflare Pages Function API route for saving IPL live score rows to KV
export const onRequestPost = async (context) => {
  const { request, env } = context;
  const KV = env.SPORTS_KV;
  if (!KV) {
    return new Response(JSON.stringify({ error: 'SPORTS_KV binding missing in env' }), { status: 500 });
  }
  try {
    const url = new URL(request.url);
    const matchId = url.searchParams.get('matchId') || '';
    const key = matchId ? `ipl-live-score-${matchId}` : 'ipl-live-score';
    const data = await request.json();

    // Preserve any existing commentary cache (keyed by ball signature) so we only generate for new balls.
    let existing = null;
    try {
      const raw = await KV.get(key);
      existing = raw ? JSON.parse(raw) : null;
    } catch {
      existing = null;
    }

    const commentaryByBallKey =
      existing?.commentaryByBallKey && typeof existing.commentaryByBallKey === 'object' ? existing.commentaryByBallKey : {};

    await KV.put(key, JSON.stringify({ ...data, commentaryByBallKey }));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
