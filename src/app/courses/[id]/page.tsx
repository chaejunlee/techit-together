import {useParams} from "next/navigation";
import CourseData from "./_course-data";

export default function Page({params}: {params: {id: string}}) {
  console.log(params);
  return (
    <div>
      <CourseData id={params.id} />
    </div>
  );
}
