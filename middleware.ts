import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect app routes
        if (req.nextUrl.pathname.startsWith("/app")) {
          return !!token;
        }
        
        // Protect admin routes
        if (req.nextUrl.pathname.startsWith("/admin")) {
          return token?.role === "ADMIN" || token?.role === "SUPER_ADMIN";
        }
        
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"]
};