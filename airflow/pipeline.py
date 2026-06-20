"""
Convocation Student Data Pipeline
-----------------------------------
Usage: python pipeline.py

Reads airflow/data/students.xlsx, creates the D1 table if needed,
and loads all student records into Cloudflare D1 via wrangler CLI.

Required pip packages: pandas openpyxl
Required: wrangler installed and authenticated (npx wrangler whoami should work)
"""

import pandas as pd
import subprocess
import math
import os
import sys

# ── Config ────────────────────────────────────────────────────────────────────
EXCEL_PATH  = os.path.join(os.path.dirname(__file__), "data", "students.xlsx")
SQL_PATH    = os.path.join(os.path.dirname(__file__), "data", "students.sql")
D1_DATABASE = "sssihl-student-services"
TABLE_NAME  = "convocation_students"
BATCH_SIZE  = 200

# Maps Excel column (after lowercase+underscore normalization) → D1 column name
COLUMN_MAP = {
    "regd._no.": "reg_no",
    "name":      "name",
    "email":     "email",
    "programme": "programme",
    "category":  "category",
    "campus":    "campus",
}

D1_COLUMNS    = list(COLUMN_MAP.values())   # reg_no, name, email, ...
REQUIRED_COLS = {"regd._no.", "name"}       # normalized names that must exist
# ──────────────────────────────────────────────────────────────────────────────


def run_wrangler(args, label):
    print(f"\n[{label}] Running: npx wrangler {' '.join(args)}")
    env = os.environ.copy()
    env.pop("CLOUDFLARE_API_TOKEN", None)   # use stored wrangler login, not .env token
    result = subprocess.run(
        "npx wrangler " + " ".join(args),
        capture_output=True, text=True, shell=True,
        encoding='utf-8', errors='replace', env=env
    )
    if result.stdout:
        print(result.stdout[:500])
    if result.returncode != 0:
        print(f"ERROR:\n{(result.stderr or result.stdout or 'unknown error')[:1000]}")
        sys.exit(1)
    print(f"[{label}] Done.")


def task_read_excel():
    print("\n── Task 1: Read & validate Excel ──────────────────────────────")
    if not os.path.exists(EXCEL_PATH):
        print(f"ERROR: File not found: {EXCEL_PATH}")
        print("Place your students.xlsx in the airflow/data/ folder and re-run.")
        sys.exit(1)

    df = pd.read_excel(EXCEL_PATH, dtype=str)

    # Normalize column headers
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        print(f"ERROR: Excel missing required columns: {missing}")
        print(f"Found columns: {list(df.columns)}")
        sys.exit(1)

    # Keep only mapped columns, fill missing optional ones with ""
    for col in COLUMN_MAP:
        if col not in df.columns:
            df[col] = ""

    df = df[list(COLUMN_MAP.keys())].fillna("").copy()

    # Rename to D1 column names
    df = df.rename(columns=COLUMN_MAP)

    df["reg_no"] = df["reg_no"].str.strip()
    df["name"]   = df["name"].str.strip()
    df = df[df["reg_no"].str.len() > 0]
    df = df[df["name"].str.len() > 0]
    df = df.drop_duplicates(subset=["reg_no"])

    print(f"✓ {len(df)} valid student records loaded from Excel")
    return df


def task_generate_sql(df):
    print("\n── Task 2 & 3: Generate SQL file ───────────────────────────────")

    def esc(val):
        return str(val).replace("'", "''")

    create = (
        f"CREATE TABLE IF NOT EXISTS {TABLE_NAME} "
        "(reg_no TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, "
        "programme TEXT, category TEXT, campus TEXT);"
    )

    batches = math.ceil(len(df) / BATCH_SIZE)
    insert_blocks = []
    for i in range(batches):
        chunk = df.iloc[i * BATCH_SIZE : (i + 1) * BATCH_SIZE]
        values = []
        for _, row in chunk.iterrows():
            vals = ", ".join(f"'{esc(row[col])}'" for col in D1_COLUMNS)
            values.append(f"({vals})")
        cols = ", ".join(D1_COLUMNS)
        insert_blocks.append(
            f"INSERT OR REPLACE INTO {TABLE_NAME} ({cols}) VALUES\n"
            + ",\n".join(values) + ";"
        )

    with open(SQL_PATH, "w", encoding="utf-8") as f:
        f.write(create + "\n\n" + "\n\n".join(insert_blocks))

    print(f"✓ SQL written to {SQL_PATH} ({batches} batch(es), {len(df)} rows)")


def task_load_to_d1():
    print("\n── Task 4: Load into Cloudflare D1 ────────────────────────────")
    sql_path_fwd = SQL_PATH.replace("\\", "/")
    run_wrangler(
        ["d1", "execute", D1_DATABASE, "--remote", "--file", f'"{sql_path_fwd}"'],
        "load_to_d1"
    )


def main():
    print("=" * 60)
    print("  Convocation Student Data Pipeline")
    print("=" * 60)

    df = task_read_excel()
    task_generate_sql(df)
    task_load_to_d1()

    print("\n" + "=" * 60)
    print(f"  ✓ Pipeline complete — {len(df)} students loaded into D1")
    print("=" * 60)


if __name__ == "__main__":
    main()
