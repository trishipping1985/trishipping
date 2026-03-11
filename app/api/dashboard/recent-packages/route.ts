import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json([
    {
      id: "1",
      status: "Received",
      created_at: new Date().toISOString(),
      customer_name: "Test Customer",
    },
  ])
}
