import * as cheerio from 'cheerio';
import type { Database } from '../../supabase/types';
import { supabase } from '$lib/server/supabase/client.js';

type Perfume = Database['public']['Tables']['perfumes']['Row'];
type PerfumeInventory = Database['public']['Tables']['perfume_inventory']['Row'];

type PerfumeData = {
  perfume: Partial<Perfume>;
  inventory: Partial<PerfumeInventory>[];
};
const descriptionAttributes: {
  [description: string]: { concentration: string; is_tester: boolean };
} = {
  'Парфюмна вода за мъже EDP': { concentration: 'EDP', is_tester: false },
  'Тоалетна вода за мъже EDT': { concentration: 'EDT', is_tester: false },
  'Парфюм за мъже': { concentration: 'Perfume', is_tester: false },
  'Унисекс парфюмна вода EDP': { concentration: 'EDP', is_tester: false },
  'Парфюмна вода': { concentration: 'EDP', is_tester: false },
  'Тоалетна вода за жени EDT': { concentration: 'EDT', is_tester: false },
  'Унисекс тоалетна вода EDT': { concentration: 'EDT', is_tester: false },
  'Парфюмен екстракт': { concentration: 'Extrait', is_tester: false },
  'Парфюмен екстракт за мъже': { concentration: 'Extrait', is_tester: false },
  'Парфюмен екстракт без опаковка': { concentration: 'Extrait', is_tester: true },
  'Парфюм за жени': { concentration: 'Perfume', is_tester: false },
  'Унисекс парфюмен екстракт': { concentration: 'Extrait', is_tester: false },
  'Парфюмна вода за жени': { concentration: 'EDP', is_tester: false },
  'Парфюмна вода за жени EDP': { concentration: 'EDP', is_tester: false },
  'Тоалетна вода': { concentration: 'EDT', is_tester: false },
  'Унисекс парфюмна вода': { concentration: 'EDP', is_tester: false },
  Парфюм: { concentration: 'Perfume', is_tester: false },
  'Парфюмна вода за мъже': { concentration: 'EDP', is_tester: false },
  'Парфюмен екстракт за жени': { concentration: 'Extrait', is_tester: false },
  'Тоалетна вода за мъже': { concentration: 'EDT', is_tester: false },
  'Одеколон за мъже EDC': { concentration: 'EDC', is_tester: false },
  'Одеколон за мъже': { concentration: 'EDC', is_tester: false }
};

export class ParfiumbgScraper {
  totalPages: number = 0;

  async scrape() {
    this.totalPages = await this.getTotalPages();
    console.log('Total pages:', this.totalPages);

    for (let page = 1; page <= this.totalPages; page++) {
      console.log('Scraping page:', page);

      await this.getPerfumes(page);

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  async scrapeOne(url: string) {
    const perfumeData: PerfumeData = {
      perfume: {},
      inventory: []
    };

    await this.extractPerfumeDetails(url, perfumeData);

    this.processor(perfumeData);
  }

  async getPerfumes(page: number) {
    const data = await this.requestPerfumes(page);
    const $ = cheerio.load(data['product_list_html']);

    for (const product of $('.js-product')) {
      const perfumeData: PerfumeData = {
        perfume: {},
        inventory: []
      };

      const productElement = $(product);

      const detailsUrl = productElement.find('a.thumbnail').attr('href') || '';

      await this.extractPerfumeDetails(detailsUrl, perfumeData);

      this.processor(perfumeData);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  async getTotalPages(): Promise<any> {
    const data = await this.requestPerfumes();
    return Math.ceil(data.products_num / 20);
  }

  async extractPerfumeDetails(url: string, perfume: PerfumeData) {
    try {
      // Fetch the HTML content of the page
      const response = await fetch(url);
      const html = await response.text();

      // Load the HTML into cheerio
      const $ = cheerio.load(html);

      const house = $('.product-name-manufacturer a').text().trim();
      const name = $('.product-name-middle').text().trim();
      const description = $('.product-name-type').text().trim();

      const { concentration, is_tester } = this.parseDescription(description);

      // Extract gender
      let gender = $('.feature-group-11 .feature-value').text().trim();
      gender = this.normalizeGender(gender);

      perfume.perfume.name = name;
      perfume.perfume.house = house;
      perfume.perfume.concentration = concentration;
      perfume.perfume.gender = gender;
      // Extract available sizes and prices
      const inventory: Partial<PerfumeInventory>[] = [];
      $('#group_1 .input-container').each((_, element) => {
        const availability = $(element).find('.variant-availability').text().trim();

        if (availability === 'Изчерпан') return;

        // Leave only the number from the volume
        const volume = $(element).find('.attr-name').text().trim().replace(/\D/g, '');
        const price = $(element).find('.variant-price').text().trim().replace(/\D/g, '');

        inventory.push({
          volume: +volume,
          price: +price / 100,
          website: 'parfiumbg',
          is_tester,
          url
        });
      });

      perfume.perfume.gender = gender;
      perfume.inventory = inventory;
    } catch (error) {
      console.error('Error scraping product:', (error as Error).message);
      return null;
    }
  }

  parseDescription(description: string) {
    const attributes = descriptionAttributes[description];
    if (!attributes) {
      console.error('Unknown description:', description);
      return { concentration: '', is_tester: false };
    }

    if (description.includes('без опаковка')) {
      attributes.is_tester = true;
    }

    return attributes;
  }

  async processor({ perfume, inventory }: PerfumeData) {
    const response = await supabase
      .from('perfumes')
      .upsert(perfume as Perfume, { onConflict: 'name, house, gender, concentration' })
      .select();
    const perfumeId = response.data && response.data[0].id;

    if (!perfumeId) {
      console.error('Upsert failed for perfume. No data returned', perfume);
      return;
    }

    // Bulk Upsert perfume inventory
    const inventoryWithPerfumeId = inventory.map((item) => ({ ...item, perfume_id: perfumeId }));
    console.log('Upserting inventory:', inventoryWithPerfumeId);
    await supabase.from('perfume_inventory').upsert(inventoryWithPerfumeId as PerfumeInventory[], {
      onConflict: 'perfume_id, volume, website'
    });
  }

  normalizeGender(gender: string): string {
    if (gender === 'Мъжки') {
      return 'men';
    }
    if (gender === 'Дамски') {
      return 'women';
    }
    if (gender === 'Унисекс') {
      return 'unisex';
    }
    console.error('Unknown gender');
    return 'unisex';
  }
  async requestPerfumes(page: number = 1) {
    const url = 'https://parfium.bg/module/amazzingfilter/ajax?ajax=1';

    const formData = new FormData();
    formData.append('action', 'getFilteredProducts');
    formData.append(
      'params',
      `page=${page}&` +
      'id_category=11&id_manufacturer=0&id_supplier=0&nb_items=20&controller_product_ids=&current_controller=category&page_name=category&orderBy=sales&orderWay=desc'
    );

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    // Use text() to get the response as plain text
    const data = await response.json();
    data['product_list_html'] = this.utf8_decode(data['product_list_html']);

    return data;
  }

  utf8_decode(utfstr: string) {
    var res = '';
    for (var i = 0; i < utfstr.length;) {
      var c = utfstr.charCodeAt(i);
      if (c < 128) {
        res += String.fromCharCode(c);
        i++;
      } else if (c > 191 && c < 224) {
        var c1 = utfstr.charCodeAt(i + 1);
        res += String.fromCharCode(((c & 31) << 6) | (c1 & 63));
        i += 2;
      } else {
        var c1 = utfstr.charCodeAt(i + 1);
        var c2 = utfstr.charCodeAt(i + 2);
        res += String.fromCharCode(((c & 15) << 12) | ((c1 & 63) << 6) | (c2 & 63));
        i += 3;
      }
    }
    return res;
  }
}
