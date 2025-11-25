FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (including OpenGL for cv2/bithuman)
# libgl1 provides libGL.so.1 needed by opencv-python
# libglvnd0 and libglx0 are dependencies of libgl1
RUN apt-get update && apt-get install -y \
    gcc \
    libgl1 \
    libglvnd0 \
    libglx0 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run the agent - cli.run_app requires 'start' command for AgentServer
CMD ["python", "agent.py", "start"]

