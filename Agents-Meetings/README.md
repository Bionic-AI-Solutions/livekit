# Multilingual Meeting Platform with AI Avatars

A comprehensive platform for hosting multilingual meetings with AI avatar hosts, real-time translation, and comprehensive observability.

## Features

- **AI Avatar Hosts**: Support for multiple avatar providers (BitHuman, Anam, Tavus, Hedra)
- **Real-time Translation**: Multi-language translation with STT, LLM, and TTS
- **Role-Based Access**: Admin, Teacher, Meeting Host, and Participant personas
- **Meeting Types**: Classroom meetings (avatar hosts) and regular meetings (human or avatar hosts)
- **Observability**: Full Langfuse integration for tracing and analytics
- **Kubernetes Ready**: Complete K8s manifests for production deployment

## Architecture

- **Backend**: FastAPI with PostgreSQL
- **Frontend**: Next.js with LiveKit components
- **Agents**: Python agents for avatars, translation, and room management
- **Database**: PostgreSQL 15+
- **Real-time**: LiveKit Server
- **Observability**: Langfuse with OpenTelemetry

## Quick Start

### Local Development

1. Clone the repository
2. Copy `.env.example` to `.env` and configure
3. Start services:

```bash
docker-compose up -d
```

4. Run database migrations:

```bash
cd backend
alembic upgrade head
```

5. Access:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Kubernetes Deployment

See [Kubernetes Setup Guide](./docs/setup/kubernetes-setup.md) for detailed instructions.

## Documentation

- [Kubernetes Setup](./docs/setup/kubernetes-setup.md)
- [Secrets Configuration](./docs/setup/secrets-configuration.md)
- [API Keys Setup](./docs/setup/api-keys-setup.md)
- [Langfuse Setup](./docs/setup/langfuse-setup.md)

## Project Structure

```
Agents-Meetings/
├── backend/          # FastAPI backend
├── frontend/         # Next.js frontend
├── agents/           # Python agents
│   ├── avatar_agent/
│   ├── translation_agent/
│   └── room_manager_agent/
├── k8s/              # Kubernetes manifests
└── docs/             # Documentation
```

## Configuration

All configuration files are in `k8s/base/`. Update secrets and configmaps before deployment.

## License

[Your License Here]
