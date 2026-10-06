// ======================================================
// AI CODE HUB - PROJECT DETAIL
// ======================================================


// ======================================================
// 3 PROJECT MẪU
// Sau này sẽ được thay bằng database thật
// ======================================================

const projects = {

    // ==================================================
    // MINECRAFT
    // ==================================================

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


    // ==================================================
    // DISCORD AI BOT
    // ==================================================

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


    // ==================================================
    // MODERN PORTFOLIO
    // ==================================================

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
// ĐỌC THÔNG TIN TỪ URL
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
// TÌM PROJECT NGƯỜI DÙNG TRONG LOCALSTORAGE
// ======================================================

function getUserProject(projectID) {

    let savedProjects = [];


    try {

        savedProjects =
            JSON.parse(
                localStorage.getItem(
                    "aiCodeHubProjects"
                )
            ) || [];

    } catch (error) {

        console.error(
            "Không thể đọc project:",
            error
        );

        return null;

    }


    return (
        savedProjects.find(
            function(project) {

                return (
                    String(project.id) ===
                    String(projectID)
                );

            }
        ) || null
    );

}


// ======================================================
// CHUYỂN PROJECT NGƯỜI DÙNG SANG ĐỊNH DẠNG CODE VIEWER
// ======================================================

function normalizeUserProject(
    savedProject
) {

    const normalizedFiles = {};


    savedProject.files.forEach(
        function(file, index) {

            // Mỗi file cần ID riêng
            const fileID =
                "userFile" + index;


            normalizedFiles[fileID] = {

                name:
                    file.name ||
                    "untitled.txt",

                code:
                    file.code || ""

            };

        }
    );


    return {

        title:
            savedProject.title ||
            "Untitled Project",

        language:
            savedProject.language ||
            "Khác",

        ai:
            savedProject.ai ||
            "Không xác định",

        author:
            savedProject.author ||
            "Ẩn danh",

        likes:
            savedProject.likes || 0,

        views:
            savedProject.views || 0,

        description:
            savedProject.description ||
            "Không có mô tả.",

        files:
            normalizedFiles

    };

}


// ======================================================
// XÁC ĐỊNH PROJECT CẦN HIỂN THỊ
// ======================================================

let project = null;


// Nếu URL có userProject
if (userProjectID) {

    const savedProject =
        getUserProject(
            userProjectID
        );


    if (savedProject) {

        project =
            normalizeUserProject(
                savedProject
            );

    }

}


// Nếu không phải project người dùng
if (!project && sampleProjectID) {

    project =
        projects[sampleProjectID];

}


// Nếu URL không hợp lệ
if (!project) {

    project =
        projects.minecraft;

}


// ======================================================
// LẤY CÁC THÀNH PHẦN HTML
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
// HIỂN THỊ THÔNG TIN PROJECT
// ======================================================

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


// ======================================================
// KIỂM TRA PROJECT CÓ FILE KHÔNG
// ======================================================

const fileIDs =
    Object.keys(
        project.files
    );


let activeFile =
    fileIDs.length > 0
        ? fileIDs[0]
        : null;


// ======================================================
// TẠO DANH SÁCH FILE
// ======================================================

function createFileList() {

    fileList.innerHTML = `

        <div class="file-list-title">
            FILES
        </div>

    `;


    // Không có file
    if (fileIDs.length === 0) {

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
        function(fileID) {

            const file =
                project.files[fileID];


            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "file-button";


            button.textContent =
                getFileIcon(file.name) +
                " " +
                file.name;


            button.dataset.file =
                fileID;


            button.addEventListener(
                "click",
                function() {

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
// ICON FILE ĐƠN GIẢN
// ======================================================

function getFileIcon(fileName) {

    const extension =
        fileName
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


    if (
        extension === "json"
    ) {

        return "{}";

    }


    return "•";

}


// ======================================================
// HIỂN THỊ FILE
// ======================================================

function showFile(fileID) {

    if (!project.files[fileID]) {

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
        function(button) {

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
// COPY CODE
// ======================================================

copyCodeButton.addEventListener(
    "click",
    async function() {

        if (!activeFile) {

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

            // Fallback nếu clipboard API
            // không hoạt động khi mở file local

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
            function() {

                copyCodeButton.textContent =
                    "Copy Code";

            },
            1500
        );

    }
);


// ======================================================
// KHỞI ĐỘNG
// ======================================================

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