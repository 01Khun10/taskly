# Taskly

A small task manager built for CSE483 Assignment 3 (Topics in Software Engineering II) — used to demonstrate a CI/CD pipeline with Jenkins on AWS EC2, GitHub webhooks, Docker, and Selenium.

**Stack:** Node.js 18 · Express · PostgreSQL 14 · Jest · Selenium WebDriver · Docker · Jenkins.

---

## Local development

```bash
# 1. Start the database
docker compose up -d db

# 2. Install deps and run the app
npm install
DB_HOST=localhost npm start

# 3. Open the UI
open http://localhost:3000
```

## Running tests

```bash
# Unit tests (no DB required - DB is mocked)
npm test

# Selenium tests (app must be running on APP_URL)
APP_URL=http://localhost:3000 npm run test:selenium
```

## Running the whole stack via Docker Compose

```bash
docker compose up -d --build
curl http://localhost:3000/health      # -> {"status":"ok"}
```

## CI/CD with Jenkins

The `Jenkinsfile` defines a declarative pipeline with four stages:

1. **Code Build** — install dependencies, build the app Docker image
2. **Unit Testing** — run Jest tests against the task service layer
3. **Containerized Deployment** — `docker compose up` of app + Postgres, wait for `/health`
4. **Containerized Selenium Testing** — build the Selenium image and run it on the same Docker network

A GitHub webhook pointed at `http://<EC2-IP>:8080/github-webhook/` triggers the pipeline on every push to `main`.

## Project layout

```
taskly/
├── src/
│   ├── server.js           # entry point
│   ├── app.js              # Express app factory
│   ├── db.js               # Postgres pool + init
│   ├── taskService.js      # business logic (unit-tested)
│   └── public/             # HTML/CSS/JS frontend
├── tests/
│   ├── unit/               # Jest unit tests (mocked DB)
│   └── selenium/           # Selenium WebDriver tests
├── Dockerfile              # app image
├── Dockerfile.selenium     # selenium tests image
├── docker-compose.yml      # app + Postgres
└── Jenkinsfile             # CI/CD pipeline
```
