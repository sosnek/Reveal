-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the database user if it doesn't exist
-- Note: This is handled by the postgres image environment variables

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE reveal_db TO reveal_user; 