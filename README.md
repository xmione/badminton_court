# Badminton Court Management 🏸

This project provides a comprehensive system for managing badminton courts, bookings, and related operations. It's built using Node.js and Python, offering a robust and flexible solution for sports facility administration.

## Features 🚀

*   **Court Scheduling & Booking**: Seamlessly manage court availability and allow users to book slots.
*   **User Management**: Handle player and administrator accounts with different permission levels.
*   **Event Management**: Organize and manage tournaments, leagues, and other badminton events.
*   **Reporting & Analytics**: Generate insights into court usage, revenue, and popular booking times.
*   **Automated Notifications**: Send reminders for bookings and upcoming events.
*   **Integration Capabilities**: Designed with extensibility in mind, allowing for future integrations.
*   **Automated Setup**: Simplified installation and setup process.
*   **End-to-End Testing**: Comprehensive testing suite using Cypress for quality assurance.

## Tech Stack ⚡

*   **Backend**: Node.js, Python (Django)
*   **Frontend**: (Assumed, not explicitly detailed in provided info but common for web apps)
*   **Database**: SQLite (with potential for MariaDB via `init-mariadb.sql`)
*   **Task Queues**: Celery
*   **Testing**: Cypress

## Installation 📦

This project utilizes both Node.js and Python for its backend services. Follow these steps for a complete installation:

### Prerequisites

*   **Node.js**: Ensure Node.js and npm (or yarn) are installed on your system.
*   **Python**: Ensure Python 3.x is installed.
*   **Docker & Docker Compose**: Recommended for consistent environment setup.

### Setup Steps

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd badminton-court-management
    ```

2.  **Install Node.js Dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Install Python Dependencies**:
    The `setup_install.py` script automates the Python environment setup.
    ```bash
    python setup_install.py
    ```
    This script will:
    *   Upgrade `pip`.
    *   Purge the `pip` cache.
    *   Install dependencies from `requirements.txt`.

4.  **Database Setup**:
    *   **Using SQLite (Default)**: The `db.sqlite3` file will be created/managed automatically by Django.
    *   **Using MariaDB (Optional)**: If you prefer MariaDB, you can set up the database using the provided SQL script.
        ```bash
        # Ensure MariaDB is running and accessible
        psql -h localhost -U your_user -d your_database < init-mariadb.sql
        ```
        You will need to configure your Django settings (`badminton_court/settings.py`) to connect to MariaDB.

5.  **Environment Variables**:
    Create a `.env` file in the root directory and populate it with necessary environment variables. Refer to `dotenv` and `dotenv-cli` documentation for details. Example:
    ```dotenv
    # .env file
    DATABASE_URL=sqlite:///db.sqlite3
    SECRET_KEY=your_super_secret_key
    # ... other variables
    ```
    *   **`env.passphrase.txt`**: This file might contain sensitive information or passphrases required for certain operations. Ensure it's handled securely.

6.  **Initial Setup Scripts**:
    *   **Windows**: Run `setup_all.ps1` for a comprehensive setup.
    *   **Linux/macOS**: You might need to adapt or run specific commands from the provided scripts.

7.  **Run Migrations (Django)**:
    ```bash
    python manage.py migrate
    ```

8.  **Create Superuser (Django)**:
    ```bash
    python manage.py createsuperuser
    ```

### Docker Setup (Recommended)

For a more isolated and consistent environment, Docker is recommended.

1.  **Build Docker Images**:
    ```bash
    docker-compose build
    ```

2.  **Start Docker Containers**:
    ```bash
    docker-compose up -d
    ```
    This will start the necessary services (e.g., Django app, Celery worker, database).

3.  **Run Django Migrations within Docker**:
    ```bash
    docker-compose exec web python manage.py migrate
    ```

4.  **Create Superuser within Docker**:
    ```bash
    docker-compose exec web python manage.py createsuperuser
    ```

## Usage 🛠️

### Running the Development Server

*   **Node.js Server**: (If applicable, commands would typically be in `package.json` scripts, e.g., `npm start`)
*   **Django Server**:
    ```bash
    python manage.py runserver
    ```
    The application will typically be accessible at `http://localhost:8000`.

### Running Celery Tasks

```bash
# In a separate terminal
celery -A badminton_court worker -l info
```
For scheduled tasks (Celery Beat):
```bash
# In another separate terminal
celery -A badminton_court beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### Running Cypress Tests

Ensure your development server is running before executing Cypress tests.

```bash
npx cypress open
# or to run in headless mode
npx cypress run
```

Refer to `cypress.config.js` for detailed test configuration, including base URL and timeouts.

## Project Structure 📂

```
.
├── backups/                    # Backup files
├── certs/                      # SSL certificates
├── cypress/                    # Cypress test suite
│   ├── downloads/
│   ├── e2e/
│   ├── integration/
│   ├── logs/
│   ├── plugins/
│   ├── presentation-videos/
│   ├── screenshots/
│   ├── support/
│   └── videos/
├── Docs/                       # Documentation files
├── Logs/                       # Application logs
├── Scripts/                    # Helper scripts for setup and management
├── static/                     # Static assets
├── templates/                  # HTML templates
├── badminton_court/            # Core Django application
│   ├── __init__.py
│   ├── adapters.py             # Example adapter file
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── court_management/           # Another potential Django app (if modular)
├── docker-compose.yml          # Docker Compose configuration
├── Dockerfile                  # Dockerfile for the main application
├── Dockerfile.cypress          # Dockerfile specifically for Cypress runs
├── .env                        # Environment variables (create this file)
├── .gitignore
├── bootstrap.ps1               # Windows bootstrap script
├── celerybeat-schedule         # Celery beat schedule file
├── cypress.config.js           # Cypress configuration file
├── db.sqlite3                  # SQLite database file (if used)
├── entrypoint.sh               # Entrypoint script for Docker containers
├── env.passphrase.txt          # File for environment passphrases
├── folderstructure.txt         # Description of folder structure
├── init-mariadb.sql            # MariaDB initialization script
├── manage.py                   # Django's command-line utility
├── package-lock.json           # Node.js package lock file
├── package.json                # Node.js project manifest
├── requirements.txt            # Python dependencies
├── setup_all.ps1               # PowerShell script for full setup on Windows
├── setup_log.txt               # Log file for setup process
├── setup_install.py            # Python environment setup script
├── simple_server.py            # Simple HTTP server script
├── VERSION.md                  # Project version information
├── versions.json               # Detailed version information
└── web-entrypoint.sh           # Web server entrypoint script for Docker
```

## Configuration ⚙️

*   **`.env` file**: This is the primary way to configure your application's environment. Create this file in the root directory and populate it with the necessary variables.
    *   `DATABASE_URL`: Connection string for your database.
    *   `SECRET_KEY`: Django secret key for security.
    *   Other variables for email, caching, logging, etc.

*   **`cypress.config.js`**: Configures Cypress, including `baseUrl`, timeouts, and other testing-related settings. The `baseUrl` can be set via `CYPRESS_INTERNAL_baseUrl` or `CYPRESS_baseUrl` environment variables.

*   **`badminton_court/settings.py`**: The main Django settings file. This is where you'll configure database connections, installed apps, middleware, and other Django-specific settings.

## Contributing 🤝

*(This section is a placeholder. If you have guidelines for contributing, please add them here. For example:)*

We welcome contributions to this project! Please follow these guidelines:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix (`feature/your-feature` or `fix/your-bug`).
3.  **Make your changes** and ensure they follow the project's coding standards.
4.  **Write tests** for your changes.
5.  **Commit your changes** with clear and concise commit messages.
6.  **Push to your fork** and open a Pull Request against the `main` branch of the original repository.

Please ensure all dependencies are installed and tests pass before submitting a Pull Request.

## License 📜

*(This section is a placeholder. Please specify the license under which this project is distributed. For example:)*

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.