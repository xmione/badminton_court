# Version Configuration

This document specifies the exact versions of tools and packages used in this project.

## System Tools (installed by setup_all.ps1)
### Visual Studio Build Tools
- **Package ID**: Microsoft.VisualStudio.2022.BuildTools
- **Version**: 17.14.36121.58
- **Components**:  - Microsoft.VisualStudio.Workload.VCTools
  - Microsoft.VisualStudio.Component.VC.Tools.x86.x64
  - Microsoft.VisualStudio.Component.Windows10SDK.22621

### Windows SDK
- **Version**: 10.0.22621.1
- **Display Name**: Windows 10 SDK (10.0.22621.1)
### Docker Desktop
- **Version**: 4.34.2
- **Download URL**: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
- **Expected Version**: 4.34.2

## Python (installed by bootstrap.ps1)

### Python Interpreter
- **Version**: 3.12.10
- **Installer URL**: https://www.python.org/ftp/python/3.12.10/python-3.12.10-amd64.exe

## Python Packages (installed in the current virtual environment)

| Package          | Version       | Description                                     |
|------------------|---------------|-------------------------------------------------|| amqp             | 5.3.1         | Low-level AMQP client for Python (fork of amqplib). |
| annotated-types  | 0.7.0         | Reusable constraint types to use with typing.Annotated |
| anyio            | 4.11.0        | High-level concurrency and networking framework on top of asyncio or Trio |
| asgiref          | 3.9.2         | ASGI specs, helper code, and adapters           |
| billiard         | 4.2.2         | Python multiprocessing fork with improvements and bugfixes |
| celery           | 5.5.3         | Distributed Task Queue.                         |
| certifi          | 2025.8.3      | Python package for providing Mozilla's CA Bundle. |
| cffi             | 2.0.0         | Foreign Function Interface for Python calling C code. |
| charset-normalizer | 3.4.3         | The Real First Universal Charset Detector. Open, modern and actively maintained alternative to Chardet. |
| click            | 8.3.0         | Composable command line interface toolkit       |
| click-didyoumean | 0.3.1         | Enables git-like *did-you-mean* feature in click |
| click-plugins    | 1.1.1.2       | An extension module for click to enable registering CLI commands via setuptools entry-points. |
| click-repl       | 0.3.0         | REPL plugin for Click                           |
| colorama         | 0.4.6         | Cross-platform colored terminal text.           |
| contourpy        | 1.3.3         | Python library for calculating contours of 2D quadrilateral grids |
| cron_descriptor  | 2.0.6         | A Python library that converts cron expressions into human readable strings. |
| cryptography     | 46.0.2        | cryptography is a package which provides cryptographic recipes and primitives to Python developers. |
| cycler           | 0.12.1        | Composable style cycles                         |
| distro           | 1.9.0         | Distro - an OS platform information API         |
| Django           | 5.2.6         | A high-level Python web framework that encourages rapid development and clean, pragmatic design. |
| django-allauth   | 65.11.2       | Integrated set of Django applications addressing authentication, registration, account management as well as 3rd party (social) account authentication. |
| django-bootstrap5 | 25.2          | Bootstrap 5 for Django                          |
| django-celery-beat | 2.8.1         | Database-backed Periodic Tasks.                 |
| django-timezone-field | 7.1           | A Django app providing DB, form, and REST framework fields for zoneinfo and pytz timezone objects. |
| dj-database-url  | 3.0.1         | Use Database URLs in your Django Application.   |
| fonttools        | 4.60.0        | Tools to manipulate font files                  |
| h11              | 0.16.0        | A pure-Python, bring-your-own-I/O implementation of HTTP/1.1 |
| httpcore         | 1.0.9         | A minimal low-level HTTP client.                |
| httpx            | 0.28.1        | The next generation HTTP client.                |
| idna             | 3.10          | Internationalized Domain Names in Applications (IDNA) |
| kiwisolver       | 1.4.9         | A fast implementation of the Cassowary constraint solver |
| kombu            | 5.5.4         | Messaging library for Python.                   |
| matplotlib       | 3.10.6        | Python plotting package                         |
| narwhals         | 2.5.0         | Extremely lightweight compatibility layer between dataframe libraries |
| numpy            | 2.3.3         | Fundamental package for array computing in Python |
| oauthlib         | 3.3.1         | A generic, spec-compliant, thorough implementation of the OAuth request-signing logic |
| packaging        | 25.0          | Core utilities for Python packages              |
| pandas           | 2.3.2         | Powerful data structures for data analysis, time series, and statistics |
| pillow           | 11.3.0        | Python Imaging Library (Fork)                   |
| plotly           | 6.3.0         | An open-source interactive data visualization library for Python |
| prompt_toolkit   | 3.0.52        | Library for building powerful interactive command lines in Python |
| psycopg2-binary  | 2.9.9         | psycopg2 - Python-PostgreSQL Database Adapter   |
| pycparser        | 2.23          | C parser in Python                              |
| pydantic         | 2.11.9        | Data validation using Python type hints         |
| pydantic_core    | 2.33.2        | Core functionality for Pydantic validation and serialization |
| PyJWT            | 2.10.1        | JSON Web Token implementation in Python         |
| pyngrok          | 7.4.0         | A Python wrapper for ngrok                      |
| pyparsing        | 3.2.5         | pyparsing - Classes and methods to define and execute parsing grammars |
| python-crontab   | 3.3.0         | Python Crontab API                              |
| python-dateutil  | 2.9.0.post0   | Extensions to the standard Python datetime module |
| python-dotenv    | 1.1.1         | Read key-value pairs from a .env file and set them as environment variables |
| pytz             | 2025.2        | World timezone definitions, modern and historical |
| PyYAML           | 6.0.3         | YAML parser and emitter for Python              |
| redis            | 5.0.1         | Python client for Redis database and key-value store |
| requests         | 2.32.5        | Python HTTP for Humans.                         |
| requests-oauthlib | 2.0.0         | OAuthlib authentication support for Requests.   |
| setuptools-scm   | 9.2.0         | the blessed package to manage your versions by scm tags |
| six              | 1.17.0        | Python 2 and 3 compatibility utilities          |
| sniffio          | 1.3.1         | Sniff out which async library your code is running under |
| sqlparse         | 0.5.3         | A non-validating SQL parser.                    |
| tqdm             | 4.67.1        | Fast, Extensible Progress Meter                 |
| typing_extensions | 4.15.0        | Backported and Experimental Type Hints for Python 3.9+ |
| typing-inspection | 0.4.1         | Runtime typing introspection tools              |
| tzdata           | 2025.2        | Provider of IANA time zone data                 |
| urllib3          | 2.5.0         | HTTP library with thread-safe connection pooling, file post, and more. |
| vine             | 5.1.0         | Python promises.                                |
| wcwidth          | 0.2.14        | Measures the displayed width of unicode strings in a terminal |
| websocket-client | 1.8.0         | WebSocket client for Python with low level API options |

## How to Update Versions

1. **System Tools**: Update the ersions.json file with the new version numbers
2. **Python Packages**: Install or update packages in the virtual environment via pip
3. **Documentation**: Run 
pm run doc:create-version to regenerate this VERSION.md file

## Version Testing

All versions have been tested together and confirmed to work in the following environments:
- Windows 11 Pro (21H2)
- Windows Server 2022
- Docker Desktop 4.34.2
- Python 3.12.10
