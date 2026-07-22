import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ⚡ FIX: Using a 'default' export bypasses the strict Next.js naming parser
export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()
  
  const pathname = request.nextUrl.pathname
  const role = user?.user_metadata?.role

  // 1. PUBLIC ASSETS & LOGIN EXCEPTION
  const isLoginRoute = pathname.endsWith('/login')
  
  if (isLoginRoute) {
    if (user) {
      if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url)) 
      if (role === 'judge') return NextResponse.redirect(new URL('/judge', request.url))
      if (role === 'media') return NextResponse.redirect(new URL('/media/dashboard', request.url))
    }
    return response
  }

  // 2. PROTECT ADMIN
  if (pathname.startsWith('/admin')) {
    if (!user || role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // 3. PROTECT JUDGE
  if (pathname.startsWith('/judge')) {
    if (!user || (role !== 'judge' && role !== 'admin')) {
      return NextResponse.redirect(new URL('/judge/login', request.url))
    }
  }

  // 4. PROTECT MEDIA
  if (pathname.startsWith('/media')) {
    if (!user || (role !== 'media' && role !== 'admin')) {
      return NextResponse.redirect(new URL('/media/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/judge/:path*', '/media/:path*'],
}