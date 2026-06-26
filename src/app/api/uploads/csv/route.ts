import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import Papa from 'papaparse';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const brandId = formData.get('brandId') as string | null;

    if (!file || !brandId) {
      return NextResponse.json({ error: 'Missing file or brandId' }, { status: 400 });
    }

    const csvText = await file.text();
    
    // Parse CSV with PapaParse
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    if (parsed.errors && parsed.errors.length > 0) {
      console.warn('CSV parsing warnings/errors:', parsed.errors);
    }

    const rows = parsed.data as any[];
    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isMockMode) {
      // In mock/unconfigured mode, we simulate successful import and return row count
      return NextResponse.json({
        success: true,
        importedCount: rows.length,
        message: `Successfully processed ${rows.length} rows of metrics in Demo Mode!`
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process rows sequentially or in batches
    let importedCount = 0;
    
    for (const row of rows) {
      const platform = (row.platform || 'csv_upload').toLowerCase();
      const handle = row.handle || 'imported_account';
      const date = row.date; // YYYY-MM-DD
      const followers = Number(row.followers || row.subscribers || 0);
      const impressions = Number(row.impressions || row.views || 0);
      const engagements = Number(row.engagements || row.likes || 0);
      const engagementRate = row.engagement_rate || (impressions > 0 ? (engagements / impressions) * 100 : 0);
      const sentimentScore = row.sentiment !== undefined ? Number(row.sentiment) : null;

      if (!date) continue; // Skip invalid rows

      // 1. Get or create platform account
      let { data: account, error: accErr } = await supabase
        .from('platform_accounts')
        .select('id')
        .eq('brand_id', brandId)
        .eq('platform', platform)
        .eq('handle', handle)
        .maybeSingle();

      if (accErr) {
        console.error('Error fetching platform account:', accErr);
        continue;
      }

      if (!account) {
        // Create platform account
        const { data: newAcc, error: createAccErr } = await supabase
          .from('platform_accounts')
          .insert({
            brand_id: brandId,
            platform,
            handle,
            external_id: `csv-${handle}-${platform}`
          })
          .select('id')
          .single();

        if (createAccErr || !newAcc) {
          console.error('Error creating platform account:', createAccErr);
          continue;
        }
        account = newAcc;
      }

      // 2. Upsert daily aggregate
      const { error: upsertErr } = await supabase
        .from('daily_aggregates')
        .upsert({
          platform_account_id: account.id,
          date,
          followers,
          impressions,
          engagements,
          engagement_rate: parseFloat(Number(engagementRate).toFixed(4)),
          sentiment_score_avg: sentimentScore,
          extra: { source: 'csv_upload_import' }
        }, {
          onConflict: 'platform_account_id, date'
        });

      if (upsertErr) {
        console.error(`Error upserting aggregate for ${date}:`, upsertErr);
      } else {
        importedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      message: `Successfully imported ${importedCount} out of ${rows.length} rows!`
    });
  } catch (err: any) {
    console.error('CSV upload endpoint error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
