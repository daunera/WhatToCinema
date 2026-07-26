# WhatToCinema App

WhatToCinema is a modern web application designed to track movie showtimes and manage your cinema schedule. Built with a robust **FastAPI** backend and a responsive **Next.js** frontend, it automatically scrapes showtimes and provides a clean interface to browse movies.

## Features

- 🎬 **Live Showtimes**: View up-to-date movie schedules.
- 📅 **Date Filtering**: Easily filter showtimes by date.
- ⭐ **Favorites**: Mark movies as favorites to highlight them.
- 🔐 **Secure Access**: Simple passcode protection for the UI.
- 🌍 **Internationalization**: Support for Hungarian (HU) and English (EN).
- 📱 **Responsive Design**: Optimized for both desktop and mobile devices.

## Deployment

The application is fully containerized using Docker, making deployment straightforward.

### Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/daunera/WhatToCinema.git
    cd WhatToCinema
    ```

2.  **Create the external Docker network** (required before starting the stack):
    ```bash
    docker network create dokploy-network
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory (or configure your deployment platform variables) with the following values.

    **Backend Variables:**
    | Variable | Description | Example |
    | :--- | :--- | :--- |
    | `API_KEY` | **Required.** A secure key shared between the backend and frontend for API access. | `secure-random-string` |
    | `MOVIE_THEATER_URLS` | **Required.** Comma-separated list of cinema URLs to scrape. | `https://cinema1.com,https://cinema2.com` |
    | `SKIP_MOVIE_KEYWORDS` | (Optional) Comma-separated keywords to exclude movies. | `dubbed,3d` |

    **Frontend Variables:**
    | Variable | Description | Example |
    | :--- | :--- | :--- |
    | `AUTH_PASSCODE` | **Required.** The passcode users must enter to access the UI. | `123456` |
    | `APP_LOCALE` | Default application language (`hu` or `en`). | `hu` |
    | `NEXT_PUBLIC_DEFAULT_CINEMA` | (Optional) Auto-selects this cinema on load. Leave empty for no default. | `Cinema Example` |

    > **Note:** Example `.env` files are provided in `backend/.env.example` and `frontend/.env.local.example` for local development.

4.  **Run with Docker Compose:**
    ```bash
    docker compose up -d --build
    ```

    The application consists of two services:
    - **Backend** — FastAPI service with a persistent SQLite database stored in a Docker volume (`data`).
    - **Frontend** — Next.js server, exposed internally on port `3000` within the `dokploy-network`. Access it through a reverse proxy (e.g., Traefik, Nginx, or Dokploy) on the same network.

### Troubleshooting

-   **Data not showing?** The backend scrapes data daily at 7:00 AM. You can trigger a manual sync via the API at `POST /api/scrape` (requires the `X-API-Key` header), or restart the backend container.
-   **Passcode issue?** Ensure `AUTH_PASSCODE` in your `.env` matches what you use to log in.
-   **Network error?** Make sure the `dokploy-network` exists (`docker network ls`) and your reverse proxy is connected to it.
