import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseUrl = 'https://gaasfmgwkrjjjzfxsyao.supabase.co';
  private supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYXNmbWd3a3Jqamp6ZnhzeWFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMDI4MTUsImV4cCI6MjA1ODU3ODgxNX0.XerUzbNEePGFBOxoIJ3sz9clgcLdN8Z5SjitrwE-avo';

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);
  }

  async uploadImage(file: File, bucket: string) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(`imagenes/${file.name}`, file, { upsert: true });

    if (error) throw error;
    return data;
  }

  async getPublicUrl(bucket: string, path: string) {
    return this.supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
}