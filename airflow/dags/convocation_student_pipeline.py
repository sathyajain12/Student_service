"""
Convocation Student Data Pipeline
----------------------------------
Reads students.xlsx from /opt/airflow/data/, creates the D1 table,
generates batched SQL, and loads it into Cloudflare D1 via wrangler CLI.

Trigger manually from the Airflow UI whenever a new Excel file is ready.
"""

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime
import pandas as pd
import os
import math

EXCEL_PATH = "/opt/airflow/data/students.xlsx"
CLEAN_CSV_PATH = "/opt/airflow/data/students_clean.csv"
SQL_PATH = "/opt/airflow/data/students.sql"
D1_DATABASE = "sssihl-student-services"
TABLE_NAME = "convocation_students"
BATCH_SIZE = 200  # rows per INSERT statement

REQUIRED_COLUMNS = {"reg_no", "name"}
ALL_COLUMNS = ["reg_no", "name", "email", "programme", "category", "campus", "date_of_birth"]


def read_and_validate_excel(**context):
    if not os.path.exists(EXCEL_PATH):
        raise FileNotFoundError(
            f"Excel file not found at {EXCEL_PATH}. "
            "Please place students.xlsx in the airflow/data/ folder."
        )

    df = pd.read_excel(EXCEL_PATH, dtype=str)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(
            f"Excel is missing required columns: {missing}. "
            f"Found columns: {list(df.columns)}"
        )

    # Fill missing optional columns with empty string
    for col in ALL_COLUMNS:
        if col not in df.columns:
            df[col] = ""

    df = df[ALL_COLUMNS]
    df = df.fillna("")
    df["reg_no"] = df["reg_no"].str.strip()
    df["name"] = df["name"].str.strip()

    # Drop rows without reg_no or name
    df = df[df["reg_no"].str.len() > 0]
    df = df[df["name"].str.len() > 0]
    df = df.drop_duplicates(subset=["reg_no"])

    df.to_csv(CLEAN_CSV_PATH, index=False)
    row_count = len(df)
    print(f"✓ Read {row_count} valid student records from Excel")
    context["ti"].xcom_push(key="row_count", value=row_count)


def generate_sql(**context):
    df = pd.read_csv(CLEAN_CSV_PATH, dtype=str).fillna("")
    total = len(df)
    batches = math.ceil(total / BATCH_SIZE)

    def escape(val):
        return val.replace("'", "''")

    lines = []
    for batch_idx in range(batches):
        chunk = df.iloc[batch_idx * BATCH_SIZE : (batch_idx + 1) * BATCH_SIZE]
        values = []
        for _, row in chunk.iterrows():
            vals = ", ".join(
                f"'{escape(str(row[col]))}'" for col in ALL_COLUMNS
            )
            values.append(f"({vals})")
        cols = ", ".join(ALL_COLUMNS)
        statement = (
            f"INSERT OR REPLACE INTO {TABLE_NAME} ({cols}) VALUES\n"
            + ",\n".join(values)
            + ";"
        )
        lines.append(statement)

    with open(SQL_PATH, "w", encoding="utf-8") as f:
        f.write("\n\n".join(lines))

    print(f"✓ Generated SQL for {total} rows in {batches} batch(es) → {SQL_PATH}")


CREATE_TABLE_SQL = (
    f"CREATE TABLE IF NOT EXISTS {TABLE_NAME} ("
    "reg_no TEXT PRIMARY KEY, "
    "name TEXT NOT NULL, "
    "email TEXT, "
    "programme TEXT, "
    "category TEXT, "
    "campus TEXT, "
    "date_of_birth TEXT"
    ");"
)

with DAG(
    dag_id="convocation_student_pipeline",
    description="Load student master data from Excel into Cloudflare D1",
    schedule_interval=None,
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["convocation", "sssihl"],
) as dag:

    t1_read = PythonOperator(
        task_id="read_excel",
        python_callable=read_and_validate_excel,
    )

    t2_create_table = BashOperator(
        task_id="create_table",
        bash_command=(
            f'npx wrangler d1 execute {D1_DATABASE} --remote '
            f'--command "{CREATE_TABLE_SQL}"'
        ),
    )

    t3_generate_sql = PythonOperator(
        task_id="generate_sql",
        python_callable=generate_sql,
    )

    t4_load = BashOperator(
        task_id="load_to_d1",
        bash_command=f"npx wrangler d1 execute {D1_DATABASE} --remote --file {SQL_PATH}",
    )

    t1_read >> t2_create_table >> t3_generate_sql >> t4_load
