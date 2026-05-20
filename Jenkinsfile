// Jenkins declarative pipeline for Taskly
// Required stages: Code Build, Unit Testing, Containerized Deployment, Containerized Selenium Testing
pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 20, unit: 'MINUTES')
        ansiColor('xterm')
    }

    environment {
        APP_IMAGE      = "taskly-app:${env.BUILD_NUMBER}"
        APP_IMAGE_LATEST = "taskly-app:latest"
        SELENIUM_IMAGE = "taskly-selenium:${env.BUILD_NUMBER}"
        COMPOSE_PROJECT_NAME = "taskly_${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ---------- Stage 1: Code Build ----------
        // Installs npm dependencies and builds the application Docker image.
        stage('Code Build') {
            steps {
                echo "==> Installing Node dependencies"
                sh 'node --version && npm --version'
                sh 'npm ci || npm install'

                echo "==> Building the application Docker image"
                sh 'docker build -t $APP_IMAGE -t $APP_IMAGE_LATEST -f Dockerfile .'
            }
        }

        // ---------- Stage 2: Unit Testing ----------
        // Runs Jest tests against the task service layer with a mocked DB.
        stage('Unit Testing') {
            steps {
                echo "==> Running Jest unit tests"
                sh 'npm test'
            }
        }

        // ---------- Stage 3: Containerized Deployment ----------
        // Starts the app + Postgres via docker compose and waits for the
        // health endpoint to come up.
        stage('Containerized Deployment') {
            steps {
                echo "==> Tearing down any previous deployment"
                sh 'docker compose -p taskly down -v --remove-orphans || true'

                echo "==> Starting app + database via docker compose"
                sh 'docker compose -p taskly up -d --build'

                echo "==> Waiting for the app health check"
                sh '''
                  for i in $(seq 1 30); do
                    if curl -fs http://localhost:3000/health > /dev/null; then
                      echo "App is healthy."
                      exit 0
                    fi
                    echo "Waiting for app... ($i/30)"
                    sleep 2
                  done
                  echo "App did not become healthy in time."
                  docker compose -p taskly logs app
                  exit 1
                '''
            }
        }

        // ---------- Stage 4: Containerized Selenium Testing ----------
        // Builds the Selenium image and runs it against the deployed app
        // by joining the same Docker network so the test container can
        // reach the app service by its DNS name "app".
        stage('Containerized Selenium Testing') {
            steps {
                echo "==> Building Selenium test image"
                sh 'docker build -t $SELENIUM_IMAGE -f Dockerfile.selenium .'

                echo "==> Running Selenium tests inside a container"
                sh '''
                  docker run --rm \
                    --network taskly-net \
                    -e APP_URL=http://app:3000 \
                    $SELENIUM_IMAGE
                '''
            }
        }
    }

    post {
        always {
            echo "==> Cleaning up containers"
            sh 'docker compose -p taskly down -v --remove-orphans || true'
        }
        success {
            echo "Pipeline finished successfully."
        }
        failure {
            echo "Pipeline failed. Recent app logs:"
            sh 'docker compose -p taskly logs --tail=100 app || true'
        }
    }
}
