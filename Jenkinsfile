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

        stage('Detect Changes') {
            steps {
                script {
                    def changedFiles = sh(
                        script: "git diff --name-only HEAD~1 HEAD || true",
                        returnStdout: true
                    ).trim()

                    echo "Changed files:\n${changedFiles}"

                    env.SERVICE = "all"

                    if (changedFiles.contains("services/account-service")) {
                        env.SERVICE = "account-service"
                    } else if (changedFiles.contains("services/shipment-service")) {
                        env.SERVICE = "shipment-service"
                    } else if (changedFiles.contains("services/tracking-service")) {
                        env.SERVICE = "tracking-service"
                    } else if (changedFiles.contains("services/notification-service")) {
                        env.SERVICE = "notification-service"
                    } else if (changedFiles.contains("frontend")) {
                        env.SERVICE = "frontend"
                    } else if (changedFiles.contains("api-gateway")) {
                        env.SERVICE = "api-gateway"
                    }

                    echo "Deploy target: ${env.SERVICE}"
                }
            }
        }

        stage('Sync Files') {
            steps {
                sh '''
                    set -e
                    mkdir -p "$DEPLOY_DIR"
                    rsync -rlptDzv --delete --no-group --no-owner \
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
                    echo "Using env file: $ENV_FILE"
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool name: 'sonar-scanner', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
                    withSonarQubeEnv('sonarqube') {
                        sh """
                            set -e
                            cd "$WORKSPACE"
                            "${scannerHome}/bin/sonar-scanner"
                        """
                    }
                }
            }
        }

        stage('Build and Deploy') {
            steps {
                script {
                    if (env.SERVICE == "all") {
                        sh '''
                            set -e
                            cd "$DEPLOY_DIR"
                            docker compose up --build -d
                        '''
                    } else {
                        sh """
                            set -e
                            cd "$DEPLOY_DIR"
                            docker compose up --build -d ${env.SERVICE}
                        """
                    }
                }
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