import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwlfmqpwuapiyvublvaa.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseServiceKey) return null;
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return _supabase;
}
