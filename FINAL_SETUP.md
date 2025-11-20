# 🎬 EasyReels - Setup Finale

## ✅ Stato Attuale

- ✅ Tutte le API keys configurate
- ✅ Redis in esecuzione
- ✅ Dev server attivo (http://localhost:3000)
- ✅ Worker attivo e in ascolto

## 📝 ULTIMO PASSO: Crea il Database

### 1. Apri Supabase SQL Editor
Vai su: https://supabase.com/dashboard/project/mftagtkxzxbeokekjtkf/sql/new

### 2. Copia e Incolla questo SQL

```sql
-- Create projects table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  topic text not null,
  style text not null,
  status text not null default 'queued',
  script jsonb,
  audio_url text,
  image_urls text[],
  video_url text,
  error_message text
);

-- Enable RLS
alter table public.projects enable row level security;

-- Allow public read access
create policy "Public projects are viewable by everyone"
  on public.projects for select
  using ( true );

-- Allow insert/update via service role (implicit bypass)
create policy "Service role can insert"
  on public.projects for insert
  with check ( true );

create policy "Service role can update"
  on public.projects for update
  using ( true );
```

### 3. Crea il Storage Bucket

Vai su: https://supabase.com/dashboard/project/mftagtkxzxbeokekjtkf/storage/buckets

1. Clicca "New bucket"
2. Nome: `assets`
3. Public bucket: ✅ (checked)
4. Clicca "Create bucket"

## 🚀 Test del Sistema

### 1. Apri l'App
http://localhost:3000

### 2. Crea il Primo Video
- Topic: "Il mistero del triangolo delle Bermuda"
- Style: "Cinematic"
- Clicca "Generate Video"

### 3. Monitora il Progresso
- La dashboard si aggiornerà automaticamente ogni 5 secondi
- Vedrai lo status cambiare:
  - `queued` → `processing_script` → `processing_audio` → `processing_visuals` → `rendering` → `completed`

### 4. Controlla i Log del Worker
Nel terminale dove gira `npm run worker` vedrai:
```
Processing job xxx for project yyy
Generating script...
Generating audio...
Generating images...
Rendering video...
Job completed!
```

## ⏱️ Tempi Stimati

- Script generation: ~10-15s
- Audio generation: ~5-10s
- Image generation: ~30-60s (10 immagini)
- Video rendering: ~60-120s

**Totale: ~2-3 minuti per un video di 60s**

## 🐛 Troubleshooting

### Il video non si genera
1. Controlla i log del worker
2. Verifica che il bucket `assets` esista
3. Verifica che la tabella `projects` esista

### Errore "Table projects does not exist"
→ Hai dimenticato di eseguire lo script SQL sopra

### Errore "Bucket assets not found"
→ Crea il bucket come descritto sopra

### Il worker si blocca
→ Controlla i log per vedere dove si ferma
→ Potrebbe essere un problema con le API keys (quota esaurita)

## 💰 Costi per Video (60s)

- GPT-4o (script): ~$0.02
- OpenAI TTS (audio): ~$0.01
- Flux (10 immagini): ~$0.20
- **Totale: ~$0.23/video**

## 🎯 Prossimi Passi

Una volta che il primo video funziona:
1. Testa diversi stili
2. Prova video più lunghi (90s)
3. Sperimenta con topic diversi
4. Ottimizza i prompt per risultati migliori

---

**Sei pronto! Esegui lo script SQL e crea il bucket, poi testa il primo video!** 🚀
