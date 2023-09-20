async function getCourse(url) {
    try {
        const auth = localStorage.getItem("access_token");
        const response = await fetch("https://api.techit.education/api/my/progress/v1/" + url, { headers: { "Authorization": `Bearer ${auth}` } });
        const lectures = await response.json();
        const reducedLectures = lectures.reduce((acc, cur) => { acc.push(...cur.resources); return acc }, []);
        const formattedLectures = reducedLectures.map(el => ({ title: el.title, finished: el.is_completed }))

        return formattedLectures;
    } catch (e) {
        throw new Error("course")
    }
}

async function getCourseTitle(courseId) {
    try {
        const rawCourseList = await fetch(`https://api.techit.education/api/course/v1/courses/${courseId}/sections`);
        const courseList = await rawCourseList.json();

        return courseList.title;
    } catch (e) {
        throw new Error("course title")
    }
}

function getUserInfo() {
    const user = localStorage.getItem("persist:globWebPersistedStore");
    const { name, email } = JSON.parse(JSON.parse(user).auth).profile;

    return { name, email };
}

async function getProgress() {
    const user = getUserInfo();

    try {
        const courseId = location.pathname.split("/")[3];

        const courseTitle = await getCourseTitle(courseId);
        const course = await getCourse(courseId);

        const progress = {
            ...user,
            title: courseTitle,
            code: courseId,
            course
        }

        return progress;
    } catch (e) {
        throw new Error(`Cannot get ${e.message}`);
    }
}

function uuid() {
    return "123";
}

(async () => {
    const progress = await getProgress();
    const id = uuid();

    fetch(`https://techit-together.vercel.app/api/courses/${id}`, {
        method: 'POST',
        mode: "no-cors",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(progress),
    })
})()

