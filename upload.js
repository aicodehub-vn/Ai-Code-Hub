// ======================================================
// AI CODE HUB - UPLOAD PROJECT
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
// HTML ELEMENTS
// ======================================================

const uploadForm =
    document.getElementById("uploadForm");

const uploadFiles =
    document.getElementById("uploadFiles");

const addFileButton =
    document.getElementById("addFileButton");

const publishButton =
    document.getElementById("publishButton");

const authorInput =
    document.getElementById("projectAuthorInput");


// ======================================================
// KIỂM TRA ĐĂNG NHẬP
// ======================================================

async function checkLogin() {

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Lỗi kiểm tra đăng nhập:",
            error
        );

        alert(
            "Không thể kiểm tra tài khoản đăng nhập."
        );

        return null;
    }


    if (!session || !session.user) {

        alert(
            "Bạn cần đăng nhập trước khi đăng project."
        );

        window.location.href =
            "login.html";

        return null;
    }


    return session.user;
}


// ======================================================
// TỰ ĐIỀN TÊN TÁC GIẢ
// ======================================================

async function loadUserInfo() {

    const user =
        await checkLogin();


    if (!user) {
        return;
    }


    const displayName =
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "User";


    if (
        authorInput &&
        !authorInput.value.trim()
    ) {

        authorInput.value =
            displayName;
    }

}


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


    uploadFiles.appendChild(
        fileBox
    );

}


// ======================================================
// THÊM FILE
// ======================================================

addFileButton.addEventListener(
    "click",
    function () {

        createFileEditor();

    }
);


// ======================================================
// XÓA FILE
// ======================================================

uploadFiles.addEventListener(
    "click",
    function (event) {

        if (
            event.target.classList.contains(
                "remove-file-button"
            )
        ) {

            const allFiles =
                document.querySelectorAll(
                    ".upload-file"
                );


            // Project luôn phải có ít nhất 1 file
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
// LẤY SOURCE CODE
// ======================================================

function collectFiles() {

    const fileBoxes =
        document.querySelectorAll(
            ".upload-file"
        );


    const files = [];


    fileBoxes.forEach(
        function (fileBox) {

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


    return files;
}


// ======================================================
// KIỂM TRA TÊN FILE TRÙNG
// ======================================================

function hasDuplicateFileNames(files) {

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
// ĐĂNG PROJECT LÊN SUPABASE
// ======================================================

uploadForm.addEventListener(
    "submit",

    async function (event) {

        event.preventDefault();


        // ==================================================
        // KIỂM TRA USER
        // ==================================================

        const user =
            await checkLogin();


        if (!user) {
            return;
        }


        // ==================================================
        // LẤY THÔNG TIN FORM
        // ==================================================

        const title =
            document
                .getElementById(
                    "projectName"
                )
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


        const files =
            collectFiles();


        // ==================================================
        // KIỂM TRA DỮ LIỆU
        // ==================================================

        if (
            !title ||
            !description ||
            !language ||
            !ai ||
            !author
        ) {

            alert(
                "Vui lòng nhập đầy đủ thông tin project."
            );

            return;
        }


        if (files.length === 0) {

            alert(
                "Project phải có ít nhất một file."
            );

            return;
        }


        const invalidFile =
            files.some(
                function (file) {

                    return (
                        !file.name ||
                        !file.code.trim()
                    );

                }
            );


        if (invalidFile) {

            alert(
                "Tên file và source code không được để trống."
            );

            return;
        }


        if (
            hasDuplicateFileNames(files)
        ) {

            alert(
                "Không được có hai file trùng tên."
            );

            return;
        }


        // ==================================================
        // KHÓA BUTTON KHI ĐANG UPLOAD
        // ==================================================

        publishButton.disabled =
            true;

        publishButton.textContent =
            "Đang đăng...";


        try {

            // ==============================================
            // CHUYỂN DANH SÁCH FILE THÀNH JSON
            // ==============================================

            const codeJSON =
                JSON.stringify(
                    files
                );


            // ==============================================
            // INSERT VÀO SUPABASE
            // ==============================================

            const {
                data,
                error
            } = await supabaseClient

                .from("projects")

                .insert({

                    user_id:
                        user.id,

                    title:
                        title,

                    description:
                        description,

                    language:
                        language,

                    ai:
                        ai,

                    code:
                        codeJSON,

                    tags:
                        "",

                    likes:
                        0,

                    views:
                        0

                })

                .select();


            // ==============================================
            // KIỂM TRA LỖI
            // ==============================================

            if (error) {

                console.error(
                    "SUPABASE ERROR:",
                    error
                );


                alert(
                    "Đăng project thất bại:\n\n" +
                    error.message
                );


                return;
            }


            console.log(
                "Project đã lưu:",
                data
            );


            // ==============================================
            // THÀNH CÔNG
            // ==============================================

            alert(
                "Đăng project thành công!"
            );


            window.location.href =
                "index.html";


        } catch (error) {

            console.error(
                "UPLOAD ERROR:",
                error
            );


            alert(
                "Có lỗi xảy ra khi đăng project:\n\n" +
                error.message
            );


        } finally {

            publishButton.disabled =
                false;

            publishButton.textContent =
                "Đăng project";

        }

    }
);


// ======================================================
// KHỞI ĐỘNG
// ======================================================

loadUserInfo();