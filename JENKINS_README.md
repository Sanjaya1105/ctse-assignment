# Jenkins CI/CD (Single Script)

Use this one `Jenkinsfile` for your repo (`ctse-assignment`).  
It builds and deploys all 6 containers with Docker Compose.

```groovy
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    APP_DIR = '/var/jenkins_home/workspace/ctse-assignment'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Verify Docker') {
      steps {
        sh 'docker --version'
        sh 'docker compose version'
      }
    }

    stage('Prepare Env') {
      steps {
        // Ensure root .env exists (single env file approach)
        sh '''
          cd "$APP_DIR"
          if [ ! -f .env ]; then
            cp .env.docker.example .env
            echo "Created .env from .env.docker.example"
          fi
        '''
      }
    }

    stage('Build Images') {
      steps {
        sh '''
          cd "$APP_DIR"
          docker compose build --no-cache
        '''
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          cd "$APP_DIR"
          docker compose up -d
          docker compose ps
        '''
      }
    }
  }

  post {
    success {
      echo 'Deployment successful.'
    }
    failure {
      echo 'Pipeline failed. Check stage logs.'
    }
  }
}
```

## Notes

- Keep only one root `.env` in the repo (your current setup already follows this).
- Configure real values in `.env` before running pipeline (especially `MONGODB_URI`).
- For EC2 deployment, set `VITE_API_GATEWAY_BASE_URL=http://<EC2_PUBLIC_IP>:3001` in root `.env` before build.
- Jenkins agent must have Docker + Docker Compose access.
- If ports are busy (`80`, `3001`, or `8080` for Jenkins), update `docker-compose.yml`.

