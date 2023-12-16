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
    const auth = user.auth;
    const profile = JSON.parse(auth).profile

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

function getTeamId() {
    const input = document.querySelector(".team");
    return input.value;
}

const button = document.querySelector(".btn");
button.addEventListener("click", () => buttonClick());
button.setAttribute("disabled", true);
const SYNC_BUTTON_CONTENT = "Sync";

async function buttonClick() {
    try {
        button.innerHTML = SYNC_BUTTON_CONTENT + '<span class="spin ml-2">🔄</span>';

        const progress = await getProgress();
        const id = getTeamId();

        window.localStorage.setItem("techit_likelion_team", id);

        const res = await fetch(`https://techit-together.vercel.app/api/courses/${id}`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(progress),
        })

        const data = await res.json();

        if (data?.success) {
            button.innerHTML = SYNC_BUTTON_CONTENT + '<span class="ml-2">✅</span>';

            const completed = progress.course.filter(v => v.finished).length;
            const total = progress.course.length;
            const percentage = Math.floor(completed / total * 100);
            const message = `🎉 ${progress.name}님의 ${progress.title} 강의 ${completed}/${total}개 완료! (${percentage}%)`;

            alert(message);
        } else {
            button.innerHTML = SYNC_BUTTON_CONTENT + '<span class="ml-2">❌</span>';
        }
    } catch (e) {
        button.innerHTML = SYNC_BUTTON_CONTENT + '<span class="ml-2">❌</span>';
    }
}

const goToDashboard = document.querySelector(".go-to-dashboard");
goToDashboard.setAttribute("disabled", true);
goToDashboard.addEventListener("click", () => {
    const team = getTeamId();
    if (team) {
        chrome.tabs.create({ url: "https://techit-together.vercel.app/api/courses/" + team });
    }
});

const input = document.querySelector(".team");
input.addEventListener("input", () => {
    if (input.value.length > 0) {
        button.removeAttribute("disabled");
        goToDashboard.removeAttribute("disabled");
    } else {
        button.setAttribute("disabled", true);
        goToDashboard.setAttribute("disabled", true);
    }
});

async function getTeamList(team) {
    const res = await new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(["aaaaaaaaaa", "aab", "aabbbccccc"]);
        }, 100)
    });
    return res.filter(data => {
        return data.includes(team)
    })
}

/**
 * @type {HTMLUListElement}
 */
const dropdown = document.querySelector(".dropdown-menu");
const dropdownResizeObserver = new ResizeObserver((entries) => {
    const { height } = entries[0].contentRect;
    if (height > 0) {
        dropdown.style.border = "1px solid #ced4da";
    } else {
        dropdown.style.border = "none";
    }
});
dropdownResizeObserver.observe(dropdown);

input.addEventListener("keyup", async (e) => {
    if (dropdown.getBoundingClientRect().height < 1) {
        dropdown.style.border = "none";
    }
    if (e.key === "Enter") {
        buttonClick();
    }
    const matchingTeams = await getTeamList(e.target.value);
    dropdown.innerHTML = "";
    matchingTeams.forEach((team, idx) => {
        const li = document.createElement("li");
        li.classList.add("dropdown-item");
        li.style.cursor = "pointer";
        li.tabIndex = 0;
        li.innerText = team;
        li.addEventListener("click", () => {
            e.target.value = team;
            dropdown.innerHTML = "";
        });
        dropdown.appendChild(li);
    });
});

const team = window.localStorage.getItem("techit_likelion_team");
if (team) {
    input.value = team;
    button.removeAttribute("disabled");
    goToDashboard.removeAttribute("disabled");
}

(async () => {
    try {
        const { name } = await getUserInfo();
        const yourname = document.querySelector(".your-name");
        yourname.innerText = name;
    } catch (e) {
        window.console.log(e);
    }
})()