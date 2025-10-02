-- init-mariadb.sql

-- Create the message database required by Postal
CREATE DATABASE IF NOT EXISTS badminton_court_msg_db;

-- Create user and grant privileges
CREATE USER IF NOT EXISTS 'badminton_user'@'%' IDENTIFIED BY 'P@ssw0rd123';
GRANT ALL PRIVILEGES ON badminton_court.* TO 'badminton_user'@'%';
GRANT ALL PRIVILEGES ON badminton_court_msg_db.* TO 'badminton_user'@'%';

-- Also grant privileges from any host (important for Docker)
GRANT ALL PRIVILEGES ON badminton_court.* TO 'badminton_user'@'172.%.%.%';
GRANT ALL PRIVILEGES ON badminton_court_msg_db.* TO 'badminton_user'@'172.%.%.%';

FLUSH PRIVILEGES;