# Hướng dẫn Thiết lập Supabase cho Ứng dụng Mandarin Learn (Convo)

Ứng dụng Mandarin Learn (Convo) sử dụng **Supabase** cho việc quản lý cơ sở dữ liệu (PostgreSQL), xác thực người dùng (Auth), và xử lý logic các AI Roleplay thông qua Edge Functions (Deno).

Có hai các tiếp cận để chạy Supabase đối với dự án này: **Sử dụng Supabase Cloud** hoặc **Chạy Supabase Local bằng Docker**.

---

## Cách 1: Sử dụng Supabase Cloud (Khuyên dùng)

Theo luồng thiết kế của dự án, thao tác với tài khoản Supabase Cloud (gói Free Tier dư sức cho Development) là cách **mượt mà và ít thiết lập rườm rà nhất**. 

### 1. Đăng ký & Lấy thông vị trí
- Truy cập trang chủ [Supabase](https://supabase.com) và tạo một Project miễn phí.
- Sau khi Project chạy xong, lấy URL và Anon Key từ phần **Project Settings > API**.

### 2. Cấu hình Biến Môi trường
Tạo file `.env.local` ở thư mục gốc của dự án và điền thông tin:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your_anon_key
```

### 3. Đồng bộ Database và Tải Edge Functions Lên Cloud
Để kết nối Supabase của máy tính với Project Cloud vừa tạo:

```bash
# Đăng nhập vào Supabase bằng CLI
npx supabase login

# Khai báo mã Project (lấy trên dashboard cloud của bạn)
npx supabase link --project-ref YOUR_PROJECT_REF

# Đẩy schema cơ sở dữ liệu của app lên Cloud
npx supabase db push
```

Sau khi database xong, bạn tiến hành triển khai (deploy) **toàn bộ Edge Functions đang được app/backend sử dụng**:
```bash
npx supabase functions deploy chat-completion
npx supabase functions deploy transcribe-audio
npx supabase functions deploy scenario-generate
npx supabase functions deploy start-trial
npx supabase functions deploy hsk-session-init
npx supabase functions deploy hsk-sync-events
npx supabase functions deploy hsk-mock-exam-start
npx supabase functions deploy hsk-mock-exam-submit-section
npx supabase functions deploy hsk-writing-evaluate
npx supabase functions deploy hsk-refresh-question-bank
npx supabase functions deploy revenuecat-webhook
```

Nếu thiếu các function HSK ở trên, các màn `HSK Prep`, `HSK Exam`, đồng bộ tiến độ học, và chấm bài viết sẽ lỗi khi runtime. Nếu thiếu `revenuecat-webhook`, trạng thái premium đồng bộ từ RevenueCat về Supabase sẽ không còn là authoritative như kiến trúc hiện tại.

### 4. Cấp quyền API Keys cho Edge Functions Server
App sử dụng Edge Functions để gọi OpenRouter và đồng bộ một số luồng backend. Thiết lập secrets tối thiểu như sau:
```bash
npx supabase secrets set OPENROUTER_API_KEY=your_openrouter_key
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Thiết lập thêm các secrets sau nếu bạn dùng các tính năng tương ứng:

```bash
# Bắt buộc nếu dùng RevenueCat/subscription sync
npx supabase secrets set REVENUECAT_WEBHOOK_SECRET=your_revenuecat_webhook_secret

# Bắt buộc nếu muốn gọi function refresh ngân hàng câu hỏi HSK từ luồng admin/tooling
npx supabase secrets set HSK_REFRESH_ADMIN_KEY=your_hsk_refresh_admin_key
```

Lưu ý:
- `SUPABASE_URL` và `SUPABASE_ANON_KEY` được Supabase cung cấp sẵn cho Edge Functions khi chạy trên Supabase Cloud, bạn không cần tự set thủ công.
- `OPENROUTER_API_KEY` hiện được dùng bởi `chat-completion`, `transcribe-audio`, `scenario-generate`, `hsk-writing-evaluate`, và `hsk-refresh-question-bank`.

### 5. Cấu hình Magic Link 
Vào Dashboard Supabase > **Authentication** > **URL Configuration**. Kiểm tra và thêm `convo://auth/callback` vào mục **Redirect URLs** để app trên điện thoại có thể quay lại sau khi đăng nhập.

---

## Cách 2: Chạy Supabase Local (Offline/Nội bộ)

Chỉ lựa chọn cách này nếu bạn muốn phát triển hoàn toàn offline và sẵn sàng tự thiết lập Proxy/Network bridge cho Emulator và Localhost.

### 1. Yêu cầu Cài đặt
Bạn bắt buộc phải cài đặt xong phần mềm **Docker Desktop** (và đảm bảo Docker engine đang chạy).

### 2. Khởi chạy Local Supabase
Mở cửa sổ Terminal tại thư mục gốc của `mandarin-learn` và gõ:

```bash
npx supabase start
```
Thao tác này sẽ tải bộ Supabase Suite Container về máy. Khi hoàn thành, Terminal sẽ in ra thông số: `API URL` (thường là `http://127.0.0.1:54321`) và `anon key`.

### 3. Sửa thông số môi trường
Cập nhật file `.env.local` theo thông số thiết lập cục bộ vừa sinh ra:

```env
EXPO_PUBLIC_SUPABASE_URL=http://<IP_MÁY_TÍNH_HOẶC_LOCALHOST>:54321
EXPO_PUBLIC_SUPABASE_KEY=<LOCAL_ANON_KEY>
```

### 4. Xử lý Edge Functions và Magic Link dưới Local
Ở mode local, Edge Functions có thể được serve bằng lệnh `npx supabase functions serve`.
Sau đó, bạn cần thiết lập `.env` hỗ trợ cho function chạy ngầm để nạp ít nhất `OPENROUTER_API_KEY` và `SUPABASE_SERVICE_ROLE_KEY`. Nếu bạn dùng subscription sync thì thêm `REVENUECAT_WEBHOOK_SECRET`; nếu dùng tooling để refresh ngân hàng câu hỏi HSK thì thêm `HSK_REFRESH_ADMIN_KEY`.
Lưu ý quan trọng: vì sử dụng IP nội bộ, hệ điều hành Android/iOS Emulator có thể gặp lỗi kết nối tới `127.0.0.1`. Bạn cần trỏ `URL` về IP LAN thực tế của máy tính (ví dụ: `http://192.168.1.5:54321`) hoặc tuỳ chỉnh reverse proxy / Ngrok cho các tác vụ Auth deep-linking (`convo://auth/callback`).

---

**Kết luận:** Với app mobile framework React Native/Expo + OpenRouter + DeepLinking, **áp dụng Cách 1 (Supabase Cloud)** giúp giảm thiểu tới 80% cấu hình và lỗi hạ tầng, giúp bạn tập trung hoàn toàn vào việc xây dựng giao diện và logic của app Mandarin Learn.
