#!/usr/bin/env python3
"""
IRIS Return Automation — CLI Entry Point

Usage:
    python -m src.main individual --excel data/individual_return.xlsx
    python -m src.main individual --excel data/individual_return.xlsx --headless
    python -m src.main login   # Only log in and save session
"""

import argparse
import sys

from src.browser import launch, close
from src.login import ensure_logged_in, wait_for_login
from src.excel_reader import read_excel
from src.returns.individual import IndividualReturnFiler


RETURN_TYPES = {
    "individual": IndividualReturnFiler,
}


def cmd_login(args):
    browser, context, page = launch()
    try:
        page.goto("https://iris.fbr.gov.pk/auth/login")
        wait_for_login(page)
        print("Session saved successfully!")
    finally:
        close(browser, context)


def cmd_file_return(args):
    browser, context, page = launch()
    try:
        ensure_logged_in(page)

        data_records = read_excel(args.excel)
        if not data_records:
            print("No data found in Excel file.")
            return

        ReturnClass = RETURN_TYPES.get(args.type)
        if not ReturnClass:
            print(f"Unknown return type: {args.type}")
            sys.exit(1)

        for i, record in enumerate(data_records, 1):
            print(f"\n{'='*60}")
            print(f"  Processing record {i}/{len(data_records)}")
            print(f"  NTN: {record.get('ntn', 'N/A')} | Name: {record.get('name', 'N/A')}")
            print(f"{'='*60}")

            filer = ReturnClass(page, record)
            filer.fill()

    finally:
        close(browser, context)


def main():
    parser = argparse.ArgumentParser(description="IRIS Return Automation")
    sub = parser.add_subparsers(dest="command", required=True)

    # login command
    sub.add_parser("login", help="Log in to IRIS and save session")

    # file command
    file_parser = sub.add_parser("file", help="File a return")
    file_parser.add_argument("type", choices=list(RETURN_TYPES.keys()), help="Return type")
    file_parser.add_argument("--excel", required=True, help="Path to Excel data file")
    file_parser.add_argument("--headless", action="store_true", help="Run browser headless")

    args = parser.parse_args()

    if args.command == "login":
        cmd_login(args)
    elif args.command == "file":
        cmd_file_return(args)


if __name__ == "__main__":
    main()
