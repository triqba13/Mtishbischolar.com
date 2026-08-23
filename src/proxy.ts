import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh user session securely
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Handle /admin/login for already-authenticated staff
  if (pathname === '/admin/login') {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      const role = profile?.role;
      if (role === 'admission_officer') {
        return NextResponse.redirect(new URL('/admin/admission/dashboard', request.url));
      } else if (role === 'finance_officer') {
        return NextResponse.redirect(new URL('/admin/finance/dashboard', request.url));
      } else if (role === 'super_admin') {
        return NextResponse.redirect(new URL('/admin/super/dashboard', request.url));
      }
    }
    return response;
  }

  // 2. Protect all other /admin routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Query user role from public.profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role;

    // Reject students immediately
    if (role === 'student') {
      const studentUrl = new URL('/student/dashboard', request.url);
      studentUrl.searchParams.set('error', 'unauthorized_admin');
      return NextResponse.redirect(studentUrl);
    }

    // Reject unknown roles
    if (!role || !['super_admin', 'admission_officer', 'finance_officer'].includes(role)) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('error', 'invalid_role');
      return NextResponse.redirect(loginUrl);
    }

    // Role-specific routing:
    // A. Root /admin or /admin/
    if (pathname === '/admin' || pathname === '/admin/') {
      if (role === 'admission_officer') {
        return NextResponse.redirect(new URL('/admin/admission/dashboard', request.url));
      } else if (role === 'finance_officer') {
        return NextResponse.redirect(new URL('/admin/finance/dashboard', request.url));
      } else if (role === 'super_admin') {
        return NextResponse.redirect(new URL('/admin/super/dashboard', request.url));
      }
    }

    // B. Admission routes: /admin/admission/*
    if (pathname.startsWith('/admin/admission')) {
      if (role !== 'admission_officer' && role !== 'super_admin') {
        return NextResponse.redirect(new URL('/admin/finance/dashboard', request.url));
      }
    }

    // C. Finance routes: /admin/finance/*
    if (pathname.startsWith('/admin/finance')) {
      if (role !== 'finance_officer' && role !== 'super_admin') {
        return NextResponse.redirect(new URL('/admin/admission/dashboard', request.url));
      }
    }

    // D. Super Admin routes: /admin/super/*
    if (pathname.startsWith('/admin/super')) {
      if (role !== 'super_admin') {
        const dest = role === 'finance_officer' ? '/admin/finance/dashboard' : '/admin/admission/dashboard';
        return NextResponse.redirect(new URL(dest, request.url));
      }
    }
  }

  // 3. Protect all /student routes
  if (pathname.startsWith('/student')) {
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Query user role from public.profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role;

    // Allow student access
    if (role === 'student') {
      return response;
    }

    // Direct officers and admins to their respective dashboards
    if (role === 'admission_officer') {
      return NextResponse.redirect(new URL('/admin/admission/dashboard?error=unauthorized_student_portal', request.url));
    } else if (role === 'finance_officer') {
      return NextResponse.redirect(new URL('/admin/finance/dashboard?error=unauthorized_student_portal', request.url));
    } else if (role === 'super_admin') {
      return NextResponse.redirect(new URL('/admin/super/dashboard?error=unauthorized_student_portal', request.url));
    }

    // Reject missing or unknown roles
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('error', 'invalid_role');
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/student/:path*',
  ],
};