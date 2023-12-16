async function getProgress() {
    const user = await getUserInfo();

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

async function getUserInfo() {
    const userJSON = await getToken('persist:globWebPersistedStore');
    const user = JSON.parse(userJSON);
    console.log(user);
    const auth = user.auth;
    const profile = JSON.parse(auth).profile

    console.log(user, auth, profile);
    const { name, email } = profile;

    return { name, email };
}

async function getToken(key) {
    const token = await chrome.storage.session.get([key]);
    return token[key];
}

async function getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    return tab;
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

function parseData(obj) {
    return obj.result;
}

function getClassroomId() {
    const input = document.querySelector(".classroom");
    return input.value;
}

async function buttonClick() {
    try {
        const progress = await getProgress();
        const id = getClassroomId();

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
button.setAttribute("disabled", true);

const goToDashboard = document.querySelector(".go-to-dashboard");
goToDashboard.setAttribute("disabled", true);
goToDashboard.addEventListener("click", () => {
    const classroom = getClassroomId();
    if (classroom) {
        chrome.tabs.create({ url: "https://techit-together.vercel.app/api/courses/" + classroom });
    }
});

const input = document.querySelector(".classroom");
input.addEventListener("input", () => {
    if (input.value.length > 0) {
        button.removeAttribute("disabled");
        goToDashboard.removeAttribute("disabled");
    } else {
        button.setAttribute("disabled", true);
        goToDashboard.setAttribute("disabled", true);
    }
});

const classroom = window.localStorage.getItem("techit_likelion_classroom");
if (classroom) {
    input.value = classroom;
    button.removeAttribute("disabled");
    goToDashboard.removeAttribute("disabled");
}

(async () => {
    console.log("hi");
    try {
        const { name } = await getUserInfo();
        const yourname = document.querySelector(".your-name");
        yourname.innerText = name;
    } catch (e) {
        window.console.log(e);
    }
})()