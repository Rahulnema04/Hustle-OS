# ============================================================
# Hugging Face Spaces - Analytics LLM (Voice + RAG + Flask)
# CPU-only, optimized for HF free tier (16GB RAM, 2 vCPU)
# ============================================================

FROM python:3.10-slim

# ── System deps ────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    libgomp1 \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# ── HF Spaces requires a non-root user called 'user' ───────
RUN useradd -m -u 1000 user
USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=7860

WORKDIR /home/user/app

# ── Step 1: Install torch CPU FIRST (must precede all other deps) ──
# Pinned to 2.2.2 CPU — approx 800MB download, done once during build
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
        torch==2.2.2 \
        torchaudio==2.2.2 \
        --index-url https://download.pytorch.org/whl/cpu

# ── Step 2: Verify torch is visible BEFORE installing other packages ──
RUN python -c "import torch; print('✅ torch', torch.__version__, '— CUDA:', torch.cuda.is_available())"

# ── Step 3: Install the rest of the requirements ───────────
COPY --chown=user requirements_hf.txt .
RUN pip install --no-cache-dir -r requirements_hf.txt

# ── Step 4: Copy application code ──────────────────────────
COPY --chown=user . .

# ── Create writable dirs for runtime data ──────────────────
RUN mkdir -p chroma_db logs voice/.tts_cache uploads

# ── HF Spaces exposes port 7860 ────────────────────────────
EXPOSE 7860

# ── Health check ────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:7860/api/analytics/health || exit 1

# ── Entry point ─────────────────────────────────────────────
CMD ["python", "api.py"]
