# Website Factory — V0.6

Nhà máy tạo website tĩnh **local-first** chạy trong trình duyệt. Phần sinh website không cần API, LLM, đăng nhập, CDN hay backend. Các trạm "Agent Workspace" hiện vẫn là **workers theo quy tắc**, không phải AI Agent tự trị.

## Trải nghiệm hiện có

- Creative Brief: 4 mẫu ngành (agency / restaurant / SaaS / portfolio), 4 palette, màu accent HEX, bố cục hero split/centered, tùy chọn motion Off/Subtle/Expressive. CSS xuất ra luôn hỗ trợ `prefers-reduced-motion`.
- Visual Content Editor: sửa hero, section, mô tả, 3 card, CTA, nội dung liên hệ.
- Section Builder: 3 section cơ sở và tối đa 8 section tùy biến; Statement, Quote, Gallery, FAQ, Pricing, Team. Kéo thả desktop hoặc dùng nút ↑/↓ để sắp xếp.
- Asset Library: tải PNG/JPEG/WebP có quyền sử dụng, xử lý trên trình duyệt rồi nhúng thành data URL; giới hạn 5 ảnh và 2 MB/ảnh nguồn; dùng cho Hero/Gallery.
- **Undo / Redo**: lưu tối đa 12 snapshot phiên làm việc, bao gồm cấu hình, section và media. Không ghi lịch sử này lên mạng; đổi dự án sẽ bắt đầu lịch sử mới.
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

- Đây là **template-based builder**, chưa phải prompt-to-code AI. Sẽ cần backend hoặc mô hình local, schema validation, review của con người trước khi nhận output do LLM viết. Không đặt API key vào JavaScript frontend.
- Chỉ hỗ trợ website tĩnh; chưa có CMS, database, đăng nhập người dùng, thanh toán, form backend, xuất bản/domain tự động hoặc xây dựng website tự do bằng AI.
- Đã có screenshot baseline V0.5 và cross-browser smoke, nhưng chưa có kiểm thử đa thiết bị vật lý, kiểm tra manual WCAG chuyên sâu, security pentest hoặc benchmark tải lớn.
- Hình trong HTML/JSON làm tệp lớn hơn; ảnh nguồn cần có quyền sử dụng. Mỗi backup giới hạn 1,8 MB.
- V0.7 định hướng: khắc phục tồn đọng thiết kế, tăng phạm vi accessibility/performance trước khi cân nhắc adapter AI an toàn.

## Mã nguồn

- `engine.mjs`, `layout.mjs`, `styles-extra.mjs`: chuẩn hóa và kết xuất giao diện.
- `layout-editor.mjs`, `app.mjs`, `history.mjs`: thao tác Studio, lịch sử chỉnh sửa, lưu và import/export.
- `site-bundle.mjs`, `zip.mjs`, `factory-cli.mjs`: nhiều trang, đóng gói và CLI.
- `pipeline.mjs`: QA gate, stages, deterministic repair.
- `tests/*.test.mjs`: unit/regression; `tests/e2e/studio.spec.mjs`: Chromium; `cross-browser.spec.mjs`: ba trình duyệt; `audit.spec.mjs`: axe/performance; `visual.spec.mjs`: V0.5 baseline pixel comparison.
- `playwright.config.mjs`, `.github/workflows/website-factory-ci.yml`: browser runner và CI.

Mọi thay đổi trên nhánh feature được cách ly trong `website-factory/` và workflow CI; không sửa các website tại thư mục gốc repository.
