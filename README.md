# 🎮 Party Games

Webapp de torneos para fiestas. Gestiona jugadores, genera rondas equilibradas de **futbolín** (2v2) y **billar** (2v1), y lleva el marcador en tiempo real.

## Stack

- **Frontend**: React + Vite + CSS Modules
- **Backend**: Node.js + Express
- **DB**: SQLite (`better-sqlite3`)
- **Infra**: AWS CloudFormation (EC2 + ALB)
- **Container**: Docker (build multistage)

## Despliegue en AWS

### Pre-requisitos

1. AWS CLI configurado (`aws configure`)
2. Un **Key Pair** creado en tu región de AWS
3. Este repo subido a GitHub

### Lanzar el stack (un solo comando)

```bash
aws cloudformation deploy \
  --template-file infra/cloudformation.yaml \
  --stack-name party-games \
  --parameter-overrides \
      GitHubRepoUrl=https://github.com/TU_USUARIO/party-games.git \
      KeyPairName=TU_KEY_PAIR \
      InstanceType=t3.micro \
      AllowedSSHCidr=0.0.0.0/0 \
  --capabilities CAPABILITY_IAM \
  --region eu-west-1
```

> Cambia `eu-west-1` a tu región y `TU_USUARIO` / `TU_KEY_PAIR` por los tuyos.

### Ver la URL de la app

```bash
aws cloudformation describe-stacks \
  --stack-name party-games \
  --query "Stacks[0].Outputs" \
  --output table
```

La output `AppURL` te da la URL tipo `http://party-games-alb-XXXX.eu-west-1.elb.amazonaws.com`.

### Eliminar todo

```bash
aws cloudformation delete-stack --stack-name party-games
```

---

## Desarrollo local

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (en otra terminal)
cd frontend && npm install && npm run dev
```

Frontend en `http://localhost:5173` → proxy a backend en `localhost:3001`.

---

## Reglas del juego

- **7 jugadores**, cada ronda:
  - ⚽ Futbolín: 2 vs 2
  - 🎱 Billar: 2 vs 1
  - 😴 1 jugador descansa
- **Puntuación**: 3 puntos al equipo ganador
- El algoritmo garantiza que todos jueguen con todos y descansen igual
