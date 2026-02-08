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

2.  **Configure Environment Variables:**
    Create a `.env` file in the root directory (or configure your deployment platform variables) with the following values.

    **Backend Variables:**
    | Variable | Description | Example |
    | :--- | :--- | :--- |
    | `API_KEY` | **Required.** A secure key for backend API access. | `secure-random-string` |
    | `MOVIE_THEATER_URLS` | **Required.** Comma-separated list of cinema URLs to scrape. | `https://cinema1.com,https://cinema2.com` |
    | `SKIP_MOVIE_KEYWORDS` | (Optional) Comma-separated keywords to exclude movies. | `dubbed,3d` |

    **Frontend Variables:**
    | Variable | Description | Example |
    | :--- | :--- | :--- |
    | `AUTH_PASSCODE` | **Required.** The passcode users must enter to access the UI. | `123456` |
    | `APP_LOCALE` | Default application language (`hu` or `en`). | `hu` |


3.  **Run with Docker Compose:**
    ```bash
    docker-compose up -d --build
    ```

    The application will be available at `http://localhost:3000`.

### Troubleshooting

-   **Data not showing?** The backend scrapes data daily at 7:00 AM. You can trigger a manual sync via the UI if implemented or by restarting the backend container.
-   **Passcode issue?** Ensure `AUTH_PASSCODE` in your `.env` matches what you use to log in.
