# FebraHub — ETLs
#
# Imagem enxuta para rodar as integrações dentro da VPS, na rede do compose.
# Antes isso vivia no GitHub Actions; agora o agendamento é do servidor e a
# sincronização não depende de nada fora dele.
#
# Não é um serviço que fica de pé: o container sobe, roda um sync e sai
# (`docker compose run --rm etl ...`). Quem agenda é o cron do host.

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TZ=America/Bahia

# tzdata para o horário de Salvador; ca-certificates para o TLS das APIs
# externas (Sympla, CisPay, Conta Azul, Meta, Omie, Google, Gmail).
RUN apt-get update && apt-get install -y --no-install-recommends \
        tzdata ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -g 10001 etl \
    && useradd -u 10001 -g 10001 --create-home --shell /bin/false etl

WORKDIR /app

COPY etl/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY etl/ ./etl/

# UID fixo (10001) porque o JSON da conta de serviço é montado do host: o dono
# do arquivo lá precisa casar com este usuário, e um UID atribuído pelo sistema
# mudaria a cada rebuild da imagem.
USER etl
# Sem CMD útil: o comando vem de quem chama, e rodar a imagem sem argumento
# não deve disparar carga nenhuma.
CMD ["python", "-c", "print('informe o script: python etl/<fonte>_sync.py --sync')"]
