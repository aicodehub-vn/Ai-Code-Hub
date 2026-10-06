// ======================================================
// AI CODE HUB - MAIN JAVASCRIPT
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

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const noResults =
    document.getElementById("noResults");

const noResultsKeyword =
    document.getElementById("noResultsKeyword");

const clearFilter =
    document.getElementById("clearFilter");

const sortProjects =
    document.getElementById("sortProjects");

const projectGrid =
    document.querySelector(".project-grid");

const uploadButton =
    document.querySelector(".upload-btn");


// ===== AUTH ELEMENTS =====

const loginButton =
    document.getElementById("loginButton");

const userArea =
    document.getElementById("userArea");

const userButton =
    document.getElementById("userButton");

const logoutButton =
    document.getElementById("logoutButton");


// ======================================================
// TRẠNG THÁI USER
// ======================================================

let currentUser = null;


// ======================================================
// CHỐNG CHÈN HTML
// ======================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;
}


// ======================================================
// TẠO TAG
// ======================================================

function createTag(language) {

    return String(language || "code")
        .toLowerCase()
        .replaceAll(" ", "")
        .replaceAll("/", "")
        .replaceAll("#", "sharp")
        .replaceAll("+", "plus");
}


// ======================================================
// HIỂN THỊ TRẠNG THÁI ĐĂNG NHẬP
// ======================================================

function updateAuthUI(user) {

    currentUser = user;


    // ===== CHƯA ĐĂNG NHẬP =====

    if (!user) {

        loginButton.style.display =
            "inline-flex";

        userArea.style.display =
            "none";

        userButton.textContent =
            "👤 Tài khoản";

        return;
    }


    // ===== ĐÃ ĐĂNG NHẬP =====

    loginButton.style.display =
        "none";

    userArea.style.display =
        "flex";


    const displayName =
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "Tài khoản";


    userButton.textContent =
        "👤 " + displayName;
}


// ======================================================
// KIỂM TRA SESSION
// ======================================================

async function checkAuthSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Không thể kiểm tra đăng nhập:",
                error
            );

            updateAuthUI(null);

            return;
        }


        const user =
            data.session?.user || null;


        updateAuthUI(user);

    } catch (error) {

        console.error(
            "Lỗi Supabase:",
            error
        );

        updateAuthUI(null);
    }
}


// ======================================================
// THEO DÕI THAY ĐỔI ĐĂNG NHẬP
// ======================================================

supabaseClient.auth.onAuthStateChange(
    function (event, session) {

        const user =
            session?.user || null;

        updateAuthUI(user);
    }
);


// ======================================================
// ĐĂNG XUẤT
// ======================================================

logoutButton.addEventListener(
    "click",
    async function () {

        const oldText =
            logoutButton.textContent;


        logoutButton.disabled =
            true;

        logoutButton.textContent =
            "Đang đăng xuất...";


        try {

            const {
                error
            } =
                await supabaseClient.auth.signOut();


            if (error) {

                alert(
                    "Không thể đăng xuất: " +
                    error.message
                );

                return;
            }


            currentUser = null;

            updateAuthUI(null);


        } catch (error) {

            console.error(error);

            alert(
                "Có lỗi xảy ra khi đăng xuất."
            );


        } finally {

            logoutButton.disabled =
                false;

            logoutButton.textContent =
                oldText;
        }

    }
);


// ======================================================
// NÚT + ĐĂNG CODE
// ======================================================

uploadButton.addEventListener(
    "click",
    function () {

        if (!currentUser) {

            window.location.href =
                "login.html";

            return;
        }


        window.location.href =
            "upload.html";
    }
);


// ======================================================
// LẤY PROJECT CARDS
// ======================================================

function getProjectCards() {

    return document.querySelectorAll(
        ".project-card"
    );
}


// ======================================================
// LẤY TÊN HIỂN THỊ CỦA PROJECT
// ======================================================

function getProjectAuthor(project) {

    /*
        Hiện bảng projects chưa có cột author.

        Vì vậy tạm thời project từ database
        sẽ hiển thị là "Cộng đồng".

        Sau này mình sẽ tạo profile/usernames
        riêng và nối user_id với profile.
    */

    return "Cộng đồng";
}


// ======================================================
// TẠO TAG HTML
// ======================================================

function createTagsHTML(project) {

    let tags = [];


    if (
        project.tags &&
        project.tags.trim()
    ) {

        tags =
            project.tags
                .split(",")
                .map(function (tag) {

                    return tag.trim()
                        .replace(/^#/, "");

                })
                .filter(Boolean);

    }


    if (tags.length === 0) {

        tags = [
            createTag(project.language),
            "AI",
            "community"
        ];
    }


    return tags
        .slice(0, 3)
        .map(function (tag) {

            return `
                <span>
                    #${escapeHTML(tag)}
                </span>
            `;

        })
        .join("");
}


// ======================================================
// TẠO CARD PROJECT TỪ SUPABASE
// ======================================================

function createUserProjectCard(project) {

    const card =
        document.createElement("article");


    card.className =
        "project-card";


    card.dataset.likes =
        Number(project.likes || 0);

    card.dataset.views =
        Number(project.views || 0);

    card.dataset.date =
        project.created_at || "";

    card.dataset.projectId =
        project.id;

    card.dataset.userProject =
        "true";


    const author =
        getProjectAuthor(project);


    card.innerHTML = `

        <div class="project-top">

            <span class="language">
                ${escapeHTML(project.language)}
            </span>

            <span class="ai-model">
                ${escapeHTML(project.ai)}
            </span>

        </div>


        <h3>
            ${escapeHTML(project.title)}
        </h3>


        <p>
            ${escapeHTML(project.description)}
        </p>


        <div class="tags">

            ${createTagsHTML(project)}

        </div>


        <div class="project-footer">

            <span>
                👤 ${escapeHTML(author)}
            </span>

            <div>

                <span>
                    ♥ ${Number(project.likes || 0)}
                </span>

                <span>
                    👁 ${Number(project.views || 0)}
                </span>

            </div>

        </div>

    `;


    /*
        appendChild thay vì prepend.

        Vì Supabase đã trả project mới nhất trước.
        Card database sẽ nằm sau các project mẫu.
    */

    projectGrid.appendChild(card);
}


// ======================================================
// XÓA CARD DATABASE CŨ TRƯỚC KHI LOAD LẠI
// ======================================================

function removeLoadedDatabaseProjects() {

    const databaseCards =
        document.querySelectorAll(
            '.project-card[data-user-project="true"]'
        );


    databaseCards.forEach(
        function (card) {

            card.remove();

        }
    );
}


// ======================================================
// LOAD PROJECT TỪ SUPABASE
// ======================================================

async function loadProjectsFromSupabase() {

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
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "Không thể tải project từ Supabase:",
                error
            );

            return;
        }


        removeLoadedDatabaseProjects();


        const projects =
            data || [];


        projects.forEach(
            function (project) {

                createUserProjectCard(
                    project
                );

            }
        );


        console.log(
            "Đã tải project từ Supabase:",
            projects.length
        );


    } catch (error) {

        console.error(
            "Lỗi khi tải project:",
            error
        );
    }
}


// ======================================================
// HỆ THỐNG TÌM KIẾM
// ======================================================

function searchProjects() {

    const keyword =
        searchInput.value
            .toLowerCase()
            .trim();


    const projectCards =
        getProjectCards();


    let foundProjects = 0;


    projectCards.forEach(
        function (card) {

            const content =
                card.innerText
                    .toLowerCase();


            if (
                content.includes(keyword)
            ) {

                card.style.display =
                    "flex";

                foundProjects++;

            } else {

                card.style.display =
                    "none";
            }

        }
    );


    if (foundProjects === 0) {

        noResults.style.display =
            "block";

        noResultsKeyword.innerText =
            searchInput.value;

    } else {

        noResults.style.display =
            "none";
    }


    document
        .querySelector(
            ".projects-section"
        )
        .scrollIntoView({

            behavior: "smooth",

            block: "start"

        });
}


// ======================================================
// NÚT TÌM KIẾM
// ======================================================

searchButton.addEventListener(
    "click",
    searchProjects
);


// ======================================================
// ENTER ĐỂ TÌM
// ======================================================

searchInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            searchProjects();
        }

    }
);


// ======================================================
// TAG FILTER
// ======================================================

const tagButtons =
    document.querySelectorAll(
        ".popular-tags button"
    );


tagButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                searchInput.value =
                    button.innerText
                        .trim();

                searchProjects();

            }
        );

    }
);


// ======================================================
// XÓA BỘ LỌC
// ======================================================

clearFilter.addEventListener(
    "click",
    function () {

        searchInput.value =
            "";

        searchProjects();

        searchInput.focus();

    }
);


// ======================================================
// SORT PROJECT
// ======================================================

sortProjects.addEventListener(
    "change",
    function () {

        const projects =
            Array.from(
                getProjectCards()
            );


        const sortType =
            sortProjects.value;


        // ===== TRENDING =====

        if (
            sortType === "trending"
        ) {

            projects.sort(
                function (a, b) {

                    const scoreA =
                        Number(
                            a.dataset.views || 0
                        ) +
                        Number(
                            a.dataset.likes || 0
                        );


                    const scoreB =
                        Number(
                            b.dataset.views || 0
                        ) +
                        Number(
                            b.dataset.likes || 0
                        );


                    return (
                        scoreB - scoreA
                    );

                }
            );

        }


        // ===== MỚI NHẤT =====

        if (
            sortType === "newest"
        ) {

            projects.sort(
                function (a, b) {

                    return (
                        new Date(
                            b.dataset.date || 0
                        ) -
                        new Date(
                            a.dataset.date || 0
                        )
                    );

                }
            );

        }


        // ===== NHIỀU LIKE =====

        if (
            sortType === "likes"
        ) {

            projects.sort(
                function (a, b) {

                    return (
                        Number(
                            b.dataset.likes || 0
                        ) -
                        Number(
                            a.dataset.likes || 0
                        )
                    );

                }
            );

        }


        projects.forEach(
            function (project) {

                projectGrid.appendChild(
                    project
                );

            }
        );

    }
);


// ======================================================
// CLICK PROJECT
// ======================================================

projectGrid.addEventListener(
    "click",
    function (event) {

        const card =
            event.target.closest(
                ".project-card"
            );


        if (!card) {

            return;
        }


        // ==================================================
        // PROJECT TỪ SUPABASE
        // ==================================================

        if (
            card.dataset.userProject ===
            "true"
        ) {

            window.location.href =
                "project.html?userProject=" +
                encodeURIComponent(
                    card.dataset.projectId
                );

            return;
        }


        // ==================================================
        // PROJECT MẪU
        // ==================================================

        const projectName =
            card
                .querySelector("h3")
                .innerText
                .trim();


        if (
            projectName ===
            "Minecraft HTML5"
        ) {

            window.location.href =
                "project.html?project=minecraft";

            return;
        }


        if (
            projectName ===
            "Discord AI Bot"
        ) {

            window.location.href =
                "project.html?project=discord";

            return;
        }


        if (
            projectName ===
            "Modern Portfolio"
        ) {

            window.location.href =
                "project.html?project=portfolio";

        }

    }
);


// ======================================================
// KHỞI ĐỘNG AI CODE HUB
// ======================================================

checkAuthSession();

loadProjectsFromSupabase();