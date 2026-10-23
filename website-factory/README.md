# Website Factory — Autopilot V1 (V0.8 Studio retained)

Nhà máy tạo website tĩnh **local-first** chạy trong trình duyệt. Phần sinh website không cần API, đăng nhập, CDN hay backend. **AI là mô-đun tùy chọn** qua Node local-only bridge, không phải điều kiện để sử dụng website builder. Các trạm "Agent Workspace" vẫn là **workers theo quy tắc**; AI chỉ có quyền đề xuất văn bản có cấu trúc và không tự thay đổi mã nguồn.

## Autopilot — dây chuyền tự động

**Đã có mã cho quy trình không giám sát sau một lần kích hoạt:**

`autopilot.recipe.json` → Validation → AI tùy chọn → Content/Design → HTML Generator → 10 QA checks → Repair chuẩn → Multi-page link audit → ZIP → Independent Python ZIP verification → Chromium smoke → Artifact → *GitHub Release (opt-in)*.

### Cách 1: Tự chạy khi sửa brief trên GitHub

1. Mở [`autopilot.recipe.json`](autopilot.recipe.json), cập nhật `project.name`, `project.brief`, `category`, `theme`, `layout`, `motion` và `extraPages` rồi commit/push.
2. GitHub Actions workflow [`Website Factory Autopilot`](../.github/workflows/website-factory-autopilot.yml) tự chạy trên `main` và nhánh `feat/website-factory-*` khi recipe hoặc file Autopilot được thay đổi. Từ nhánh khác, chạy workflow thủ công khi đã xuất hiện trên `main`.
3. Mở workflow đã chạy; nếu cả `build` và `browser-smoke` PASS, tải artifact `website-factory-autopilot-site`. Artifact gồm các trang HTML, `site.zip` và `quality-report.json` (giữ 14 ngày). `website-factory-autopilot-review` chứa screenshot trang vừa tạo.

**Chú ý:** Bản demo recipe mặc định tự xây một site 4 trang bằng template **offline**, không sử dụng AI và không phát sinh chi phí gọi mô hình. Chỉ các thay đổi nằm trên nhánh hợp lệ hoặc lần kích hoạt hợp lệ mới tạo job; không có tác vụ agent chạy liên tục.

### Cách 2: Chạy một lệnh trên Windows

Yêu cầu Node.js 22+ và repository đã clone. Trong thư mục gốc:

```powershell
node website-factory/factory-autopilot.mjs --config website-factory/autopilot.recipe.json
```

Output nằm trong `website-factory/autopilot-dist/` (đã được gitignore). Không cần npm install cho công đoạn tạo website. Các bước sau trigger tự chạy, bao gồm xây nhiều trang, QA và ZIP.

### Cách 3: AI tự viết nội dung rồi xây site

Muốn AI hoạt động tự động **trong một lần chạy đã cấp quyền**, đặt repository **Variables** `FACTORY_AI_API_URL` (địa chỉ HTTPS `/v1/chat/completions`) và `FACTORY_AI_MODEL`; đặt repository **Secret** `FACTORY_AI_API_KEY`, sau đó khi workflow có mặt trên `main`, vào `Actions > Website Factory Autopilot > Run workflow` và chọn:

- `ai_mode=optional`: gọi model nếu đã bật/cấu hình; nếu model lỗi, JSON sai schema hoặc có tuyên bố đáng nghi, tự fallback sang template và ghi rõ `ai.fallback` trong báo cáo.
- `ai_mode=required`: bắt buộc gọi model và kiểm tra JSON; model không kết nối/không đạt → FAIL, **không xuất bản kết quả sai**.
- `enable_remote_ai=true`: cấp quyền cho đúng lượt chạy này được gọi provider (có thể tính phí). Nếu `false`, provider bị vô hiệu hóa. Các lượt `push` và `pull_request` **luôn chạy offline**, không tự động tiêu thụ API key.
- `publish_release=false` (mặc định): chỉ tạo artifact. `true` trên `main` sẽ **tự phát hành ZIP và báo cáo dưới dạng GitHub Release công khai**, sau khi Chromium smoke PASS. Không thể publish từ PR/feature branch và không dùng thay thế hosting.

Model phải hỗ trợ API OpenAI-compatible chat-completions và phản hồi đúng JSON. **Chưa xác nhận hoạt động với model thực**; CI chỉ thử model giả lập. Không nhập API key hay nội dung bí mật trực tiếp vào recipe công khai. Trình tạo website chỉ chấp nhận nội dung có schema, không chạy JS/HTML do AI viết. Bộ kiểm tra tuyên bố đáng nghi là heuristic hạn chế, **không thay thế người biên tập/fact-checking**.

### Các trạng thái trong `quality-report.json`

Report ghi `passed`, `pages`, `checks`, `stages`, `warnings`, `ai.mode`, `ai.applied`, `ai.fallback`. Chế độ offline sẽ ghi AI `skipped`; khi AI optional gặp lỗi sẽ có `fallback`. `required` mà AI lỗi sẽ trả exit code khác 0, job thất bại và không phát hành.

### Phạm vi tự động hóa

| Công đoạn | Tự động sau trigger? |
|---|---|
| Đọc recipe, dựng site, QA, phục hồi theo mẫu, kiểm tra link, ZIP | Có |
| Test thật trên Chromium desktop/mobile, upload artifact | Có khi chạy GitHub Actions |
| Gọi AI để viết nội dung | Có, **chỉ khi cho phép và cung cấp model** |
| Công bố ZIP lên public GitHub Releases | Có, **chỉ khi bật `publish_release` trên main** |
| Triển khai website lên GitHub Pages/domain/hosting | **Chưa**, cần cấu hình đích, để tránh ghi đè Ai Code Hub hiện hữu |
| AI tùy ý tự viết mã HTML/CSS/JS hoặc quản lý domain | **Chưa**, chưa có sandbox/production deploy |

GitHub Release là gói tải xuống, **không phải website trực tuyến**. Đây là mức tự động hóa đầu-cuối đối với **tạo, kiểm tra và đóng gói website**, không phải lời cam kết mọi bước xuất bản trên bất kỳ hosting nào đều được tự động hoàn toàn.

## Trải nghiệm hiện có

- Creative Brief: 4 mẫu ngành (agency / restaurant / SaaS / portfolio), 4 palette, màu accent HEX, bố cục hero split/centered, tùy chọn motion Off/Subtle/Expressive. CSS xuất ra luôn hỗ trợ `prefers-reduced-motion`.
- Visual Content Editor: sửa hero, section, mô tả, 3 card, CTA, nội dung liên hệ.
- Section Builder: 3 section cơ sở và tối đa 8 section tùy biến; Statement, Quote, Gallery, FAQ, Pricing, Team. Kéo thả desktop hoặc dùng nút ↑/↓ để sắp xếp.
- Asset Library: tải PNG/JPEG/WebP có quyền sử dụng, xử lý trên trình duyệt rồi nhúng thành data URL; giới hạn 5 ảnh và 2 MB/ảnh nguồn; dùng cho Hero/Gallery.
- **Undo / Redo**: lưu tối đa 12 snapshot phiên làm việc, bao gồm cấu hình, section và media. Không ghi lịch sử này lên mạng; đổi dự án sẽ bắt đầu lịch sử mới.
- **AI Proposal Review (V0.7–V0.8):** opt-in cục bộ, nhận đề xuất cấu hình từ API OpenAI-compatible; bắt buộc đồng ý gửi brief, xem diff, chấp nhận/bỏ. Dữ liệu AI trả về phải vượt strict JSON schema; chỉ thay headline, theme, layout và nội dung có thể chỉnh sửa. Không gửi dữ liệu riêng tư, ảnh, email hoặc API key từ trình duyệt.
- Live Preview desktop/mobile trong `iframe sandbox=""`, không cho phép chạy script.
- Export 1 HTML tự chứa CSS hoặc ZIP nhiều trang gồm `index.html`, và tùy chọn `about.html`, `services.html`, `contact.html`. ZIP dùng STORE và CRC32, không thư viện runtime.
- Lưu tối đa 25 dự án vào localStorage, backup/import JSON v1. Nội dung ảnh được giữ trong backup. Nếu hết quota localStorage, hãy xuất backup thay vì dựa vào bộ nhớ trình duyệt.

## Chạy Studio

Khởi động static server từ **thư mục gốc của repository**, rồi mở `http://localhost:8000/website-factory/`:

```bash
python -m http.server 8000
```

Trên Windows có thể dùng `py -m http.server 8000`. Không mở trực tiếp bằng `file://`, vì trình duyệt có thể chặn ES Modules.

1. Tạo website bằng Creative Brief, chọn màu và motion.
2. Mở Content Editor / Section Builder để chỉnh nội dung và thứ tự section; dùng Asset Library để thêm ảnh của mình.
3. Bấm **Chạy kiểm định** để xem từng trạm và Quality Report. QA phải đạt trước khi xuất.
4. Dùng **Hoàn tác / Làm lại** khi đang chỉnh; nhấn **Lưu dự án** để lưu trong máy. Dùng **Backup JSON** trước khi dọn dữ liệu trình duyệt.
5. Dùng **Xuất HTML** hoặc **Website ZIP**, giải nén rồi đưa các tệp HTML lên dịch vụ hosting tĩnh. Công cụ không tự phát hành website.

## Tùy chọn AI — V0.8

**Mặc định OFF, không gọi mô hình.** Chạy bằng static server Python vẫn sử dụng được toàn bộ Website Factory offline; nút AI sẽ bị khóa. Muốn dùng AI, chạy Node bridge thay static server (Node.js 22+), và tự cấu hình endpoint API chat-completions tương thích OpenAI. Chi phí/quota/model phụ thuộc nhà cung cấp; không có model hay API key kèm theo repository.

### Ví dụ dùng mô hình local trên Windows PowerShell

Cần có mô hình local **đang chạy** và hỗ trợ OpenAI-compatible endpoint, ví dụ phần mềm/model server do bạn tự cài đặt. Trong thư mục gốc repository:

```powershell
$env:FACTORY_AI_ENABLED = '1'
$env:FACTORY_AI_API_URL = 'http://127.0.0.1:1234/v1/chat/completions'
$env:FACTORY_AI_MODEL = 'YOUR_LOCAL_MODEL_ID'
node website-factory/ai-server.mjs
```

Sau đó mở `http://127.0.0.1:8765/website-factory/`, mở **AI Proposal Review**, đọc danh sách dữ liệu được chia sẻ, tích xác nhận, nhấn **Đề xuất bằng AI**. Đọc từng thay đổi rồi chọn **Chấp nhận** hoặc **Bỏ**. Đề xuất chỉ được áp dụng khi người dùng nhấn duyệt, sau đó QA chạy như trước; có thể Undo.

Các biến cấu hình:

- `FACTORY_AI_ENABLED=1`: bật opt-in; mặc định tắt.
- `FACTORY_AI_API_URL`: **URL đầy đủ** tới endpoint chat-completions, chỉ cho phép HTTPS hoặc loopback HTTP.
- `FACTORY_AI_MODEL`: model ID được nhà cung cấp endpoint hỗ trợ.
- `FACTORY_AI_API_KEY`: thiết lập bí mật trong **môi trường tiến trình máy chủ** khi dùng HTTPS remote; không đưa khóa vào URL, form, file JSON, mã nguồn, commit hoặc workflow input.
- `FACTORY_PORT`: mặc định `8765`. Server chỉ bind `127.0.0.1`, không mở mạng LAN/internet.
- `FACTORY_AI_MAX_REQUESTS`: tối đa số yêu cầu tới mô hình trong mỗi **60 giây**, mặc định **6**, hợp lệ **1–60**. Giới hạn tính theo tiến trình bridge; restart sẽ xóa bộ đếm.
- `FACTORY_AI_JSON_MODE`: `1` (mặc định) gửi `response_format: {"type":"json_object"}`. Đặt `0` cho model server không hỗ trợ tham số này; **dù tắt JSON mode, AI output vẫn phải là JSON hợp lệ theo schema**. Không bảo đảm mọi model server đều hỗ trợ đầy đủ API chat completions.

**Dữ liệu gửi đi khi người dùng cho phép:** tên thương hiệu, ngành, headline hiện tại, brief mô tả, theme, layout. **Không gửi:** email, media, nội dung riêng trong các section, danh sách project, API key hoặc source code.

**V0.8 vận hành và chi phí:** bridge chỉ nhận **một yêu cầu đang xử lý tại một thời điểm**. Yêu cầu đồng thời hoặc vượt quota nhận HTTP 429 kèm `Retry-After`, không gọi provider. Không có tự động retry để tránh chi phí trùng. Phản hồi từ provider được đọc có giới hạn 20 KB ngay trong stream; nếu vượt, kết quả bị từ chối. Không tạo cache/persist brief hoặc output, không ghi log nội dung brief/API key. Quota là **giới hạn tần suất**, không phải hạn mức token, tiền, billing hay quota nhà cung cấp. Các request hỏng sau khi gửi tới provider vẫn tính quota, vì vẫn có thể tốn chi phí.

**Bảo vệ và giới hạn:** bridge có timeout 25 giây, giới hạn request 4 KB và output, kiểm tra same-origin, trả lỗi chung thay vì trả raw provider response. AI output chỉ là JSON, không được chứa HTML/JS hay trường dữ liệu ngoài schema. Tên, liên hệ, ảnh, extra sections, animation và trang phụ được giữ nguyên. AI-generated copy vẫn có thể sai sự thật; cần tự kiểm duyệt trước khi xuất bản. Chưa có bản chạy thực sự được chứng minh với một model remote/local do người dùng cấu hình; CI kiểm chứng luồng với provider giả lập.

### Ví dụ PowerShell cấu hình V0.8 không tốn API key

Ví dụ này chỉ chạy được khi máy đã có local model server tương thích và model ID hợp lệ:

```powershell
$env:FACTORY_AI_ENABLED = '1'
$env:FACTORY_AI_API_URL = 'http://127.0.0.1:1234/v1/chat/completions'
$env:FACTORY_AI_MODEL = 'YOUR_LOCAL_MODEL_ID'
$env:FACTORY_AI_MAX_REQUESTS = '4'
$env:FACTORY_AI_JSON_MODE = '0'   # Chỉ khi provider không nhận response_format
node website-factory/ai-server.mjs
```

Có thể xóa `$env:FACTORY_AI_JSON_MODE` hoặc đặt `1` nếu provider hỗ trợ JSON mode. Giữ bridge trong cửa sổ terminal; Ctrl+C để dừng. Để dùng AI qua HTTPS, cấu hình `FACTORY_AI_API_KEY` ở môi trường server và đảm bảo đã biết chính sách thanh toán của nhà cung cấp. **Đừng đưa API key vào README hoặc command đã commit.**

### Kiểm thử không cần mô hình thật

```bash
node --test website-factory/tests/ai-contract.test.mjs website-factory/tests/ai-server.test.mjs
```

Playwright còn kiểm thử xác nhận opt-in, hiển thị diff, áp dụng, Undo, trạng thái offline và từ chối JSON không an toàn. Mock được tách biệt và không giả là LLM thực.

## Kiểm thử và nghiệm thu

### Kiểm thử cấu trúc và đóng gói (không phụ thuộc npm)

```bash
node --check website-factory/engine.mjs
node --test website-factory/tests/*.test.mjs
node website-factory/factory-cli.mjs
node website-factory/factory-cli.mjs --config my-project.factory.json
```

CLI sinh website tại `website-factory/dist/` và báo cáo `quality-report.json`. Ngoài 10 QA rules cho HTML chính, builder kiểm tra liên kết giữa các trang phụ. ZIP cũng được kiểm tra giải nén độc lập bằng Python `zipfile` trên GitHub Actions.

### Browser E2E — Playwright / Chromium, Firefox, WebKit

Không cần Playwright khi chỉ dùng Studio. **Chỉ môi trường phát triển/CI** mới cần cài test runner. Tại thư mục `website-factory/`:

```bash
npm install --no-save --no-package-lock @playwright/test@1.64.1 @axe-core/playwright@4.10.2 pixelmatch@6.0.0 pngjs@7.0.0
npx playwright install chromium firefox webkit
npx playwright test --config playwright.config.mjs
```

Playwright tự khởi động HTTP server cục bộ ở cổng 8765. Các bài E2E kiểm tra việc khởi tạo, preview, chỉnh nội dung, chế độ mobile, thêm/sắp xếp section, lưu/mở dự án, tải và nhúng ảnh, backup/import, ZIP/HTML export, undo/redo và chống tràn ngang mobile.

### Các lớp kiểm tra V0.6
- **Cross-browser:** chạy smoke tạo/chỉnh/xuất website trên Chromium, Firefox và WebKit. Bộ regression V0.5 đầy đủ vẫn chạy trên Chromium.
- **WCAG audit:** dùng axe-core trên giao diện Studio và trang HTML độc lập; lưu JSON chi tiết và chặn các vi phạm mức **serious/critical** thuộc nhóm WCAG A/AA được chọn. Vi phạm mức thấp hơn vẫn xuất báo cáo, không có nghĩa là sản phẩm đã đạt chứng chỉ WCAG.
- **Performance budget:** kiểm tra tài nguyên chỉ tải cục bộ, dung lượng resource và HTML xuất ra trong giới hạn, cộng thời gian DOMContentLoaded với ngưỡng CI bảo thủ. Có báo cáo JSON, không thay thế Lighthouse.
- **Visual regression:** checkout commit V0.5 cố định `4977889c87ec93b0324d58699b9c63fb8e74fdb0` dưới thư mục `reference/`; render cùng dữ liệu và Chromium trong phiên kiểm tra; so sánh screenshot Hero/Services cho 4 palette. Chặn khi thay đổi quá 1.5% pixel trên mỗi ảnh; lưu ảnh baseline, actual và diff. Đây là baseline có thực, không phải snapshot sinh mới từ chính phiên bản đang kiểm tra. Test chỉ chạy trong CI với biến `FACTORY_VISUAL_BASELINE=1`.
- Artifact `website-factory-quality-audits` chứa các ảnh visual diff và kết quả WCAG/performance. Giữ artifacts 7 ngày.

Workflow `.github/workflows/website-factory-ci.yml` chạy 2 jobs:

- **verify**: kiểm tra cú pháp, unit tests, CLI build, ZIP interoperability, upload `website-factory-output`.
- **browser-e2e**: sau khi verify pass, cài Chromium + Firefox + WebKit, chạy Playwright cùng accessibility, performance và visual audit; lưu screenshot desktop/mobile, ảnh diff và báo cáo JSON. Khi lỗi, trace và ảnh debug lưu trong `website-factory-browser-failures`.

Artifact được lưu 7 ngày. Chromium E2E là kiểm thử tự động thực tế, **không thay thế** review thiết kế bằng mắt, kiểm thử đa trình duyệt, kiểm tra accessibility WCAG chuyên sâu, pentest hoặc Lighthouse performance audit.

## GitHub Actions và riêng tư

Repository `aicodehub-vn/Ai-Code-Hub` đang **public**, PR feature giữ chế độ **Draft**, chưa merge và chưa deploy. Không nhập khóa API, brief bảo mật hoặc ảnh riêng tư vào commit, workflow input hoặc artifact.

Khi workflow hiện diện trên nhánh mặc định, bạn có thể dùng `Actions > Website Factory CI > Run workflow` để chọn tên, ngành, theme, motion và danh sách trang phụ (ví dụ `about,services`). Nếu workflow còn riêng trong feature branch, nút Run workflow có thể chưa xuất hiện; chạy push/PR vẫn tự động.

## Giới hạn và định hướng tiếp theo

- Đây là **template-based builder** có module AI đề xuất copy có kiểm soát, **không phải prompt-to-code AI tự viết HTML/CSS/JS**. Muốn AI thực sự dựng các trang tự do cần thiết kế thêm build sandbox, static analysis, schema ràng buộc và cơ chế phê duyệt. Không đặt API key vào JavaScript frontend.
- Chỉ hỗ trợ website tĩnh; chưa có CMS, database, đăng nhập người dùng, thanh toán, form backend, xuất bản/domain tự động hoặc xây dựng website tự do bằng AI.
- Đã có screenshot baseline V0.5 và cross-browser smoke, nhưng chưa có kiểm thử đa thiết bị vật lý, kiểm tra manual WCAG chuyên sâu, security pentest hoặc benchmark tải lớn.
- Hình trong HTML/JSON làm tệp lớn hơn; ảnh nguồn cần có quyền sử dụng. Mỗi backup giới hạn 1,8 MB.
- V0.9 định hướng: thêm cảnh báo factual claims để người dùng duyệt nội dung AI kỹ hơn, tăng độ tương thích provider thực và đo token/cost tùy nhà cung cấp nếu API có cung cấp usage. Không tự động deploy hay viết mã tùy ý.

## Mã nguồn

- `ai-contract.mjs`, `ai-policy.mjs`, `ai-server.mjs`, `ai-ui.mjs`: JSON schema, quota/concurrency gate không lưu brief, local AI bridge và UI xét duyệt đề xuất.
- `engine.mjs`, `layout.mjs`, `styles-extra.mjs`: chuẩn hóa và kết xuất giao diện.
- `layout-editor.mjs`, `app.mjs`, `history.mjs`: thao tác Studio, lịch sử chỉnh sửa, lưu và import/export.
- `site-bundle.mjs`, `zip.mjs`, `factory-cli.mjs`: nhiều trang, đóng gói và CLI.
- `pipeline.mjs`: QA gate, stages, deterministic repair.
- `tests/*.test.mjs`: unit/regression; `tests/e2e/studio.spec.mjs`: Chromium; `cross-browser.spec.mjs`: ba trình duyệt; `audit.spec.mjs`: axe/performance; `visual.spec.mjs`: V0.5 baseline pixel comparison.
- `playwright.config.mjs`, `.github/workflows/website-factory-ci.yml`: browser runner và CI.

Mọi thay đổi trên nhánh feature được cách ly trong `website-factory/` và workflow CI; không sửa các website tại thư mục gốc repository.

**Tài liệu cấp repository:** [README gốc](../README.md) giới thiệu hai phần độc lập Ai Code Hub và Website Factory, kèm Quickstart.
