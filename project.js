// ======================================================
// AI CODE HUB - PROJECT DETAIL
// VIEW + PROFILE + OWNER EDIT / DELETE
// ======================================================


// ======================================================
// SUPABASE
// ======================================================

const SUPABASE_URL =
    "https://cuokcbqrnneyxtqnpzbe.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_hMaUxO2w0SV7YngkZ_o6Ew_LYWxJja0";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ======================================================
// PROJECT MẪU
// ======================================================

const sampleProjects = {

    minecraft: {
        title: "Minecraft HTML5",
        language: "JavaScript",
        ai: "GPT-5.6",
        author: "Siro",
        likes: 243,
        views: "1.2K",

        description:
            "Minecraft mini chạy trực tiếp trên trình duyệt, " +
            "được xây dựng bằng HTML5 và JavaScript với sự hỗ trợ của AI.",

        files: [
            {
                name: "index.html",
                code:
`<!DOCTYPE html>
<html>

<head>
    <title>Minecraft HTML5</title>
</head>

<body>

    <canvas id="game"></canvas>

    <script src="game.js"><\/script>

</body>

</html>`
            },

            {
                name: "style.css",
                code:
`body {
    margin: 0;
    background: #111;
    overflow: hidden;
}

#game {
    width: 100vw;
    height: 100vh;
}`
            },

            {
                name: "script.js",
                code:
`const canvas = document.getElementById("game");

const context = canvas.getContext("2d");

function startGame() {
    console.log("Minecraft HTML5 started!");
}

startGame();`
            }
        ]
    },


    discord: {
        title: "Discord AI Bot",
        language: "Python",
        ai: "Claude",
        author: "Nova",
        likes: 156,
        views: 840,

        description:
            "Bot Discord có khả năng trò chuyện, quản lý server " +
            "và thực hiện các lệnh tự động.",

        files: [
            {
                name: "bot.py",
                code:
`import discord

from discord.ext import commands

intents = discord.Intents.default()

bot = commands.Bot(
    command_prefix="!",
    intents=intents
)

@bot.event
async def on_ready():
    print(f"Bot connected as {bot.user}")

@bot.command()
async def hello(ctx):
    await ctx.send("Xin chào từ AI Code Hub!")

bot.run("YOUR_BOT_TOKEN")`
            },

            {
                name: "config.py",
                code:
`BOT_PREFIX = "!"
BOT_NAME = "AI Code Bot"
VERSION = "1.0.0"`
            }
        ]
    },


    portfolio: {
        title: "Modern Portfolio",
        language: "HTML / CSS",
        ai: "Gemini",
        author: "Kira",
        likes: 89,
        views: 520,

        description:
            "Template portfolio tối giản với giao diện responsive " +
            "dành cho developer.",

        files: [
            {
                name: "index.html",
                code:
`<!DOCTYPE html>
<html>

<head>
    <title>My Portfolio</title>
    <link rel="stylesheet" href="style.css">
</head>

<body>

    <main class="hero">
        <h1>Hello, I'm Kira.</h1>

        <p>
            Designer & Developer
        </p>
    </main>

</body>

</html>`
            },

            {
                name: "style.css",
                code:
`body {
    margin: 0;
    background: #0d1117;
    color: white;
    font-family: Arial, sans-serif;
}

.hero {
    min-height: 100vh;

    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: center;
}`
            }
        ]
    }
};


// ======================================================
// URL
// ======================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const sampleProjectID =
    urlParams.get("project");

const userProjectID =
    urlParams.get("userProject");


// ======================================================
// HTML ELEMENTS
// ======================================================

const pageTitle =
    document.getElementById("projectTitle");

const pageLanguage =
    document.getElementById("projectLanguage");

const pageAI =
    document.getElementById("projectAI");

const pageDescription =
    document.getElementById("projectDescription");

const pageAuthor =
    document.getElementById("projectAuthor");

const pageLikes =
    document.getElementById("projectLikes");

const pageViews =
    document.getElementById("projectViews");

const fileList =
    document.querySelector(".file-list");

const codeContent =
    document.getElementById("codeContent");

const currentFile =
    document.getElementById("currentFile");

const copyCodeButton =
    document.getElementById("copyCodeButton");


// ===== OWNER =====

const projectOwnerActions =
    document.getElementById(
        "projectOwnerActions"
    );

const editProjectButton =
    document.getElementById(
        "editProjectButton"
    );

const deleteProjectButton =
    document.getElementById(
        "deleteProjectButton"
    );


// ===== EDIT PANEL =====

const projectEditPanel =
    document.getElementById(
        "projectEditPanel"
    );

const editProjectTitle =
    document.getElementById(
        "editProjectTitle"
    );

const editProjectDescription =
    document.getElementById(
        "editProjectDescription"
    );

const editProjectLanguage =
    document.getElementById(
        "editProjectLanguage"
    );

const editProjectAI =
    document.getElementById(
        "editProjectAI"
    );

const editProjectFiles =
    document.getElementById(
        "editProjectFiles"
    );

const editAddFileButton =
    document.getElementById(
        "editAddFileButton"
    );

const saveProjectButton =
    document.getElementById(
        "saveProjectButton"
    );

const cancelEditProjectButton =
    document.getElementById(
        "cancelEditProjectButton"
    );


// ===== DELETE MODAL =====

const deleteProjectModal =
    document.getElementById(
        "deleteProjectModal"
    );

const cancelDeleteProjectButton =
    document.getElementById(
        "cancelDeleteProjectButton"
    );

const confirmDeleteProjectButton =
    document.getElementById(
        "confirmDeleteProjectButton"
    );


// ======================================================
// STATE
// ======================================================

let project = null;

let currentUser = null;

let activeFileIndex = 0;

let isDatabaseProject = false;


// ======================================================
// NORMALIZE FILES
// ======================================================

function normalizeFiles(codeValue) {

    let files = [];


    try {

        if (Array.isArray(codeValue)) {

            files = codeValue;

        } else if (
            typeof codeValue === "string"
        ) {

            files =
                JSON.parse(codeValue);
        }

    } catch (error) {

        files = [
            {
                name: "source.txt",
                code: String(
                    codeValue || ""
                )
            }
        ];
    }


    if (!Array.isArray(files)) {

        files = [];
    }


    return files.map(
        function (file, index) {

            return {
                name:
                    String(
                        file?.name ||
                        `file-${index + 1}.txt`
                    ),

                code:
                    String(
                        file?.code || ""
                    )
            };
        }
    );
}


// ======================================================
// PROFILE
// ======================================================

async function getProfileByUserID(userID) {

    if (!userID) {
        return null;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("profiles")
            .select(
                "id, username, avatar_url, bio"
            )
            .eq("id", userID)
            .maybeSingle();


    if (error) {

        console.error(
            "Không thể tải profile:",
            error
        );

        return null;
    }


    return data || null;
}


// ======================================================
// GET DATABASE PROJECT
// ======================================================

async function getSupabaseProject(
    projectID
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("projects")
            .select(
                "id, user_id, title, description, language, ai, code, tags, created_at, likes, views"
            )
            .eq(
                "id",
                projectID
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Không thể tải project:",
            error
        );

        return null;
    }


    return data || null;
}


// ======================================================
// SESSION
// ======================================================

async function loadCurrentUser() {

    const {
        data,
        error
    } =
        await supabaseClient.auth
            .getSession();


    if (error) {

        console.error(
            "Không thể lấy session:",
            error
        );

        currentUser = null;

        return;
    }


    currentUser =
        data.session?.user || null;
}


// ======================================================
// OWNER CHECK
// ======================================================

function isProjectOwner() {

    if (
        !isDatabaseProject ||
        !currentUser ||
        !project
    ) {

        return false;
    }


    return (
        currentUser.id ===
        project.user_id
    );
}


function updateOwnerControls() {

    if (!projectOwnerActions) {
        return;
    }


    projectOwnerActions.hidden =
        !isProjectOwner();
}


// ======================================================
// FILE ICON
// ======================================================

function getFileIcon(fileName) {

    const extension =
        String(fileName || "")
            .split(".")
            .pop()
            .toLowerCase();


    if (extension === "html") {
        return "◇";
    }

    if (extension === "css") {
        return "#";
    }

    if (
        extension === "js" ||
        extension === "ts"
    ) {
        return "JS";
    }

    if (extension === "py") {
        return "PY";
    }

    if (extension === "json") {
        return "{}";
    }

    if (extension === "java") {
        return "J";
    }

    if (
        extension === "cpp" ||
        extension === "c" ||
        extension === "h"
    ) {
        return "C++";
    }

    if (extension === "cs") {
        return "C#";
    }

    if (extension === "rs") {
        return "RS";
    }


    return "•";
}


// ======================================================
// FILE LIST
// ======================================================

function createFileList() {

    fileList.innerHTML = `

        <div class="file-list-title">
            FILES
        </div>

    `;


    if (
        !project.files ||
        project.files.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.textContent =
            "Không có file";

        empty.style.padding =
            "10px";

        empty.style.color =
            "#8b949e";

        fileList.appendChild(
            empty
        );

        return;
    }


    project.files.forEach(
        function (file, index) {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "file-button";


            button.dataset.index =
                String(index);


            button.textContent =
                getFileIcon(
                    file.name
                ) +
                " " +
                file.name;


            button.addEventListener(
                "click",
                function () {

                    showFile(index);
                }
            );


            fileList.appendChild(
                button
            );
        }
    );
}


// ======================================================
// SHOW FILE
// ======================================================

function showFile(index) {

    if (
        !project ||
        !project.files ||
        !project.files[index]
    ) {

        return;
    }


    activeFileIndex =
        index;


    const file =
        project.files[index];


    currentFile.textContent =
        file.name;


    codeContent.textContent =
        file.code;


    document
        .querySelectorAll(
            ".file-button"
        )
        .forEach(
            function (button) {

                button.classList.remove(
                    "active"
                );
            }
        );


    const activeButton =
        document.querySelector(
            `.file-button[data-index="${index}"]`
        );


    if (activeButton) {

        activeButton.classList.add(
            "active"
        );
    }
}


// ======================================================
// RENDER PROJECT
// ======================================================

function renderProject() {

    if (!project) {
        return;
    }


    document.title =
        project.title +
        " - AI Code Hub";


    pageTitle.textContent =
        project.title;


    pageLanguage.textContent =
        project.language;


    pageAI.textContent =
        project.ai;


    pageDescription.textContent =
        project.description;


    pageAuthor.textContent =
        "👤 " +
        project.author;


    pageLikes.textContent =
        "♥ " +
        project.likes +
        " lượt thích";


    pageViews.textContent =
        "👁 " +
        project.views +
        " lượt xem";


    createFileList();


    if (
        project.files &&
        project.files.length > 0
    ) {

        if (
            activeFileIndex >=
            project.files.length
        ) {

            activeFileIndex = 0;
        }


        showFile(
            activeFileIndex
        );

    } else {

        currentFile.textContent =
            "Không có file";

        codeContent.textContent =
            "";
    }


    updateOwnerControls();
}


// ======================================================
// LOADING
// ======================================================

function showLoading() {

    pageTitle.textContent =
        "Đang tải project...";

    pageLanguage.textContent =
        "...";

    pageAI.textContent =
        "...";

    pageDescription.textContent =
        "Đang lấy dữ liệu từ AI Code Hub.";

    pageAuthor.textContent =
        "👤 ...";

    pageLikes.textContent =
        "♥ ...";

    pageViews.textContent =
        "👁 ...";

    currentFile.textContent =
        "Đang tải...";

    codeContent.textContent =
        "";


    if (projectOwnerActions) {

        projectOwnerActions.hidden =
            true;
    }
}


// ======================================================
// NOT FOUND
// ======================================================

function showNotFound() {

    document.title =
        "Không tìm thấy project - AI Code Hub";


    pageTitle.textContent =
        "Không tìm thấy project";


    pageLanguage.textContent =
        "—";


    pageAI.textContent =
        "—";


    pageDescription.textContent =
        "Project này không tồn tại hoặc đã bị xóa.";


    pageAuthor.textContent =
        "👤 —";


    pageLikes.textContent =
        "♥ 0 lượt thích";


    pageViews.textContent =
        "👁 0 lượt xem";


    currentFile.textContent =
        "Không có file";


    codeContent.textContent =
        "";


    fileList.innerHTML = `

        <div class="file-list-title">
            FILES
        </div>

        <div
            style="
                padding: 10px;
                color: #8b949e;
            "
        >
            Không có file
        </div>

    `;


    if (projectOwnerActions) {

        projectOwnerActions.hidden =
            true;
    }
}


// ======================================================
// COPY CODE
// ======================================================

copyCodeButton?.addEventListener(
    "click",
    async function () {

        const file =
            project?.files?.[
                activeFileIndex
            ];


        if (!file) {
            return;
        }


        try {

            await navigator.clipboard
                .writeText(
                    file.code
                );


        } catch (error) {

            const textarea =
                document.createElement(
                    "textarea"
                );


            textarea.value =
                file.code;


            document.body.appendChild(
                textarea
            );


            textarea.select();


            document.execCommand(
                "copy"
            );


            textarea.remove();
        }


        copyCodeButton.textContent =
            "✓ Đã copy";


        setTimeout(
            function () {

                copyCodeButton.textContent =
                    "Copy Code";
            },
            1500
        );
    }
);


// ======================================================
// EDITOR - CREATE FILE BOX
// ======================================================

function createEditFileBox(
    file = {
        name: "",
        code: ""
    }
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "project-edit-file";


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "project-edit-file-header";


    const nameInput =
        document.createElement(
            "input"
        );


    nameInput.type =
        "text";


    nameInput.className =
        "project-edit-file-name";


    nameInput.placeholder =
        "Tên file, ví dụ: script.js";


    nameInput.value =
        file.name || "";


    const removeButton =
        document.createElement(
            "button"
        );


    removeButton.type =
        "button";


    removeButton.className =
        "project-edit-remove-file";


    removeButton.textContent =
        "Xóa file";


    const codeInput =
        document.createElement(
            "textarea"
        );


    codeInput.className =
        "project-edit-file-code";


    codeInput.placeholder =
        "Dán source code vào đây...";


    codeInput.value =
        file.code || "";


    removeButton.addEventListener(
        "click",
        function () {

            const allFiles =
                editProjectFiles
                    .querySelectorAll(
                        ".project-edit-file"
                    );


            if (allFiles.length <= 1) {

                alert(
                    "Project phải có ít nhất 1 file."
                );

                return;
            }


            wrapper.remove();
        }
    );


    header.appendChild(
        nameInput
    );


    header.appendChild(
        removeButton
    );


    wrapper.appendChild(
        header
    );


    wrapper.appendChild(
        codeInput
    );


    editProjectFiles.appendChild(
        wrapper
    );
}


// ======================================================
// OPEN EDIT MODE
// ======================================================

function openEditProject() {

    if (!isProjectOwner()) {

        alert(
            "Bạn không có quyền sửa project này."
        );

        return;
    }


    editProjectTitle.value =
        project.title;


    editProjectDescription.value =
        project.description;


    setSelectValue(
        editProjectLanguage,
        project.language
    );


    setSelectValue(
        editProjectAI,
        project.ai
    );


    editProjectFiles.innerHTML =
        "";


    project.files.forEach(
        function (file) {

            createEditFileBox(
                file
            );
        }
    );


    if (
        project.files.length === 0
    ) {

        createEditFileBox();
    }


    projectEditPanel.hidden =
        false;


    projectEditPanel.scrollIntoView(
        {
            behavior: "smooth",
            block: "start"
        }
    );
}


// ======================================================
// SET SELECT VALUE
// ======================================================

function setSelectValue(
    select,
    value
) {

    const exists =
        Array.from(
            select.options
        ).some(
            function (option) {

                return (
                    option.value ===
                    value
                );
            }
        );


    select.value =
        exists
            ? value
            : "Khác";
}


// ======================================================
// CLOSE EDIT MODE
// ======================================================

function closeEditProject() {

    projectEditPanel.hidden =
        true;
}


// ======================================================
// COLLECT EDIT FILES
// ======================================================

function collectEditedFiles() {

    const boxes =
        editProjectFiles
            .querySelectorAll(
                ".project-edit-file"
            );


    const files = [];


    boxes.forEach(
        function (box) {

            const name =
                box
                    .querySelector(
                        ".project-edit-file-name"
                    )
                    .value
                    .trim();


            const code =
                box
                    .querySelector(
                        ".project-edit-file-code"
                    )
                    .value;


            if (
                name ||
                code.trim()
            ) {

                files.push({
                    name:
                        name ||
                        "untitled.txt",

                    code
                });
            }
        }
    );


    return files;
}


// ======================================================
// VALIDATE DUPLICATE FILE NAMES
// ======================================================

function hasDuplicateFileNames(
    files
) {

    const names =
        files.map(
            function (file) {

                return file.name
                    .trim()
                    .toLowerCase();
            }
        );


    return (
        new Set(names).size !==
        names.length
    );
}


// ======================================================
// SAVE PROJECT
// ======================================================

async function saveProjectChanges() {

    if (!isProjectOwner()) {

        alert(
            "Bạn không có quyền sửa project này."
        );

        return;
    }


    const title =
        editProjectTitle.value
            .trim();


    const description =
        editProjectDescription.value
            .trim();


    const language =
        editProjectLanguage.value;


    const ai =
        editProjectAI.value;


    const files =
        collectEditedFiles();


    if (!title) {

        alert(
            "Hãy nhập tên project."
        );

        editProjectTitle.focus();

        return;
    }


    if (!description) {

        alert(
            "Hãy nhập mô tả project."
        );

        editProjectDescription.focus();

        return;
    }


    if (files.length === 0) {

        alert(
            "Project phải có ít nhất 1 file."
        );

        return;
    }


    if (
        hasDuplicateFileNames(files)
    ) {

        alert(
            "Không thể có hai file trùng tên."
        );

        return;
    }


    const oldText =
        saveProjectButton.textContent;


    saveProjectButton.disabled =
        true;


    saveProjectButton.textContent =
        "Đang lưu...";


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("projects")
                .update({
                    title,
                    description,
                    language,
                    ai,
                    code:
                        JSON.stringify(
                            files
                        )
                })
                .eq(
                    "id",
                    project.id
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .select()
                .maybeSingle();


        if (error) {

            console.error(
                "Lỗi cập nhật project:",
                error
            );


            alert(
                "Không thể lưu project:\n" +
                error.message
            );

            return;
        }


        if (!data) {

            alert(
                "Không thể cập nhật project. " +
                "Hãy kiểm tra quyền tài khoản."
            );

            return;
        }


        project.title =
            data.title;


        project.description =
            data.description;


        project.language =
            data.language;


        project.ai =
            data.ai;


        project.files =
            normalizeFiles(
                data.code
            );


        activeFileIndex = 0;


        closeEditProject();


        renderProject();


        alert(
            "Đã lưu thay đổi thành công!"
        );


    } catch (error) {

        console.error(error);


        alert(
            "Có lỗi xảy ra khi lưu project."
        );


    } finally {

        saveProjectButton.disabled =
            false;


        saveProjectButton.textContent =
            oldText;
    }
}


// ======================================================
// DELETE MODAL
// ======================================================

function openDeleteModal() {

    if (!isProjectOwner()) {

        alert(
            "Bạn không có quyền xóa project này."
        );

        return;
    }


    deleteProjectModal.hidden =
        false;


    document.body.style.overflow =
        "hidden";
}


function closeDeleteModal() {

    deleteProjectModal.hidden =
        true;


    document.body.style.overflow =
        "";
}


// ======================================================
// DELETE PROJECT
// ======================================================

async function deleteProject() {

    if (!isProjectOwner()) {

        alert(
            "Bạn không có quyền xóa project này."
        );

        return;
    }


    const oldText =
        confirmDeleteProjectButton
            .textContent;


    confirmDeleteProjectButton
        .disabled = true;


    confirmDeleteProjectButton
        .textContent =
            "Đang xóa...";


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("projects")
                .delete()
                .eq(
                    "id",
                    project.id
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .select("id");


        if (error) {

            console.error(
                "Lỗi xóa project:",
                error
            );


            alert(
                "Không thể xóa project:\n" +
                error.message
            );

            return;
        }


        if (
            !data ||
            data.length === 0
        ) {

            alert(
                "Project không được xóa. " +
                "Hãy kiểm tra quyền tài khoản."
            );

            return;
        }


        alert(
            "Đã xóa project."
        );


        window.location.href =
            "index.html";


    } catch (error) {

        console.error(error);


        alert(
            "Có lỗi xảy ra khi xóa project."
        );


    } finally {

        confirmDeleteProjectButton
            .disabled = false;


        confirmDeleteProjectButton
            .textContent =
                oldText;
    }
}


// ======================================================
// OWNER BUTTON EVENTS
// ======================================================

editProjectButton?.addEventListener(
    "click",
    openEditProject
);


deleteProjectButton?.addEventListener(
    "click",
    openDeleteModal
);


cancelEditProjectButton
    ?.addEventListener(
        "click",
        closeEditProject
    );


saveProjectButton
    ?.addEventListener(
        "click",
        saveProjectChanges
    );


editAddFileButton
    ?.addEventListener(
        "click",
        function () {

            createEditFileBox({
                name: "",
                code: ""
            });


            const boxes =
                editProjectFiles
                    .querySelectorAll(
                        ".project-edit-file"
                    );


            boxes[
                boxes.length - 1
            ]?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    );


cancelDeleteProjectButton
    ?.addEventListener(
        "click",
        closeDeleteModal
    );


confirmDeleteProjectButton
    ?.addEventListener(
        "click",
        deleteProject
    );


// Click nền tối -> đóng modal

deleteProjectModal
    ?.querySelector(
        ".delete-project-backdrop"
    )
    ?.addEventListener(
        "click",
        closeDeleteModal
    );


// ESC -> đóng modal

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            deleteProjectModal &&
            !deleteProjectModal.hidden
        ) {

            closeDeleteModal();
        }
    }
);


// ======================================================
// LOAD DATABASE PROJECT
// ======================================================

async function loadDatabaseProject() {

    const databaseProject =
        await getSupabaseProject(
            userProjectID
        );


    if (!databaseProject) {

        showNotFound();

        return;
    }


    const ownerProfile =
        await getProfileByUserID(
            databaseProject.user_id
        );


    project = {

        id:
            databaseProject.id,

        user_id:
            databaseProject.user_id,

        title:
            databaseProject.title ||
            "Untitled Project",

        description:
            databaseProject.description ||
            "Không có mô tả.",

        language:
            databaseProject.language ||
            "Khác",

        ai:
            databaseProject.ai ||
            "Không xác định",

        author:
            ownerProfile?.username ||
            "Cộng đồng",

        likes:
            Number(
                databaseProject.likes ||
                0
            ),

        views:
            Number(
                databaseProject.views ||
                0
            ),

        files:
            normalizeFiles(
                databaseProject.code
            )
    };


    isDatabaseProject =
        true;


    activeFileIndex = 0;


    renderProject();
}


// ======================================================
// LOAD SAMPLE PROJECT
// ======================================================

function loadSampleProject() {

    const selected =
        sampleProjects[
            sampleProjectID
        ] ||
        sampleProjects.minecraft;


    project = {
        ...selected,

        files:
            selected.files.map(
                function (file) {

                    return {
                        ...file
                    };
                }
            )
    };


    isDatabaseProject =
        false;


    activeFileIndex = 0;


    renderProject();
}


// ======================================================
// INITIALIZE
// ======================================================

async function initializeProjectPage() {

    showLoading();


    // Phải lấy session trước để biết
    // người đang xem có phải chủ bài hay không.

    await loadCurrentUser();


    if (userProjectID) {

        await loadDatabaseProject();

        return;
    }


    loadSampleProject();
}


// ======================================================
// START
// ======================================================

initializeProjectPage();