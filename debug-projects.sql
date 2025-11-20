-- Check projects with their error messages
SELECT 
  id,
  topic,
  status,
  created_at,
  CASE 
    WHEN error_message IS NOT NULL THEN substring(error_message, 1, 100) || '...'
    ELSE 'No error message'
  END as error_preview,
  CASE 
    WHEN script IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as has_script,
  CASE 
    WHEN audio_url IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as has_audio,
  CASE 
    WHEN image_urls IS NOT NULL THEN array_length(image_urls, 1)
    ELSE 0
  END as num_images
FROM projects
ORDER BY created_at DESC
LIMIT 10;
