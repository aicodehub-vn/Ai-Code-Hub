# WEBSITE FACTORY — v0.4 · Local-first Production Workspace

Website Factory là nhà máy tạo website tĩnh từ brief, **không tốn tiền AI/API**. V0.4 vận hành bằng 7 công đoạn có QA gate thật. Không mô phỏng đây là các AI Agent tự chủ: toàn bộ là **deterministic workers**, có thể thay thế bằng LLM adapter có xác thực trong bản sau.

## Đã có
- Tạo website đơn trang từ 4 mẫu ngành: Agency / Restaurant / SaaS / Portfolio.
- 4 palette, màu nhấn HEX, 2 layout, xem trước desktop/mobile trong iframe sandbox.
- Content Editor: thay tiêu đề section, giới thiệu, contact, CTA và 3 card dịch vụ; live preview.
- **Section Builder**: thêm tối đa 8 block mới (statement, quote, gallery, FAQ, pricing, team), xóa block tùy biến, kéo thả hoặc dùng phím lên/xuống để sắp xếp tất cả section. Section nền tảng luôn giữ để liên kết điều hướng hoạt động.
- **Asset Library**: tải PNG/JPEG/WebP từ máy, xử lý trên canvas để nhúng vào HTML dạng data URL; tối đa 5 ảnh, file nguồn <= 2 MB, chiều ảnh tối đa 40 MP khi giải mã. Chọn ảnh cho Hero hoặc Gallery, chỉnh alt text, xóa ảnh không dùng.
- **Motion Controls**: Off / Subtle / Expressive (CSS-only, ưu tiên prefers-reduced-motion, không cần JS trong website xuất).
- **Multi-page ZIP**: có thể chọn tối đa 3 trang phụ about.html, services.html, contact.html. Menu trang chính tự liên kết các trang có tạo; trang phụ chứa nội dung riêng và có đường về trang chủ. ZIP dùng phương pháp STORE (không nén thêm) và bộ tạo CRC32 nội bộ, không có dependency.
- **Tương thích cũ**: các dự án JSON v0.1/v0.2 không có layoutSpec hoặc assets vẫn mở được. Backup giữ thứ tự section và ảnh nhúng, dung lượng tối đa 1.8 MB.
- Agent Workspace: Brief → Design → Content → Build → QA → Repair → Export; xem trạng thái và lý do từng công đoạn.
- QA Gate 10 quy tắc: HTML5, lang, viewport, SEO description, H1, landmarks, internal anchors, standalone resources, responsive/reduced-motion, style block.
- Repair Worker: nếu builder trả HTML lỗi QA, thử phục hồi đúng 1 lần từ renderer chuẩn; nếu vẫn lỗi, chặn export.
- Lưu 25 cấu hình trên trình duyệt; export/import JSON có phiên bản schema 1; tải HTML một file tự chứa CSS.
- CLI zero-dependency và GitHub Actions sinh file `index.html` + `quality-report.json` dưới artifact `website-factory-output` (retention 7 ngày).

## Chạy giao diện cục bộ
Module ES trong trình duyệt cần server HTTP. Tại thư mục gốc repo, chạy:
```bash
python -m http.server 8000
```
Sau đó mở `http://localhost:8000/website-factory/`. **Không khuyến nghị mở index.html bằng file://** do browser có thể chặn import module.

## Sử dụng
1. Điền Creative Brief và chọn category/palette/layout.
2. Mở **Visual Content Editor** để chỉnh chữ, sau đó **Section Builder** để thêm, xóa hoặc thay vị trí các block. Mở **Asset Library** để thêm ảnh cục bộ cho Hero/Gallery. Nội dung được escape; không nhận raw HTML.
3. Theo dõi Live Preview và **Agent Workspace**. Nhấn **Chạy kiểm định** để xem QA. Chọn từng node để đọc chi tiết.
4. Chọn các trang phụ trong **Multi-page Export**, đặt animation trong Creative Brief. Xuất **HTML** một trang hoặc **Website ZIP** gồm các trang đã chọn; Backup JSON chứa cấu hình và ảnh. Export chặn khi QA không đạt.
5. Xuất bản thủ công bằng static hosting bạn chọn; công cụ không tự đăng hoặc tạo tên miền.

## Production từ GitHub Actions
- Vào **Actions > Website Factory CI**. Sau khi workflow đã có ở nhánh mặc định, chọn **Run workflow**, nhập tên/category/theme/brief (không nhập bí mật).
- Sau khi job thành công, tải artifact **website-factory-output** gồm `index.html` và `quality-report.json`.
- Khi workflow chỉ còn trên feature branch/PR mà chưa merge, nút `Run workflow` có thể chưa hiện ở giao diện Actions. Push và PR vẫn tự chạy job/đính kèm artifact.

Bạn cũng có thể chạy thủ công:
```bash
node website-factory/factory-cli.mjs
node website-factory/factory-cli.mjs --config my-project.factory.json
node --test website-factory/tests/*.test.mjs
```
Tệp đầu ra được ghi vào `website-factory/dist/`. `--config` nhận cấu hình thường hoặc bản sao lưu `{schemaVersion:1,config:{...}}`.

## Bảo mật và giới hạn
- Website xuất không có JS/CDN/ảnh remote. Hệ thống chưa có AI, CMS, nhiều trang, media library hoặc publish tự động.
- Dữ liệu project trong localStorage chỉ ở máy/trình duyệt hiện tại. Backup JSON khi cần đổi máy.
- PR đang nằm trong **repository public**. Nội dung commit, mã nguồn và workflow artifacts trong public repo có thể công khai. Không đưa dữ liệu riêng tư/API key vào brief hoặc GitHub workflow inputs.
- QA là structural smoke test, **không phải** kiểm thử trình duyệt thủ công, WCAG audit đầy đủ, bảo mật độc lập hay đo Lighthouse.
- Tự động Repair chỉ nhận các trường hợp có thể dựng lại bằng renderer chuẩn; không tự động viết lại mã tùy ý bằng AI.
- Hosting/Pages chưa được bật bởi PR này; `main` chưa được sửa. Trước khi public phải biên tập nội dung mẫu và kiểm tra link contact.

## Roadmap
- V0.3: chỉnh sửa trực quan theo block, thêm/xóa/sắp xếp section, asset manager và export nhiều file.
- V0.4: AI backend/local adapter, hợp đồng JSON schema, cách ly model output và review trước merge.
- V0.5: GitHub publish có OAuth/App scope tối thiểu, PR preview và xác nhận rõ trước xuất bản.

## Mã nguồn
- `engine.mjs`: theme renderer và schema content.
- `layout.mjs`: chuẩn hóa thứ tự, section và hình nhúng an toàn.
- `layout-editor.mjs`: thao tác kéo thả, điều hướng phím và asset library.
- `styles-extra.mjs`: CSS cho FAQ, Pricing, Team và animation.
- `site-bundle.mjs`: tạo trang HTML phụ riêng, kiểm tra liên kết.
- `zip.mjs`: ZIP STORE/CRC32 UTF-8 không thư viện ngoài.
- `app.mjs`, `index.html`, `studio.css`: UI, editor, project library, responsive graph.
- `pipeline.mjs`: 7 workers, QA, repair và export gate.
- `factory-cli.mjs`: CLI dành cho GitHub Actions.
- `tests/`: kiểm thử regression và security.
- `.github/workflows/website-factory-ci.yml`: CI và artifact producer.

Toàn bộ V0.4 nằm trong `website-factory/` và một workflow CI; không sửa website gốc của Ai-Code-Hub.
## Lưu ý dành cho bản V0.3
- Ảnh nằm trực tiếp trong HTML và file backup, nên kích thước file tăng. Không dùng hình riêng tư nếu bạn định đưa HTML ra internet.
- HTML chỉ cho phép data URL PNG/JPEG/WebP, không cho tài nguyên ngoài dạng srcset/CSS URL. Trình kiểm tra QA không thay thế kiểm toán bảo mật độc lập.
- Kéo thả dùng HTML Drag and Drop trên desktop; điện thoại có nút ↑ ↓ để thao tác chính xác.
- Phần UI chưa có kiểm thử E2E bằng trình duyệt thật. CI xác nhận syntax, unit/integration test và artifact generator; cần smoke test trước khi merge.

## V0.4 — Lưu ý về nhiều trang
- `index.html` luôn có toàn bộ các section, nên cũng hoạt động độc lập. Chỉ chọn các trang phụ nếu muốn có trang giới thiệu, dịch vụ và liên hệ riêng. Mỗi HTML đều có CSS nội tuyến, không phụ thuộc đường dẫn CSS bên ngoài.
- ZIP chỉ chứa HTML, không nén bằng thuật toán Deflate. Nếu có ảnh data URL, kích thước ZIP có thể đáng kể; có thể dùng static hosting thông thường để giải nén và đăng.
- FAQ dùng mỗi dòng `Câu hỏi | Trả lời`. Pricing dùng `Tên gói | Giá / mô tả`. Team dùng `Tên | Vai trò`. Tối đa 6 mục (Pricing 3 mục), dữ liệu được escape HTML.
- Job GitHub Actions kiểm tra zip độc lập qua Python `zipfile`, kiểm tra cú pháp JS và unit test, sau đó tạo artifact. Để Actions sinh nhiều trang từ cấu hình, gọi CLI với `--config path/to/backup.factory.json`; workflow mặc định chỉ sinh một trang theo inputs hiện có.
- V0.4 vẫn không có LLM tự lập trình, CMS, trình duyệt E2E, hosting hay tự động publish. Không lưu khóa bí mật trong website hoặc input workflow.
