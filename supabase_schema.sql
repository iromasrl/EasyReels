-- Create projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  topic text not null,
  style text not null,
  status text not null default 'queued', -- queued, processing_script, processing_audio, processing_visuals, rendering, completed, failed
  script jsonb,
  audio_url text,
  image_urls text[],
  video_url text,
  error_message text
);

-- Create storage bucket for assets
insert into storage.buckets (id, name, public) values ('assets', 'assets', true);

-- Set up RLS (Row Level Security) - Optional for MVP but good practice
alter table public.projects enable row level security;

-- Allow public read access (for now, for simplicity)
create policy "Public projects are viewable by everyone"
  on public.projects for select
  using ( true );

-- Allow insert/update via service role (backend) - implicit bypass, but good to be explicit if using client SDK
