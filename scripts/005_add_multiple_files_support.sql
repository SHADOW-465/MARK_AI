-- Add file_urls column to answer_sheets table
ALTER TABLE answer_sheets ADD COLUMN IF NOT EXISTS file_urls TEXT[];

-- Migrate existing file_url to file_urls
UPDATE answer_sheets SET file_urls = ARRAY[file_url] WHERE file_url IS NOT NULL AND file_urls IS NULL;

-- Make file_url optional (since we will use file_urls)
ALTER TABLE answer_sheets ALTER COLUMN file_url DROP NOT NULL;
