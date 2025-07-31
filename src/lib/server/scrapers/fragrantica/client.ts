export class FragranticaClient {
  baseUrl = 'https://fgvi612dfz-dsn.algolia.net';

  headers = {
    Host: 'fgvi612dfz-dsn.algolia.net',
    Origin: 'https://www.fragrantica.com',
    Referer: 'https://www.fragrantica.com/'
  };

  async searchFragrance(query: string) {
    const apiEndpoint = '/1/indexes/*/queries';
    const queryParams = {
      'x-algolia-agent': 'Algolia for JavaScript (4.24.0); Browser (lite)',
      'x-algolia-api-key':
        'MTI2NzBhZjQwN2M0MTQ3NzVkZmJlZjU3MmJjNmFkNGE5NjQwMTY0MWMwZDJkM2RiOWY4NDI1ODQxOTE2YmVkYXZhbGlkVW50aWw9MTc1NDE0NjYyOA==',
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

    if (!data || !data.results || !data.results[0].hits) {
      console.warn('No results found for query:', query);
      return null;
    }
    const [hit] = data.results[0].hits;

    console.log(hit);
    if (!hit) {
      console.warn('No results found for query:', query);
      return null;
    }

    return {
      name: hit.naslov,
      house: hit.dizajner,
      image: hit.picture,
      fragrantica_url: hit.url['EN'][0]
    };
  }
}
