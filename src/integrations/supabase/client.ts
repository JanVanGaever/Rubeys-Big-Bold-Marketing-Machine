import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bcrihwfhrhciurjkjecl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjcmlod2ZocmhjaXVyamtqZWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMDE2OTEsImV4cCI6MjA5MTU3NzY5MX0.Jb2WD7AzCLR9AqzqQM7d_tRjL0XZ7DKgt55NUUP2KLg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
