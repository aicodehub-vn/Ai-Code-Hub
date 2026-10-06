// ======================================================
// AI CODE HUB - MAIN JAVASCRIPT
// ======================================================


// ===== HTML ELEMENTS =====

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

const noResults = document.getElementById("noResults");
const noResultsKeyword = document.getElementById("noResultsKeyword");
const clearFilter = document.getElementById("clearFilter");

const sortProjects = document.getElementById("sortProjects");
const projectGrid = document.querySelector(".project-grid");

const uploadButton = document.querySelector(".upload-btn");


// ======================================================
// NÚT + ĐĂNG CODE
// ======================================================

uploadButton.addEventListener("click", function() {

    window.location.href = "upload.html";

});


// ======================================================
// LẤY PROJECT CARDS HIỆN TẠI
// ======================================================

function getProjectCards() {

    return document.querySelectorAll(".project-card");

}


// ======================================================
// TẠO CARD CHO PROJECT NGƯỜI DÙNG ĐĂNG
// ======================================================

function createUserProjectCard(project) {

    const card = document.createElement("article");

    card.className = "project-card";

    card.dataset.likes = project.likes || 0;
    card.dataset.views = project.views || 0;
    card.dataset.date = project.date;
    card.dataset.projectId = project.id;
    card.dataset.userProject = "true";


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

            <span>
                #${createTag(project.language)}
            </span>

            <span>
                #AI
            </span>

            <span>
                #community
            </span>

        </div>


        <div class="project-footer">

            <span>
                👤 ${escapeHTML(project.author)}
            </span>

            <div>

                <span>
                    ♥ ${project.likes || 0}
                </span>

                <span>
                    👁 ${project.views || 0}
                </span>

            </div>

        </div>

    `;


    // Project mới nằm đầu danh sách
    projectGrid.prepend(card);

}


// ======================================================
// CHỐNG CHÈN HTML VÀO CARD
// ======================================================

function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = String(value ?? "");

    return div.innerHTML;

}


// ======================================================
// TẠO TAG ĐƠN GIẢN
// ======================================================

function createTag(language) {

    return String(language)
        .toLowerCase()
        .replaceAll(" ", "")
        .replaceAll("/", "")
        .replaceAll("#", "sharp")
        .replaceAll("+", "plus");

}


// ======================================================
// ĐỌC PROJECT ĐÃ LƯU
// ======================================================

function loadSavedProjects() {

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

        savedProjects = [];

    }


    savedProjects.forEach(function(project) {

        createUserProjectCard(project);

    });

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


    projectCards.forEach(function(card) {

        const content =
            card.innerText.toLowerCase();


        if (content.includes(keyword)) {

            card.style.display = "flex";

            foundProjects++;

        } else {

            card.style.display = "none";

        }

    });


    if (foundProjects === 0) {

        noResults.style.display = "block";

        noResultsKeyword.innerText =
            searchInput.value;

    } else {

        noResults.style.display = "none";

    }


    document
        .querySelector(".projects-section")
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
    function(event) {

        if (event.key === "Enter") {

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


tagButtons.forEach(function(button) {

    button.addEventListener(
        "click",
        function() {

            searchInput.value =
                button.innerText.trim();

            searchProjects();

        }
    );

});


// ======================================================
// XÓA BỘ LỌC
// ======================================================

clearFilter.addEventListener(
    "click",
    function() {

        searchInput.value = "";

        searchProjects();

        searchInput.focus();

    }
);


// ======================================================
// SORT PROJECT
// ======================================================

sortProjects.addEventListener(
    "change",
    function() {

        const projects =
            Array.from(
                getProjectCards()
            );


        const sortType =
            sortProjects.value;


        // ===== TRENDING =====

        if (sortType === "trending") {

            projects.sort(
                function(a, b) {

                    const scoreA =
                        Number(a.dataset.views) +
                        Number(a.dataset.likes);


                    const scoreB =
                        Number(b.dataset.views) +
                        Number(b.dataset.likes);


                    return scoreB - scoreA;

                }
            );

        }


        // ===== MỚI NHẤT =====

        if (sortType === "newest") {

            projects.sort(
                function(a, b) {

                    return (
                        new Date(b.dataset.date) -
                        new Date(a.dataset.date)
                    );

                }
            );

        }


        // ===== NHIỀU LIKE =====

        if (sortType === "likes") {

            projects.sort(
                function(a, b) {

                    return (
                        Number(b.dataset.likes) -
                        Number(a.dataset.likes)
                    );

                }
            );

        }


        projects.forEach(
            function(project) {

                projectGrid.appendChild(
                    project
                );

            }
        );

    }
);


// ======================================================
// CLICK PROJECT
// Dùng event delegation để cả card mới cũng hoạt động
// ======================================================

projectGrid.addEventListener(
    "click",
    function(event) {

        const card =
            event.target.closest(
                ".project-card"
            );


        if (!card) {

            return;

        }


        // ===== PROJECT DO NGƯỜI DÙNG ĐĂNG =====

        if (
            card.dataset.userProject === "true"
        ) {

            window.location.href =
                "project.html?userProject=" +
                encodeURIComponent(
                    card.dataset.projectId
                );

            return;

        }


        // ===== PROJECT MẪU =====

        const projectName =
            card.querySelector("h3")
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
// KHỞI ĐỘNG MAIN HUB
// ======================================================

loadSavedProjects();