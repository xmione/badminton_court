# Version Configuration

This document specifies the exact versions of tools and packages used in this project.

## System Tools (installed by setup_all.ps1)
### Visual Studio Build Tools
- **Package ID**: Microsoft.VisualStudio.2022.BuildTools
- **Version**: 17.14.36121.58
- **Components**:  - Microsoft.VisualStudio.Component.VC.Tools.x86.x64
  - Microsoft.VisualStudio.Component.Windows10SDK.19041
  - Microsoft.VisualStudio.Component.VC.CMake.Project
### Windows SDK
- **Version**: 10.0.19041.0
- **Display Name**: Windows 10 SDK (19041)
### Docker Desktop
- **Version**: 4.47.0.206054
- **Download URL**: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
- **Expected Version**: 4.47.0.206054

## Python (installed by bootstrap.ps1)

### Python Interpreter
- **Version**: 3.12.10
- **Installer URL**: https://www.python.org/ftp/python/3.12.10/python-3.12.10-amd64.exe

## Python Packages (installed by bootstrap.ps1 via requirements.txt)

| Package | Version | Description |
|---------|---------|-------------|| asgiref | 3.9.2 | ASGI spec with assorted code |
| billiard | 4.2.2 | Python multiprocessing fork |
| celery | 5.5.3 | Distributed Task Queue |
| certifi | 2022.12.7 | Python package for providing Mozilla's CA Bundle |
| charset-normalizer | 3.1.0 | Unicode Transformation Formats |
| Django | 5.2.6 | High-level Python web framework |
| django-celery-beat | 2.8.1 | Celery Periodic Tasks for Django |
| django-timezone-field | 7.1 | Timezone field for Django |
| kombu | 5.5.4 | Messaging library for Python |
| matplotlib | 3.10.6 | Python plotting library |
| numpy | 2.3.3 | Scientific computing with Python |
| pandas | 2.3.2 | Data analysis and manipulation tool |
| Pillow | 11.3.0 | Python Imaging Library |
| plotly | 6.3.0 | Interactive graphing library |
| psycopg2-binary | 2.9.9 | PostgreSQL database adapter |
| python-dateutil | 2.9.0.post0 | Extensions to the standard datetime module |
| pytz | 2025.2 | World timezone definitions |
| six | 1.17.0 | Python 2 and 3 compatibility library |
| sqlparse | 0.5.3 | Non-validating SQL parser |
| tenacity | 8.2.2 | Retry library |
| tzdata | 2025.2 | IANA time zone database |
| urllib3 | 1.26.15 | HTTP library with thread-safe connection pooling |
| vine | 5.1.0 | Promises, promises, promises |

## How to Update Versions

1. **System Tools**: Update the ersions.json file with the new version numbers
2. **Python Packages**: Update the equirements.txt file with the new version numbers
3. **Documentation**: Update this VERSIONS.md file to reflect the changes

## Version Testing

All versions have been tested together and confirmed to work in the following environments:
- Windows 11 Pro (21H2)
- Windows Server 2022
- Docker Desktop 4.47.0.206054
- Python 3.12.10
