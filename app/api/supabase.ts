import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import cookie from "cookie";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const AUTHEN_PAGE = process.env.AUTHEN_PAGE!;

export async function handle(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  // Parse cookies using the 'cookie' library
  const cookies = cookie.parse(req.headers.get("cookie") || "");
  const authToken = cookies["sb-zzgkylsbdgwoohcbompi-auth-token"];

  console.log("[Supabase] authToken", authToken);

  if (!authToken) {
    return NextResponse.redirect(AUTHEN_PAGE, 302);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.getUser();

    console.log("[Supabase] user", data?.user);

    if (error || !data?.user) {
      return NextResponse.json(
        { error: error?.message || "Error fetching user data" },
        { status: 401 },
      );
    }

    return NextResponse.json({ user: data.user }, { status: 200 });
  } catch (err) {
    console.error("Error fetching user data from Supabase:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
