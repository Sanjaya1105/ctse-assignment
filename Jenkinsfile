pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    REPO_URL = 'https://github.com/Sanjaya1105/ctse-assignment.git'
    BRANCH_NAME_DEPLOY = 'main'
  }

  stages {
    stage('Checkout') {
      steps {
        git branch: "${BRANCH_NAME_DEPLOY}", url: "${REPO_URL}"
        sh '''
          echo "Workspace: $WORKSPACE"
          git rev-parse --abbrev-ref HEAD
          git rev-parse --short HEAD
        '''
      }
    }

    stage('Verify Docker') {
      steps {
        sh '''
          docker --version
          docker compose version
        '''
      }
    }

    stage('Prepare Env') {
      steps {
        sh '''
          cd "$WORKSPACE"
          if [ ! -f ".env" ]; then
            cp ".env.docker.example" ".env"
            echo ".env was missing; created from .env.docker.example"
          else
            echo ".env already exists"
          fi
        '''
      }
    }

    stage('Stop Old Containers') {
      steps {
        sh '''
          cd "$WORKSPACE"
          docker compose down || true
        '''
      }
    }

    stage('Build Images') {
      steps {
        sh '''
          cd "$WORKSPACE"
          docker compose build
        '''
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          cd "$WORKSPACE"
          docker compose down || true
          docker compose up -d --build
        '''
      }
    }

    stage('Verify Running Containers') {
      steps {
        sh '''
          cd "$WORKSPACE"
          docker compose ps
          docker ps
        '''
      }
    }
  }

  post {
    always {
      echo 'Pipeline finished.'
    }
    success {
      echo 'Deployment successful.'
    }
    failure {
      echo 'Deployment failed. Check logs above.'
    }
  }
}

