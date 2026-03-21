pipeline {
    agent any

    environment {
        REPO_URL = 'https://github.com/Sanjaya1105/ctse-assignment.git'
        BRANCH = 'main'
        DEPLOY_DIR = '/opt/apps/ctse-assignment'
        ENV_FILE = '/opt/apps/ctse-assignment/.env'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: "${BRANCH}", url: "${REPO_URL}"
            }
        }

        stage('Sync Files') {
            steps {
                sh '''
                    set -e
                    mkdir -p "$DEPLOY_DIR"
                    rsync -av --delete \
                      --exclude '.git' \
                      --exclude '.env' \
                      "$WORKSPACE"/ "$DEPLOY_DIR"/
                '''
            }
        }

        stage('Verify Env') {
            steps {
                sh '''
                    set -e
                    test -f "$ENV_FILE"
                    echo "Env file found at $ENV_FILE"
                '''
            }
        }

        stage('Build and Deploy') {
            steps {
                sh '''
                    set -e
                    cd "$DEPLOY_DIR"
                    docker compose down || true
                    docker compose up --build -d
                '''
            }
        }

        stage('Smoke Test') {
            steps {
                sh '''
                    set -e
                    sleep 10
                    curl -I http://localhost || true
                    curl -I http://localhost:3001 || true
                    cd "$DEPLOY_DIR"
                    docker compose ps
                '''
            }
        }
    }

    post {
        success {
            echo 'Deployment successful'
        }
        failure {
            sh '''
                cd "$DEPLOY_DIR" || exit 0
                docker compose ps || true
                docker compose logs --tail=100 || true
            '''
        }
    }
}