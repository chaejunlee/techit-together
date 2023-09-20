import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const id = params.id;
    const classMembers = kv.get(id);

    return NextResponse.json(classMembers);
}

export interface Lecture {
    title: string;
    finished: boolean;
}

export interface Course {
    title: string;
    lectures: Array<Lecture>;
}

export interface Courses {
    name: string;
    email: string;
    courses: Array<Course>;
}
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const json = await request.json() as Courses;

    try {
        kv.set(params.id, json);
    } catch (e) {
        return NextResponse.json({ success: false }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
}
