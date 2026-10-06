// ======================================================
// AI CODE HUB - PROJECT DETAIL
// SUPABASE VERSION
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

const projects = {

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

        files: {

            html: {

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


            css: {

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


            js: {

                name: "script.js",

                code:
`const canvas =
    document.getElementById("game");

const context =
    canvas.getContext("2d");


function startGame() {

    console.log(
        "Minecraft HTML5 started!"
    );

}


startGame();`

            }

        }

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

        files: {

            python: {

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

    print(
        f"Bot connected as {bot.user}"
    )


@bot.command()
async def hello(ctx):

    await ctx.send(
        "Xin chào từ AI Code Hub!"
    )


bot.run("YOUR_BOT_TOKEN")`

            },


            config: {

                name: "config.py",

                code:
`BOT_PREFIX = "!"

BOT_NAME = "AI Code Bot"

VERSION = "1.0.0"`

            }

        }

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

        files: {

            html: {

                name: "index.html",

                code:
`<!DOCTYPE html>
<html>

<head>

    <title>My Portfolio</title>

    <link
        rel="stylesheet"
        href="style.css"
    >

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


            css: {

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

        }

    }

};


// ======================================================
// ĐỌC URL
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
    document.getElementById(
        "projectTitle"
    );

const pageLanguage =
    document.getElementById(
        "projectLanguage"
    );

const pageAI =
    document.getElementById(
        "projectAI"
    );

const pageDescription =
    document.getElementById(
        "projectDescription"
    );

const pageAuthor =
    document.getElementById(
        "projectAuthor"
    );

const pageLikes =
    document.getElementById(
        "projectLikes"
    );

const pageViews =
    document.getElementById(
        "projectViews"
    );

const fileList =
    document.querySelector(
        ".file-list"
    );

const codeContent =
    document.getElementById(
        "codeContent"
    );

const currentFile =
    document.getElementById(
        "currentFile"
    );

const copyCodeButton =
    document.getElementById(
        "copyCodeButton"
    );


// ======================================================
// TRẠNG THÁI
// ======================================================

let project = null;

let activeFile = null;


// ======================================================
// CHUYỂN CODE JSON THÀNH DANH SÁCH FILE
// ======================================================

function normalizeFiles(codeValue) {

    let files = [];


    try {

        if (
            typeof codeValue === "string"
        ) {

            files =
                JSON.parse(
                    codeValue
                );

        } else if (
            Array.isArray(codeValue)
        ) {

            files =
                codeValue;
        }

    } catch (error) {

        console.error(
            "Không thể đọc JSON source:",
            error
        );


        files = [

            {
                name: "source.txt",

                code:
                    String(
                        codeValue || ""
                    )
            }

        ];

    }


    if (
        !Array.isArray(files)
    ) {

        files = [];
    }


    const normalizedFiles = {};


    files.forEach(
        function (file, index) {

            const fileID =
                "userFile" + index;


            normalizedFiles[fileID] = {

                name:
                    file?.name ||
                    "untitled.txt",

                code:
                    file?.code ||
                    ""

            };

        }
    );


    return normalizedFiles;
}


// ======================================================
// CHUYỂN PROJECT DATABASE SANG FORMAT VIEWER
// ======================================================

function normalizeSupabaseProject(
    databaseProject
) {

    return {

        title:
            databaseProject.title ||
            "Untitled Project",

        language:
            databaseProject.language ||
            "Khác",

        ai:
            databaseProject.ai ||
            "Không xác định",

        author:
            "Cộng đồng",

        likes:
            Number(
                databaseProject.likes || 0
            ),

        views:
            Number(
                databaseProject.views || 0
            ),

        description:
            databaseProject.description ||
            "Không có mô tả.",

        files:
            normalizeFiles(
                databaseProject.code
            )

    };
}


// ======================================================
// LẤY PROJECT TỪ SUPABASE
// ======================================================

async function getSupabaseProject(
    projectID
) {

    try {

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


    } catch (error) {

        console.error(
            "Lỗi Supabase:",
            error
        );

        return null;
    }
}


// ======================================================
// ICON FILE
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


    return "•";
}


// ======================================================
// TẠO DANH SÁCH FILE
// ======================================================

function createFileList() {

    fileList.innerHTML = `

        <div class="file-list-title">
            FILES
        </div>

    `;


    const fileIDs =
        Object.keys(
            project.files || {}
        );


    if (
        fileIDs.length === 0
    ) {

        const emptyMessage =
            document.createElement(
                "div"
            );


        emptyMessage.textContent =
            "Không có file";


        emptyMessage.style.padding =
            "10px";


        emptyMessage.style.color =
            "#8b949e";


        fileList.appendChild(
            emptyMessage
        );


        return;
    }


    fileIDs.forEach(
        function (fileID) {

            const file =
                project.files[fileID];


            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "file-button";


            button.textContent =
                getFileIcon(
                    file.name
                ) +
                " " +
                file.name;


            button.dataset.file =
                fileID;


            button.addEventListener(
                "click",
                function () {

                    showFile(
                        fileID
                    );

                }
            );


            fileList.appendChild(
                button
            );

        }
    );
}


// ======================================================
// HIỂN THỊ FILE
// ======================================================

function showFile(fileID) {

    if (
        !project ||
        !project.files ||
        !project.files[fileID]
    ) {

        return;
    }


    activeFile =
        fileID;


    const file =
        project.files[fileID];


    codeContent.textContent =
        file.code;


    currentFile.textContent =
        file.name;


    const buttons =
        document.querySelectorAll(
            ".file-button"
        );


    buttons.forEach(
        function (button) {

            button.classList.remove(
                "active"
            );

        }
    );


    const activeButton =
        document.querySelector(
            `[data-file="${fileID}"]`
        );


    if (activeButton) {

        activeButton.classList.add(
            "active"
        );
    }
}


// ======================================================
// HIỂN THỊ PROJECT
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


    const fileIDs =
        Object.keys(
            project.files || {}
        );


    activeFile =
        fileIDs.length > 0
            ? fileIDs[0]
            : null;


    createFileList();


    if (activeFile) {

        showFile(
            activeFile
        );

    } else {

        currentFile.textContent =
            "Không có file";

        codeContent.textContent =
            "";
    }
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

    currentFile.textContent =
        "Đang tải...";

    codeContent.textContent =
        "";
}


// ======================================================
// PROJECT KHÔNG TỒN TẠI
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


    fileList.innerHTML = `

        <div class="file-list-title">
            FILES
        </div>

        <div style="
            padding: 10px;
            color: #8b949e;
        ">
            Không có file
        </div>

    `;


    currentFile.textContent =
        "Không có file";


    codeContent.textContent =
        "";
}


// ======================================================
// COPY CODE
// ======================================================

copyCodeButton.addEventListener(
    "click",
    async function () {

        if (
            !project ||
            !activeFile ||
            !project.files[activeFile]
        ) {

            return;
        }


        const code =
            project
                .files[activeFile]
                .code;


        try {

            await navigator.clipboard
                .writeText(code);


            copyCodeButton.textContent =
                "✓ Đã copy";


        } catch (error) {

            // Dùng khi mở web trực tiếp bằng file://

            const textarea =
                document.createElement(
                    "textarea"
                );


            textarea.value =
                code;


            document.body.appendChild(
                textarea
            );


            textarea.select();


            document.execCommand(
                "copy"
            );


            textarea.remove();


            copyCodeButton.textContent =
                "✓ Đã copy";
        }


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
// KHỞI ĐỘNG TRANG
// ======================================================

async function initializeProjectPage() {

    showLoading();


    // ==================================================
    // PROJECT NGƯỜI DÙNG
    // ==================================================

    if (userProjectID) {

        const databaseProject =
            await getSupabaseProject(
                userProjectID
            );


        if (!databaseProject) {

            showNotFound();

            return;
        }


        project =
            normalizeSupabaseProject(
                databaseProject
            );


        renderProject();

        return;
    }


    // ==================================================
    // PROJECT MẪU
    // ==================================================

    if (
        sampleProjectID &&
        projects[sampleProjectID]
    ) {

        project =
            projects[sampleProjectID];


        renderProject();

        return;
    }


    // Không có tham số URL
    project =
        projects.minecraft;


    renderProject();
}


// ======================================================
// START
// ======================================================

initializeProjectPage();