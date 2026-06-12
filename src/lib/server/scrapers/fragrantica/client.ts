import logger from '$lib/server/logger';
import { getAlgoliaKey } from './api-key';

const log = logger.child({ scraper: 'fragrantica', module: 'client' });

const MIN_HOUSE_SCORE = 0.6;
const MIN_COMBINED_SCORE = 0.7;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSimilarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);

  const ta = new Set(na.split(' ').filter(Boolean));
  const tb = new Set(nb.split(' ').filter(Boolean));
  if (ta.size === 0 && tb.size === 0) return 1;
  if (ta.size === 0 || tb.size === 0) return 0;
  const intersection = [...ta].filter((t) => tb.has(t)).length;
  const tokenScore = intersection / Math.max(ta.size, tb.size);

  // Compound fallback: "Mont Blanc" vs "Montblanc" → strip spaces and compare
  const ca = na.replace(/\s+/g, '');
  const cb = nb.replace(/\s+/g, '');
  const compoundScore = ca === cb ? 1 : ca.includes(cb) || cb.includes(ca) ? 0.85 : 0;

  return Math.max(tokenScore, compoundScore);
}

function bestMatch(
  hits: Array<{ naslov: string; dizajner: string; picture: string; slug: string; objectID: string }>,
  name: string,
  house: string
) {
  const scored = hits
    .map((hit) => {
      const nameScore = tokenSimilarity(name, hit.naslov);
      const houseScore = tokenSimilarity(house, hit.dizajner);
      const combined = (nameScore + houseScore) / 2;
      return { hit, nameScore, houseScore, combined };
    })
    .filter((r) => r.houseScore >= MIN_HOUSE_SCORE)
    .sort((a, b) => b.combined - a.combined);

  const top = scored[0];
  if (!top || top.combined < MIN_COMBINED_SCORE) return null;
  return top;
}

export class FragranticaClient {
  baseUrl = 'https://fgvi612dfz-dsn.algolia.net';

  async searchFragrance(name: string, house: string) {
    const apiKey = await getAlgoliaKey();
    const apiEndpoint = '/1/indexes/*/queries';
    const queryParams = {
      'x-algolia-agent': 'Algolia for JavaScript (4.24.0); Browser (lite)',
      'x-algolia-api-key': apiKey,
      'x-algolia-application-id': 'FGVI612DFZ'
    };
    const headers = {
      Host: 'fgvi612dfz-dsn.algolia.net',
      Origin: 'https://www.fragrantica.com',
      Referer: 'https://www.fragrantica.com/'
    };

    const url = new URL(this.baseUrl + apiEndpoint);
    url.search = new URLSearchParams(queryParams).toString();

    const query = `${name} ${house}`;
    const body = {
      requests: [{ indexName: 'fragrantica_perfumes', query, params: 'hitsPerPage=5' }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      log.error({ status: response.status, data }, 'Algolia API error');
      return null;
    }

    const hits = data?.results?.[0]?.hits ?? [];
    if (!hits.length) {
      log.warn({ query }, 'No results from Algolia');
      return null;
    }

    const match = bestMatch(hits, name, house);
    if (!match) {
      log.warn(
        { query, candidates: hits.map((h: { naslov: string; dizajner: string }) => `${h.naslov} / ${h.dizajner}`) },
        'No hit passed matching thresholds'
      );
      return null;
    }

    log.info(
      { name: match.hit.naslov, house: match.hit.dizajner, nameScore: match.nameScore, houseScore: match.houseScore, combined: match.combined },
      'Fragrantica match accepted'
    );

    return {
      name: match.hit.naslov,
      house: match.hit.dizajner,
      image: match.hit.picture,
      fragrantica_url: `https://www.fragrantica.com/perfume/${match.hit.slug}-${match.hit.objectID}.html`
    };
  }
}
