import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. ถ้า Logic ของ Matcher ข้างล่างทำงานถูกต้อง
  // โค้ดในนี้จะ "ไม่มีวันทำงาน" เมื่อเข้าหน้า /gallery ครับ
  
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // กฎเหล็ก: เฉพาะ Admin เท่านั้นที่ต้องตรวจ
  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  // 👇 จุดสำคัญที่สุดอยู่ตรงนี้! 👇
  // ผมเพิ่ม |gallery เข้าไป เพื่อบอกว่า "ห้ามยุ่งกับหน้านี้เด็ดขาด"
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|gallery).*)',
  ],
}