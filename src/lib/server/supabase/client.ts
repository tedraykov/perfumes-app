import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_KEY, SUPABASE_URL } from '$env/static/private';
import type { Database } from './types';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);
