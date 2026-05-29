import logger from '$lib/server/logger';
import { getAlgoliaKey } from './api-key';

const log = logger.child({ scraper: 'fragrantica', module: 'client' });

export class FragranticaClient {
  baseUrl = 'https://fgvi612dfz-dsn.algolia.net';

  async searchFragrance(query: string) {
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

    const body = {
      requests: [{ indexName: 'fragrantica_perfumes', query, params: 'hitsPerPage=1' }]
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

    if (!data?.results?.[0]?.hits?.length) {
      log.warn({ query }, 'No results found for query');
      return null;
    }
    const [hit] = data.results[0].hits;

    log.info({ hit }, 'Fragrantica search result');
    if (!hit) {
      log.warn({ query }, 'No results found for query');
      return null;
    }

    return {
      name: hit.naslov,
      house: hit.dizajner,
      image: hit.picture,
      fragrantica_url: `https://www.fragrantica.com/perfume/${hit.slug}-${hit.objectID}.html`
    };
  }
}
