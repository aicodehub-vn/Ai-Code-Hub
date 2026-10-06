// ======================================================
// AI CODE HUB - SUPABASE AUTH
// ======================================================


// ======================================================
// SUPABASE CONFIG
// ======================================================

const SUPABASE_URL =
    "https://cuokcbqrnneyxtqnpzbe.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_hMaUxO2w0SV7YngkZ_o6Ew_LYWxJja0";


// Thư viện Supabase được nạp từ login.html
const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ======================================================
// ELEMENTS
// ======================================================

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const showRegister =
    document.getElementById("showRegister");

const showLogin =
    document.getElementById("showLogin");

const authTitle =
    document.getElementById("authTitle");

const authDescription =
    document.getElementById("authDescription");

const loginMessage =
    document.getElementById("loginMessage");

const registerMessage =
    document.getElementById("registerMessage");

const forgotPassword =
    document.getElementById("forgotPassword");


// ======================================================
// CHUYỂN SANG ĐĂNG KÝ
// ======================================================

showRegister.addEventListener(
    "click",
    function () {

        loginForm.classList.add(
            "auth-hidden"
        );

        registerForm.classList.remove(
            "auth-hidden"
        );

        authTitle.textContent =
            "Tạo tài khoản";

        authDescription.textContent =
            "Tham gia AI Code Hub và chia sẻ project của bạn.";

        loginMessage.textContent = "";
        registerMessage.textContent = "";

    }
);


// ======================================================
// CHUYỂN SANG ĐĂNG NHẬP
// ======================================================

showLogin.addEventListener(
    "click",
    function () {

        registerForm.classList.add(
            "auth-hidden"
        );

        loginForm.classList.remove(
            "auth-hidden"
        );

        authTitle.textContent =
            "Chào mừng trở lại";

        authDescription.textContent =
            "Đăng nhập để chia sẻ và quản lý project của bạn.";

        loginMessage.textContent = "";
        registerMessage.textContent = "";

    }
);


// ======================================================
// HIỆN / ẨN MẬT KHẨU
// ======================================================

const passwordButtons =
    document.querySelectorAll(
        ".password-toggle"
    );

passwordButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                const targetID =
                    button.dataset.target;

                const input =
                    document.getElementById(
                        targetID
                    );

                if (!input) {
                    return;
                }

                if (
                    input.type ===
                    "password"
                ) {

                    input.type = "text";

                    button.textContent =
                        "Ẩn";

                } else {

                    input.type =
                        "password";

                    button.textContent =
                        "Hiện";

                }

            }
        );

    }
);


// ======================================================
// LOGIN THẬT VỚI SUPABASE
// ======================================================

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const email =
            document
                .getElementById(
                    "loginEmail"
                )
                .value
                .trim();

        const password =
            document
                .getElementById(
                    "loginPassword"
                )
                .value;

        if (!email || !password) {

            showMessage(
                loginMessage,
                "Vui lòng nhập đầy đủ email và mật khẩu.",
                "error"
            );

            return;

        }


        const submitButton =
            loginForm.querySelector(
                'button[type="submit"]'
            );

        setButtonLoading(
            submitButton,
            true,
            "Đang đăng nhập..."
        );

        showMessage(
            loginMessage,
            "Đang kiểm tra tài khoản...",
            ""
        );


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .signInWithPassword({
                        email: email,
                        password: password
                    });


            if (error) {

                showMessage(
                    loginMessage,
                    translateAuthError(
                        error.message
                    ),
                    "error"
                );

                return;

            }


            if (
                !data ||
                !data.user
            ) {

                showMessage(
                    loginMessage,
                    "Không thể đăng nhập. Vui lòng thử lại.",
                    "error"
                );

                return;

            }


            showMessage(
                loginMessage,
                "✓ Đăng nhập thành công! Đang quay về AI Code Hub...",
                "success"
            );


            setTimeout(
                function () {

                    window.location.href =
                        "index.html";

                },
                900
            );

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            showMessage(
                loginMessage,
                "Không thể kết nối tới máy chủ. Hãy kiểm tra Internet và thử lại.",
                "error"
            );

        } finally {

            setButtonLoading(
                submitButton,
                false,
                "Đăng nhập"
            );

        }

    }
);


// ======================================================
// REGISTER THẬT VỚI SUPABASE
// ======================================================

registerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const name =
            document
                .getElementById(
                    "registerName"
                )
                .value
                .trim();


        const email =
            document
                .getElementById(
                    "registerEmail"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "registerPassword"
                )
                .value;


        const confirmPassword =
            document
                .getElementById(
                    "confirmPassword"
                )
                .value;


        if (
            !name ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            showMessage(
                registerMessage,
                "Vui lòng nhập đầy đủ thông tin.",
                "error"
            );

            return;

        }


        if (name.length < 2) {

            showMessage(
                registerMessage,
                "Tên hiển thị phải có ít nhất 2 ký tự.",
                "error"
            );

            return;

        }


        if (password.length < 6) {

            showMessage(
                registerMessage,
                "Mật khẩu phải có ít nhất 6 ký tự.",
                "error"
            );

            return;

        }


        if (
            password !==
            confirmPassword
        ) {

            showMessage(
                registerMessage,
                "Hai mật khẩu không trùng khớp.",
                "error"
            );

            return;

        }


        const submitButton =
            registerForm.querySelector(
                'button[type="submit"]'
            );


        setButtonLoading(
            submitButton,
            true,
            "Đang tạo tài khoản..."
        );


        showMessage(
            registerMessage,
            "Đang tạo tài khoản...",
            ""
        );


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .signUp({

                        email: email,

                        password: password,

                        options: {

                            data: {
                                display_name: name
                            }

                        }

                    });


            if (error) {

                showMessage(
                    registerMessage,
                    translateAuthError(
                        error.message
                    ),
                    "error"
                );

                return;

            }


            if (
                data &&
                data.session
            ) {

                showMessage(
                    registerMessage,
                    "✓ Tạo tài khoản thành công! Đang vào AI Code Hub...",
                    "success"
                );


                setTimeout(
                    function () {

                        window.location.href =
                            "index.html";

                    },
                    1000
                );

                return;

            }


            showMessage(
                registerMessage,
                "✓ Tạo tài khoản thành công! Hãy kiểm tra email để xác nhận tài khoản.",
                "success"
            );


            registerForm.reset();

        } catch (error) {

            console.error(
                "Register error:",
                error
            );


            showMessage(
                registerMessage,
                "Không thể kết nối tới máy chủ. Hãy kiểm tra Internet và thử lại.",
                "error"
            );

        } finally {

            setButtonLoading(
                submitButton,
                false,
                "Tạo tài khoản"
            );

        }

    }
);


// ======================================================
// QUÊN MẬT KHẨU
// ======================================================

forgotPassword.addEventListener(
    "click",
    async function () {

        const email =
            document
                .getElementById(
                    "loginEmail"
                )
                .value
                .trim();


        if (!email) {

            showMessage(
                loginMessage,
                "Nhập email của bạn trước, sau đó bấm Quên mật khẩu.",
                "error"
            );

            return;

        }


        showMessage(
            loginMessage,
            "Đang gửi email khôi phục mật khẩu...",
            ""
        );


        try {

            const {
                error
            } =
                await supabaseClient
                    .auth
                    .resetPasswordForEmail(
                        email
                    );


            if (error) {

                showMessage(
                    loginMessage,
                    translateAuthError(
                        error.message
                    ),
                    "error"
                );

                return;

            }


            showMessage(
                loginMessage,
                "✓ Đã gửi email khôi phục mật khẩu. Hãy kiểm tra hộp thư.",
                "success"
            );

        } catch (error) {

            console.error(
                "Password reset error:",
                error
            );


            showMessage(
                loginMessage,
                "Không thể gửi email khôi phục. Hãy thử lại.",
                "error"
            );

        }

    }
);


// ======================================================
// KIỂM TRA NẾU ĐÃ ĐĂNG NHẬP
// ======================================================

async function checkExistingSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {
            return;
        }


        if (
            data &&
            data.session
        ) {

            showMessage(
                loginMessage,
                "Bạn đang đăng nhập. Đang quay về trang chủ...",
                "success"
            );


            setTimeout(
                function () {

                    window.location.href =
                        "index.html";

                },
                700
            );

        }

    } catch (error) {

        console.error(
            "Session check error:",
            error
        );

    }

}


// ======================================================
// MESSAGE
// ======================================================

function showMessage(
    element,
    message,
    type
) {

    element.textContent =
        message;


    element.classList.remove(
        "error",
        "success"
    );


    if (
        type === "error" ||
        type === "success"
    ) {

        element.classList.add(
            type
        );

    }

}


// ======================================================
// BUTTON LOADING
// ======================================================

function setButtonLoading(
    button,
    loading,
    text
) {

    if (!button) {
        return;
    }


    button.disabled =
        loading;


    button.textContent =
        text;

}


// ======================================================
// DỊCH MỘT SỐ LỖI AUTH
// ======================================================

function translateAuthError(
    message
) {

    const errorMessage =
        String(
            message || ""
        ).toLowerCase();


    if (
        errorMessage.includes(
            "invalid login credentials"
        )
    ) {

        return "Email hoặc mật khẩu không đúng.";

    }


    if (
        errorMessage.includes(
            "email not confirmed"
        )
    ) {

        return "Email chưa được xác nhận. Hãy kiểm tra hộp thư của bạn.";

    }


    if (
        errorMessage.includes(
            "user already registered"
        )
    ) {

        return "Email này đã được đăng ký.";

    }


    if (
        errorMessage.includes(
            "password should be"
        )
    ) {

        return "Mật khẩu chưa đủ mạnh hoặc quá ngắn.";

    }


    if (
        errorMessage.includes(
            "invalid email"
        )
    ) {

        return "Địa chỉ email không hợp lệ.";

    }


    if (
        errorMessage.includes(
            "rate limit"
        )
    ) {

        return "Bạn thao tác quá nhanh. Hãy chờ một lúc rồi thử lại.";

    }


    return message ||
        "Đã xảy ra lỗi. Vui lòng thử lại.";

}


// ======================================================
// KHỞI ĐỘNG
// ======================================================

checkExistingSession();