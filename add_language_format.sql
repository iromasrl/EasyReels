-- Add language and format columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'vertical';

-- Update existing projects
UPDATE projects 
SET language = 'en', format = 'vertical'
WHERE language IS NULL OR format IS NULL;
