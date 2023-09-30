async function getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    return tab;
}

function parseData(obj) {
    return obj.result;
}

async function getToken(key) {
    const token = await chrome.storage.session.get([key]);
    return token[key];
}

async function getCourse(url) {
    try {
        const auth = await getToken("access_token");
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

async function getUserInfo() {
    const user = await getToken("persist:globWebPersistedStore");
    const { name, email } = JSON.parse(JSON.parse(user).auth).profile;

    return { name, email };
}

async function getProgress() {
    const user = getUserInfo();

    try {
        const tab = await getCurrentTab();
        const courseId = tab.url.split("/")[5];

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

function getClassroomId() {
    const input = document.querySelector(".classroom");
    return input.value;
}

async function buttonClick() {
    try {
        const progress = await getProgress();
        const id = getClassroomId();

        console.log(id);
        window.localStorage.setItem("techit_likelion_classroom", id);

        await fetch(`https://techit-together.vercel.app/api/courses/${id}`, {
            method: 'POST',
            mode: "no-cors",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(progress),
        })
    } catch (e) {
        alert(e.message);
    }

}

const button = document.querySelector(".btn");
button.addEventListener("click", () => buttonClick());

(async () => {
    const input = document.querySelector(".classroom");

    const classroom = window.localStorage.getItem("techit_likelion_classroom");
    console.log(classroom);
    if (classroom) {
        input.value = classroom;
    }
})()