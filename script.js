// ======================================================
// AI CODE HUB - MAIN JAVASCRIPT
// SUPABASE + PROFILES VERSION
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


// ===== AUTH =====

const loginButton =
    document.getElementById("loginButton");

const userArea =
    document.getElementById("userArea");

const userButton =
    document.getElementById("userButton");

const logoutButton =
    document.getElementById("logoutButton");


// ======================================================
// STATE
// ======================================================

let currentUser = null;


// Lưu profile theo UUID
// Ví dụ:
// profilesById["abc-123"] = { username: "Klein0989" }

let profilesById = {};


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
// AUTH UI
// ======================================================

function updateAuthUI(user) {

    currentUser = user;


    if (!user) {

        if (loginButton) {
            loginButton.style.display =
                "inline-flex";
        }

        if (userArea) {
            userArea.style.display =
                "none";
        }

        if (userButton) {
            userButton.textContent =
                "👤 Tài khoản";
        }

        return;
    }


    if (loginButton) {
        loginButton.style.display =
            "none";
    }

    if (userArea) {
        userArea.style.display =
            "flex";
    }


    const profile =
        profilesById[user.id];


    const displayName =
        profile?.username ||
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "Tài khoản";


    if (userButton) {

        userButton.textContent =
            "👤 " + displayName;
    }
}


// ======================================================
// LOAD PROFILES
// ======================================================

async function loadProfiles() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "id, username, avatar_url, bio, created_at"
                );


        if (error) {

            console.error(
                "Không thể tải profiles:",
                error
            );

            return;
        }


        profilesById = {};


        (data || []).forEach(
            function (profile) {

                profilesById[
                    profile.id
                ] = profile;

            }
        );


        console.log(
            "Đã tải profiles:",
            Object.keys(
                profilesById
            ).length
        );


    } catch (error) {

        console.error(
            "Lỗi khi tải profiles:",
            error
        );
    }
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
            await supabaseClient.auth
                .getSession();


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
// AUTH CHANGE
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

if (logoutButton) {

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
                    await supabaseClient.auth
                        .signOut();


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
}


// ======================================================
// + ĐĂNG CODE
// ======================================================

if (uploadButton) {

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
}


// ======================================================
// PROJECT CARDS
// ======================================================

function getProjectCards() {

    return document.querySelectorAll(
        ".project-card"
    );
}


// ======================================================
// LẤY TÊN TÁC GIẢ THẬT
// ======================================================

function getProjectAuthor(project) {

    const profile =
        profilesById[
            project.user_id
        ];


    if (
        profile &&
        profile.username
    ) {

        return profile.username;
    }


    return "Cộng đồng";
}


// ======================================================
// TAG HTML
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
                .map(
                    function (tag) {

                        return tag
                            .trim()
                            .replace(
                                /^#/,
                                ""
                            );
                    }
                )
                .filter(Boolean);
    }


    if (tags.length === 0) {

        tags = [
            createTag(
                project.language
            ),
            "AI",
            "community"
        ];
    }


    return tags
        .slice(0, 3)
        .map(
            function (tag) {

                return `
                    <span>
                        #${escapeHTML(tag)}
                    </span>
                `;
            }
        )
        .join("");
}


// ======================================================
// TẠO CARD PROJECT DATABASE
// ======================================================

function createUserProjectCard(project) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "project-card";


    card.dataset.likes =
        Number(
            project.likes || 0
        );


    card.dataset.views =
        Number(
            project.views || 0
        );


    card.dataset.date =
        project.created_at || "";


    card.dataset.projectId =
        project.id;


    card.dataset.userProject =
        "true";


    card.dataset.ownerId =
        project.user_id || "";


    const author =
        getProjectAuthor(project);


    card.innerHTML = `

        <div class="project-top">

            <span class="language">
                ${escapeHTML(
                    project.language
                )}
            </span>

            <span class="ai-model">
                ${escapeHTML(
                    project.ai
                )}
            </span>

        </div>


        <h3>
            ${escapeHTML(
                project.title
            )}
        </h3>


        <p>
            ${escapeHTML(
                project.description
            )}
        </p>


        <div class="tags">

            ${createTagsHTML(
                project
            )}

        </div>


        <div class="project-footer">

            <span>
                👤 ${escapeHTML(author)}
            </span>

            <div>

                <span>
                    ♥ ${Number(
                        project.likes || 0
                    )}
                </span>

                <span>
                    👁 ${Number(
                        project.views || 0
                    )}
                </span>

            </div>

        </div>

    `;


    projectGrid.appendChild(
        card
    );
}


// ======================================================
// XÓA CARD DATABASE CŨ
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
// LOAD PROJECTS
// ======================================================

async function loadProjectsFromSupabase() {

    try {

        // ==================================================
        // 1. LẤY PROJECT
        // ==================================================

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


        const databaseProjects =
            data || [];


        // ==================================================
        // 2. LẤY TOÀN BỘ LIKE THẬT
        // ==================================================

        const {
            data: likeRows,
            error: likeError
        } =
            await supabaseClient
                .from("project_likes")F
                .select("project_id");

                alert(
    "LIKE ROWS: " +
    JSON.stringify(likeRows) +
    "\n\nERROR: " +
    JSON.stringify(likeError)
);


        if (likeError) {

            console.error(
                "Không thể tải lượt thích:",
                likeError
            );
        }


        // ==================================================
        // 3. ĐẾM LIKE THEO TỪNG PROJECT
        // ==================================================

        const likeCountByProject = {};


        (likeRows || []).forEach(
            function (row) {

                const projectID =
                    row.project_id;


                if (
                    likeCountByProject[
                        projectID
                    ] === undefined
                ) {

                    likeCountByProject[
                        projectID
                    ] = 0;
                }


                likeCountByProject[
                    projectID
                ]++;
            }
        );


        // ==================================================
        // 4. GÁN LIKE THẬT VÀO PROJECT
        // ==================================================

        databaseProjects.forEach(
            function (project) {

                project.likes =
                    likeCountByProject[
                        project.id
                    ] || 0;

                    alert(
    "PROJECT ID: " +
    project.id +
    "\nLIKE COUNT: " +
    project.likes
);


                createUserProjectCard(
                    project
                );
            }
        );


        console.log(
            "Đã tải project:",
            databaseProjects.length
        );


        console.log(
            "Like thật:",
            likeCountByProject
        );


    } catch (error) {

        console.error(
            "Lỗi khi tải project:",
            error
        );
    }
}


// ======================================================
// SEARCH
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
                content.includes(
                    keyword
                )
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
        ?.scrollIntoView(
            {
                behavior: "smooth",
                block: "start"
            }
        );
}


// ======================================================
// SEARCH BUTTON
// ======================================================

if (searchButton) {

    searchButton.addEventListener(
        "click",
        searchProjects
    );
}


// ======================================================
// ENTER SEARCH
// ======================================================

if (searchInput) {

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
}


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
// CLEAR FILTER
// ======================================================

if (clearFilter) {

    clearFilter.addEventListener(
        "click",
        function () {

            searchInput.value =
                "";

            searchProjects();

            searchInput.focus();
        }
    );
}


// ======================================================
// SORT
// ======================================================

if (sortProjects) {

    sortProjects.addEventListener(
        "change",
        function () {

            const projectCards =
                Array.from(
                    getProjectCards()
                );


            const sortType =
                sortProjects.value;


            if (
                sortType === "trending"
            ) {

                projectCards.sort(
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
                            scoreB -
                            scoreA
                        );
                    }
                );
            }


            if (
                sortType === "newest"
            ) {

                projectCards.sort(
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


            if (
                sortType === "likes"
            ) {

                projectCards.sort(
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


            projectCards.forEach(
                function (card) {

                    projectGrid.appendChild(
                        card
                    );
                }
            );
        }
    );
}


// ======================================================
// CLICK PROJECT
// ======================================================

if (projectGrid) {

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


            // DATABASE PROJECT

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


            // PROJECT MẪU

            const projectName =
                card
                    .querySelector("h3")
                    ?.innerText
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
}


// ======================================================
// KHỞI ĐỘNG
// ======================================================

async function initializeAIHub() {

    // Quan trọng:
    // phải lấy profiles TRƯỚC
    // rồi mới dựng project cards.

    await loadProfiles();

    await checkAuthSession();

    await loadProjectsFromSupabase();
}


initializeAIHub();