import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. สร้าง Response เตรียมไว้
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. สร้าง Supabase Client สำหรับตรวจสอบสิทธิ์
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. ดึงข้อมูล User ปัจจุบัน
  const { data: { user } } = await supabase.auth.getUser()

  // 4. กฏเหล็ก (Logic การป้องกัน)
  
  // ⛔ ถ้าจะเข้าหน้า Admin แต่ยังไม่ได้ Login -> ดีดไปหน้า Login
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🔄 ถ้า Login แล้ว แต่อยากจะเข้าหน้า Login อีก -> ดีดกลับไปหน้า Admin
  if (request.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/admin/create', request.url))
  }

  return response
}

// กำหนดว่า Middleware นี้จะทำงานเฉพาะหน้าที่ระบุ
export const config = {
  matcher: [
    '/admin/:path*', // ทุกหน้าใน admin
    '/login',        // หน้า login
  ],
}