import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { mockDb } from '@/lib/mockDb';

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    
    // Check if Supabase env vars are placeholder values
    const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isMockMode) {
      return NextResponse.json(mockDb.getBrands());
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      // In local development/demo without Supabase, we fall back to mockDb
      return NextResponse.json(mockDb.getBrands());
    }

    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching brands from Supabase:', error);
      return NextResponse.json(mockDb.getBrands());
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Unhandled brands API error:', err);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, industry } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isMockMode) {
      const newBrand = mockDb.addBrand(name, industry);
      return NextResponse.json(newBrand, { status: 201 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      // Fallback for unauthorized demo POST
      const newBrand = mockDb.addBrand(name, industry);
      return NextResponse.json(newBrand, { status: 201 });
    }

    const { data, error } = await supabase
      .from('brands')
      .insert({
        name,
        industry,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating brand:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Unhandled POST brands API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

