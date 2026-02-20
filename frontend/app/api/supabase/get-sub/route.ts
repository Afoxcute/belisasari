export const dynamic = 'force-dynamic';

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_ANON_SECRET || ""
    );

    const { data, error } = await supabase
      .from("subs")
      .select("expires")
      .eq("address", address)
      .single();

    if (error) {
      // PGRST205 = table not in schema cache (subs table missing)
      const code = (error as { code?: string }).code;
      const message = (error as { message?: string }).message ?? "";
      if (code === "PGRST205" || message.includes("Could not find the table") || message.includes("subs")) {
        return NextResponse.json({ expires: null });
      }
      console.error("Error fetching data:", error);
      return NextResponse.json(
        { error: "Failed to fetch subscription data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ expires: data?.expires ?? null });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
