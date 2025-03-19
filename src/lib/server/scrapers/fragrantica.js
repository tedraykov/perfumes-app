/**
 * @typedef {import("$lib/server/appwrite/codegen").PerfumeEntusiastsPerfumeType} Perfume
 */

class FragranticaClient {
  baseUrl = 'https://fgvi612dfz-dsn.algolia.net';

  headers = {
    Host: 'fgvi612dfz-dsn.algolia.net',
    Origin: 'https://www.fragrantica.com',
    Referer: 'https://www.fragrantica.com/'
  };

  /**
   * @param {string} query
   */
  async searchFragrance(query) {
    const apiEndpoint = '/1/indexes/*/queries';
    const queryParams = {
      'x-algolia-agent': 'Algolia for JavaScript (4.24.0); Browser (lite)',
      'x-algolia-api-key':
        'YmIxNWYwZjc2NGU2OTk2ODE2MGYxODQwZTNiYTJjOGFjODUyYjdjY2VmODcwNDMxODgzMWExNTVjMTkyZjRkMHZhbGlkVW50aWw9MTczMzMwNzU3OQ==',
      'x-algolia-application-id': 'FGVI612DFZ'
    };

    const url = new URL(this.baseUrl + apiEndpoint);
    url.search = new URLSearchParams(queryParams).toString();

    const body = {
      requests: [{ indexName: 'fragrantica_perfumes', query, params: 'hitsPerPage=1' }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body)
    });

    // example response:
    const data = await response.json();

    const hit = data?.results[0]?.hits[0];

    if (!hit) {
      console.warn('No results found for query:', query);
      return null;
    }

    return {
      name: hit.naslov,
      house: hit.dizajner,
      image: hit.picture,
      notes: hit.ingredients['EN'].map((note) => ({ name: note })),
      fragrantica_url: hit.url['EN'][0]
    };
  }
}

const client = new FragranticaClient();

/**
 * @param {Perfume} input
 */
async function findPerfume(input) {
  const perfume = await client.searchFragrance(input.name);

  console.log('Perfume:', perfume);
}
