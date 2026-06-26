import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

// Mock brands fallback for demo/unconfigured states
const MOCK_BRANDS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Acme Brand', industry: 'SaaS', created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Indie Creator', industry: 'Content Creation', created_at: new Date().toISOString() },
];

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    
    // Check if Supabase env vars are placeholder values
    const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

    if (isMockMode) {
      return NextResponse.json(MOCK_BRANDS);
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      // In local development/demo, if not logged in, we can fall back to mock data
      return NextResponse.json(MOCK_BRANDS);
    }

    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching brands:', error);
      return NextResponse.json(MOCK_BRANDS);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Unhandled brands API error:', err);
    return NextResponse.json(MOCK_BRANDS);
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
      const newBrand = {
        id: Math.random().toString(36).substring(2, 15),
        name,
        industry: industry || 'General',
        created_at: new Date().toISOString(),
      };
      return NextResponse.json(newBrand, { status: 201 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
