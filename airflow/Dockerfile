FROM apache/airflow:2.9.0

USER root

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g wrangler

USER airflow

RUN pip install --no-cache-dir openpyxl pandas
