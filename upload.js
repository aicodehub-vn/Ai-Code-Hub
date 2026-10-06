// ======================================================
// AI CODE HUB - UPLOAD PROJECT
// ======================================================

const uploadForm =
    document.getElementById("uploadForm");

const uploadFiles =
    document.getElementById("uploadFiles");

const addFileButton =
    document.getElementById("addFileButton");


// ======================================================
// TẠO FILE EDITOR MỚI
// ======================================================

function createFileEditor() {

    const fileBox =
        document.createElement("div");


    fileBox.className =
        "upload-file";


    fileBox.innerHTML = `
        <div class="upload-file-header">

            <input
                type="text"
                class="file-name-input"
                placeholder="Tên file, ví dụ: script.js"
                required
            >

            <button
                type="button"
                class="remove-file-button"
            >
                Xóa
            </button>

        </div>

        <textarea
            class="file-code-input"
            placeholder="// Dán source code vào đây..."
            spellcheck="false"
            required
        ></textarea>
    `;


    uploadFiles.appendChild(fileBox);

}


// ======================================================
// THÊM FILE
// ======================================================

addFileButton.addEventListener(
    "click",
    function() {

        createFileEditor();

    }
);


// ======================================================
// XÓA FILE
// ======================================================

uploadFiles.addEventListener(
    "click",
    function(event) {

        if (
            event.target.classList.contains(
                "remove-file-button"
            )
        ) {

            const allFiles =
                document.querySelectorAll(
                    ".upload-file"
                );


            // Luôn phải còn ít nhất 1 file
            if (allFiles.length <= 1) {

                alert(
                    "Project phải có ít nhất một file."
                );

                return;

            }


            event.target
                .closest(".upload-file")
                .remove();

        }

    }
);


// ======================================================
// ĐĂNG PROJECT
// ======================================================

uploadForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        // ===== THÔNG TIN PROJECT =====

        const title =
            document
                .getElementById("projectName")
                .value
                .trim();


        const description =
            document
                .getElementById(
                    "projectDescriptionInput"
                )
                .value
                .trim();


        const language =
            document
                .getElementById(
                    "projectLanguageInput"
                )
                .value;


        const ai =
            document
                .getElementById(
                    "projectAIInput"
                )
                .value;


        const author =
            document
                .getElementById(
                    "projectAuthorInput"
                )
                .value
                .trim();


        // ===== LẤY SOURCE FILE =====

        const fileBoxes =
            document.querySelectorAll(
                ".upload-file"
            );


        const files = [];


        fileBoxes.forEach(
            function(fileBox) {

                const name =
                    fileBox
                        .querySelector(
                            ".file-name-input"
                        )
                        .value
                        .trim();


                const code =
                    fileBox
                        .querySelector(
                            ".file-code-input"
                        )
                        .value;


                files.push({
                    name: name,
                    code: code
                });

            }
        );


        // ===== TẠO PROJECT =====

        const newProject = {

            id:
                "user-" + Date.now(),

            title: title,

            description: description,

            language: language,

            ai: ai,

            author: author,

            likes: 0,

            views: 0,

            date:
                new Date().toISOString(),

            files: files

        };


        // ===== ĐỌC PROJECT CŨ =====

        const savedProjects =
            JSON.parse(
                localStorage.getItem(
                    "aiCodeHubProjects"
                )
            ) || [];


        // Đưa project mới lên đầu
        savedProjects.unshift(
            newProject
        );


        // ===== LƯU =====

        localStorage.setItem(
            "aiCodeHubProjects",

            JSON.stringify(
                savedProjects
            )
        );


        alert(
            "Đăng project thành công!"
        );


        // Quay về trang chủ
        window.location.href =
            "index.html";

    }
);