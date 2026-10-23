# Website Factory — v0.1

Nhà máy tạo website local-first. Chạy bằng HTML/CSS/JavaScript thuần, không cần API key, backend hay npm install.

## Chức năng
- 4 loại website: creative agency, restaurant, SaaS, portfolio.
- 4 bảng màu, tùy chọn màu HEX, 2 bố cục hero.
- Preview desktop/mobile trong iframe sandbox, không cấp quyền script.
- Lưu 25 dự án trong localStorage trình duyệt.
- Xuất HTML tự chứa CSS, copy toàn bộ mã nguồn.
- Responsive layout, nội dung tiếng Việt, chế độ reduced motion.
- Kiểm thử Node.js và GitHub Actions.

## Sử dụng
1. Mở website-factory/index.html trên trình duyệt, hoặc chạy thư mục bằng static server.
2. Nhập tên, loại website và brief; chọn bảng màu, layout.
3. Nhấn Tạo / cập nhật website, kiểm tra bản desktop/mobile.
4. Xuất HTML và upload đến GitHub Pages, Cloudflare Pages, Netlify hoặc host tĩnh khác.

Trong repo này Website Factory nằm ở thư mục riêng; chưa được deploy. Nếu main được cấu hình cho GitHub Pages, sau khi merge có thể mở đường dẫn /Ai-Code-Hub/website-factory/.

## Kiểm thử (Node.js >=20)
```bash
node --check website-factory/engine.mjs
node --check website-factory/app.mjs
node --test website-factory/tests/*.test.mjs
```

## An toàn và giới hạn
- v0.1 là generator dựa trên mẫu, KHÔNG phải hệ thống AI prompt-to-code.
- Website xuất ra không phụ thuộc ảnh, CDN, thư viện hoặc JavaScript bên ngoài.
- User text được HTML-escape; email và mã màu được kiểm tra.
- Preview iframe sandbox không cấp script / same-origin.
- Dự án trong localStorage không đồng bộ qua thiết bị và có thể mất nếu xóa dữ liệu trình duyệt.
- Cần rà soát nội dung mẫu trước khi đưa lên production. Chưa hỗ trợ CMS, database, website nhiều trang, assets, domain, tự publish hay AI API.

## Roadmap
v0.2: visual section editor + xuất/nhập JSON + ZIP đa tệp.
v0.3: image library có kiểm soát bản quyền + chuyển động + SEO/a11y QA.
v0.4: AI adapter qua backend/local model + schema validation + human review (không để secret ở frontend).
v0.5: GitHub App/OAuth publish với quyền tối thiểu và yêu cầu xác nhận.

## Thành phần
- index.html — giao diện Studio.
- studio.css — giao diện và responsive.
- engine.mjs — chuẩn hóa, mẫu website, HTML renderer.
- app.mjs — tương tác người dùng, preview, lưu và xuất.
- tests/engine.test.mjs — test cases.
- .github/workflows/website-factory-ci.yml — CI.

Không ghi đè hoặc sửa các tệp website hiện tại trong thư mục gốc Ai-Code-Hub.