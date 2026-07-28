import { NextResponse, NextRequest } from "next/server";
import { ZodSchema } from "zod";

export async function validateBody<T>(
    request: NextRequest,
    schema: ZodSchema<T>,
): Promise<{ data: T; error: Response | null }> {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return {
            data: null as unknown as T,
            error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
        };
    }

    const result = schema.safeParse(body);
    if (!result.success) {
        const errors = result.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
        }));
        return {
            data: null as unknown as T,
            error: NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 }),
        };
    }

    return { data: result.data, error: null };
}
