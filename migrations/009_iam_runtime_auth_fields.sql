-- Add IAM fields used by the live repository implementation.
ALTER TABLE iam_users
  ADD COLUMN title VARCHAR(128) NULL AFTER last_name;

ALTER TABLE iam_users
  ADD COLUMN force_password_change BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE iam_users
  ADD COLUMN password_history JSON NULL;
