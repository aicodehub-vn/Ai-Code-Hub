# Ai-Code-Hub

Repository chứa website **Ai Code Hub** ở thư mục gốc và dự án phụ **Website Factory** trong `website-factory/`. Hai sản phẩm độc lập, không dùng chung engine hoặc cơ sở dữ liệu.

## Website Factory — Autopilot V1

**Website Factory** là công cụ tạo website tĩnh bằng trình duyệt (local-first), có chỉnh nội dung, section, ảnh, motion, xuất HTML/ZIP và QA. Có mô-đun AI **tùy chọn** để đề xuất nội dung bằng JSON; AI không tự viết/chạy mã hay tự xuất bản website.

**[📖 Mở README đầy đủ của Website Factory](website-factory/README.md)** · **[🧩 Xem mã nguồn Studio](website-factory/)** · **[✅ Theo dõi GitHub Actions](https://github.com/aicodehub-vn/Ai-Code-Hub/actions/workflows/website-factory-ci.yml)**

### Dây chuyền tự động: Brief → Build → QA → ZIP

Không cần mở Studio để tạo website. Chỉnh tệp **[`website-factory/autopilot.recipe.json`](website-factory/autopilot.recipe.json)** rồi push lên nhánh được CI theo dõi; [Website Factory Autopilot](.github/workflows/website-factory-autopilot.yml) tự chạy:

1. Kiểm thử Node và kiểm tra cấu hình recipe.
2. Chọn chế độ AI (mặc định **OFF** để không tốn tiền) → dựng trang, QA, tự phục hồi bằng template chuẩn khi cần.
3. Kiểm tra liên kết, xuất HTML + ZIP, giải nén kiểm tra CRC.
4. Chạy Chromium với website **vừa được tạo**, chụp ảnh desktop/mobile.
5. Đính kèm artifact `website-factory-autopilot-site` và báo cáo QA cho mỗi lượt chạy thành công.

Chạy trên máy (Node.js 22+):

```powershell
node website-factory/factory-autopilot.mjs
```

Xem kết quả trong `website-factory/autopilot-dist/`. **Tạo website và xuất gói sau trigger là tự động.** Public GitHub Release cần bật `publish_release=true` trên `main`. GitHub Pages có thể tự cập nhật website tại `/factory-site/` sau QA nếu bật `deploy_pages=true` trên workflow hoặc cấu hình repository variable `FACTORY_PUBLISH_PAGES=1` (và thiết lập Pages Source = GitHub Actions). Không tự bật Pages, chỉnh DNS hoặc đưa website lên domain riêng. Để sử dụng AI thật phải cấu hình endpoint/model và cấp quyền gọi riêng; pipeline vẫn hoạt động hoàn chỉnh với mẫu offline.

**[Xem workflow và các lần chạy](https://github.com/aicodehub-vn/Ai-Code-Hub/actions/workflows/website-factory-autopilot.yml)** · **[Hướng dẫn Autopilot đầy đủ](website-factory/README.md#autopilot--dây-chuyền-tự-động)**

### Khởi động nhanh (không dùng AI)

Yêu cầu Python 3. Từ thư mục gốc repository:

```powershell
py -m http.server 8000
```

Sau đó mở **http://localhost:8000/website-factory/**. Trên Linux/macOS có thể dùng `python3 -m http.server 8000`.

### Khởi động với AI tùy chọn

Yêu cầu Node.js 22+ và **một mô hình hoặc nhà cung cấp hỗ trợ OpenAI-compatible chat completions** đã được cấu hình riêng. Ví dụ nếu bạn đã bật local model server trên cổng 1234:

```powershell
$env:FACTORY_AI_ENABLED = '1'
$env:FACTORY_AI_API_URL = 'http://127.0.0.1:1234/v1/chat/completions'
$env:FACTORY_AI_MODEL = 'YOUR_LOCAL_MODEL_ID'
node website-factory/ai-server.mjs
```

Mở **http://127.0.0.1:8765/website-factory/**, mở **AI Proposal Review** và xác nhận rõ dữ liệu sẽ được gửi trước mỗi lần yêu cầu. Đề xuất phải được xem trước và chấp nhận thủ công. **Không đưa API key vào file HTML, brief, commit hay GitHub Actions inputs.**

Đối với nhà cung cấp từ xa, phải dùng HTTPS và thiết lập `FACTORY_AI_API_KEY` trong môi trường máy chủ. AI mặc định **OFF**; không có tài khoản, API key hay gói miễn phí nào đi kèm dự án.

### Kiểm thử nhanh

```powershell
node --test website-factory/tests/*.test.mjs
node website-factory/factory-cli.mjs
```

GitHub Actions còn chạy Chromium, Firefox, WebKit, bài kiểm tra visual regression, accessibility và ngân sách hiệu năng. Playwright là dependency **chỉ dành cho CI/phát triển**.

## Repository và trạng thái

| Đường dẫn | Chức năng |
|---|---|
| `index.html`, `style.css`, `script.js` và các file HTML/JS tại root | Website Ai Code Hub có sẵn |
| `website-factory/` | Công cụ Website Factory |
| `website-factory/ai-server.mjs` | Optional local-only AI bridge |
| `website-factory/tests/` | Unit và browser regression tests |
| `.github/workflows/website-factory-ci.yml` | CI / build artifact |

Website Factory hiện đang được phát triển trong nhánh `feat/website-factory-v1`, [Draft PR #1](https://github.com/aicodehub-vn/Ai-Code-Hub/pull/1), **chưa merge vào `main` hoặc triển khai hosting**. Repository này **public**: không commit bí mật hay dữ liệu cá nhân. Nhánh mặc định có thể chưa hiển thị README/tính năng mới trước khi được merge.

## Phạm vi hiện tại

Website Factory tạo trang web từ mẫu và dữ liệu do người dùng/AI đề xuất, không phải mạng lưới autonomous agents viết mã nguồn tùy ý. Không có CMS, backend người dùng, dịch vụ deploy tự động hoặc live provider đã được xác thực độc lập. Chi tiết, giới hạn và xử lý lỗi: [Website Factory README](website-factory/README.md).

## Quyền sử dụng

README này không tự cấp giấy phép mã nguồn. Nếu repository chưa có file LICENSE, không mặc định coi mã nguồn là open source có quyền tái sử dụng.
