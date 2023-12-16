import {NextRequest, NextResponse} from "next/server";
import {kv} from "@vercel/kv";

export interface OrganizedData {
  [key: string]: {
    [key: string]: Course;
  };
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

export interface PostCourses {
  name: string;
  email: string;
  title: string;
  code: string;
  course: Course;
}

export async function GET(request: Request, {params}: {params: {id: string}}) {
  const id = params.id;
  const memberAndCourses = await kv.lrange(id, 0, -1);

  let organizedData = {} as OrganizedData;

  for (const memberAndCourse of memberAndCourses) {
    const courseDetailofMember = (await kv.get(memberAndCourse)) as Course;
    const [member, course] = memberAndCourse.split(":") as string[];

    if (!Object.keys(organizedData).includes(member)) {
      const courseObj = {
        [course]: courseDetailofMember,
      };

      organizedData[member] = courseObj;
    } else {
      organizedData[member][course] = courseDetailofMember;
    }
  }

  return NextResponse.json(organizedData);
}

export async function POST(
  request: NextRequest,
  {params}: {params: {id: string}}
) {
  const json = (await request.json()) as PostCourses;
  const emailAndCourseCode = `${json.email}:${json.code}`;

  try {
    const classLength = await kv.llen(params.id);

    if (
      !json.email ||
      !json.name ||
      !json.title ||
      !json.code ||
      !json.course
    ) {
      return NextResponse.json(
        {success: false, error: "Missing fields"},
        {status: 400}
      );
    }

    if (classLength === 0) {
      await kv.lpush(params.id, emailAndCourseCode);
    } else {
      const inClass = await kv.lrange(params.id, 0, -1);

      if (!inClass.includes(emailAndCourseCode))
        await kv.lpush(params.id, emailAndCourseCode);
    }

    await kv.set(emailAndCourseCode, json);
  } catch (e) {
    return NextResponse.json({success: false, error: e}, {status: 400});
  }

  return NextResponse.json({success: true}, {status: 200});
}
