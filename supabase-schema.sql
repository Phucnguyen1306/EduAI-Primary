-- ========================================================
-- EDUAI PRIMARY - SUPABASE REALTIME & DATABASE SCHEMA
-- Bảng chuyên biệt: 'classes', 'assignments', 'submissions'
-- Hỗ trợ Realtime Subscription đa người dùng tức thì (0ms trễ, 0đ phí)
-- ========================================================

-- 1. BẢNG DANH SÁCH LỚP HỌC & HỌC SINH (classes)
create table if not exists public.classes (
  id text primary key,
  name text not null,
  grade text not null,
  school_year text default '2026-2027',
  students jsonb default '[]'::jsonb,
  folder_path text,
  roster_approved boolean default false,
  is_auto_created_from_excel boolean default false,
  payload jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. BẢNG ĐỀ BÀI KIỂM TRA & BÀI TẬP (assignments)
create table if not exists public.assignments (
  id text primary key,
  code text,
  title text not null,
  grade text not null,
  class_name text,
  target_class_names text[],
  file_type text not null default 'docx',
  student_prompt text,
  standard_file_name_pattern text,
  checklist jsonb default '[]'::jsonb,
  theory_exam jsonb,
  is_semester_exam boolean default false,
  template_summary jsonb,
  payload jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. BẢNG BÀI NỘP CỦA HỌC SINH & KẾT QUẢ CHẤM (submissions)
create table if not exists public.submissions (
  id text primary key,
  student_id text,
  student_name text not null,
  class_name text not null,
  grade text,
  assignment_id text not null,
  assignment_title text not null,
  file_type text not null default 'docx',
  original_file_name text,
  standardized_file_name text,
  submitted_at text not null,
  ai_score numeric default 0,
  final_score numeric default 0,
  approval_status text default 'pending',
  needs_attention boolean default false,
  detected_errors text[],
  criterion_breakdown jsonb default '[]'::jsonb,
  personalized_feedback text,
  inspection jsonb,
  mcq_details jsonb,
  practice_work_image_data_url text,
  drive_file_id text,
  drive_web_view_link text,
  drive_assignment_folder_id text,
  drive_assignment_folder_name text,
  drive_assignment_folder_link text,
  drive_root_folder_url text,
  drive_synced boolean default false,
  payload jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. BẢNG LƯU TRỮ TRẠNG THÁI TOÀN HỆ THỐNG & NHẬN XÉT TT27 (eduai_system_state)
create table if not exists public.eduai_system_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ========================================================
-- CẤU HÌNH REPLICA IDENTITY (Cực kỳ quan trọng cho Realtime UPDATE/DELETE)
-- ========================================================
alter table public.classes replica identity full;
alter table public.assignments replica identity full;
alter table public.submissions replica identity full;
alter table public.eduai_system_state replica identity full;

-- ========================================================
-- KÍCH HOẠT ROW LEVEL SECURITY (RLS) & TẠO POLICIES CHO PHÉP ĐỌC/GHI CÔNG KHAI
-- Giúp học sinh và giáo viên trao đổi đề và bài nộp thông suốt
-- ========================================================
alter table public.classes enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.eduai_system_state enable row level security;

-- Policies cho bảng classes
drop policy if exists "Allow public all on classes" on public.classes;
create policy "Allow public all on classes" on public.classes for all using (true) with check (true);

-- Policies cho bảng assignments
drop policy if exists "Allow public all on assignments" on public.assignments;
create policy "Allow public all on assignments" on public.assignments for all using (true) with check (true);

-- Policies cho bảng submissions
drop policy if exists "Allow public all on submissions" on public.submissions;
create policy "Allow public all on submissions" on public.submissions for all using (true) with check (true);

-- Policies cho bảng eduai_system_state
drop policy if exists "Allow public all on eduai_system_state" on public.eduai_system_state;
create policy "Allow public all on eduai_system_state" on public.eduai_system_state for all using (true) with check (true);

-- ========================================================
-- KÍCH HOẠT REALTIME SUBSCRIPTION TRÊN TẤT CẢ CÁC BẢNG
-- Cho phép phát sóng thay đổi (INSERT, UPDATE, DELETE) ngay lập tức tới mọi trình duyệt
-- ========================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.classes;
alter publication supabase_realtime add table public.assignments;
alter publication supabase_realtime add table public.submissions;
alter publication supabase_realtime add table public.eduai_system_state;

-- ========================================================
-- 5. BẢNG GHI CHÚ (notes)
-- ========================================================
create table if not exists public.notes (
  id bigint primary key generated always as identity,
  title text not null
);

alter table public.notes enable row level security;

drop policy if exists "public can read notes" on public.notes;
create policy "public can read notes"
on public.notes
for select to anon
using (true);

drop policy if exists "Allow public all on notes" on public.notes;
create policy "Allow public all on notes" on public.notes for all using (true) with check (true);

alter publication supabase_realtime add table public.notes;


