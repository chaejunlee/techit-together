import {Course, OrganizedData} from "@/app/api/courses/[id]/route";
import {kv} from "@vercel/kv";

export default async function CourseData({id}: {id: string}) {
  const data = await fetchData(id);

  return (
    <div>
      {Object.entries(data).map(([id, courses]) => {
        const course = courses["univ_frontend"] as any;
        const lectures = course["course"];
        return (
          <div key={id}>
            <h2>{id}</h2>
            {JSON.stringify(lectures)}
          </div>
        );
      })}
    </div>
  );
}

export async function fetchData(id: string) {
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

  return organizedData;
}
