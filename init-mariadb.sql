-- init-mariadb.sql

-- Create the database required by Postal
CREATE DATABASE IF NOT EXISTS postal;

-- Create the database required by Django application
CREATE DATABASE IF NOT EXISTS badminton_court;
CREATE DATABASE IF NOT EXISTS badminton_court_msg_db;

-- Create postal user and grant privileges (for Postal)
CREATE USER IF NOT EXISTS 'postal'@'%' IDENTIFIED BY 'P@ssw0rd123';
GRANT ALL PRIVILEGES ON postal.* TO 'postal'@'%';
GRANT ALL PRIVILEGES ON `postal-%`.* TO 'postal'@'%';

-- Create badminton user and grant privileges (for Django)
CREATE USER IF NOT EXISTS 'badminton_user'@'%' IDENTIFIED BY 'P@ssw0rd123';
GRANT ALL PRIVILEGES ON badminton_court.* TO 'badminton_user'@'%';
GRANT ALL PRIVILEGES ON badminton_court_msg_db.* TO 'badminton_user'@'%';

-- Also grant privileges from any host (important for Docker)
-- For postal user
GRANT ALL PRIVILEGES ON postal.* TO 'postal'@'172.%.%.%';
GRANT ALL PRIVILEGES ON `postal-%`.* TO 'postal'@'172.%.%.%';

-- For badminton user
GRANT ALL PRIVILEGES ON badminton_court.* TO 'badminton_user'@'172.%.%.%';
GRANT ALL PRIVILEGES ON badminton_court_msg_db.* TO 'badminton_user'@'172.%.%.%';

FLUSH PRIVILEGES;