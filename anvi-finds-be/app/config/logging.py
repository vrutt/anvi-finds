
"""Configure application logging and UTC calendar-day retention."""

import logging
import os
import re
import time
from datetime import datetime, timedelta, timezone
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path

from app.utils.constant import LogSettings


LOG_DIRECTORY = Path(__file__).resolve().parents[2] / LogSettings.LOG_DIRECTORY_NAME


class DailyLogHandler(TimedRotatingFileHandler):
    """Rotate at UTC midnight and retain today plus preceding UTC dates."""

    def __init__(self, directory: Path):
        directory.mkdir(parents=True, exist_ok=True)

        super().__init__(
            directory / LogSettings.LOG_FILE_NAME,
            when="midnight",
            interval=1,
            backupCount=0,
            encoding="utf-8",
            utc=True,
            delay=False,
        )

        self.directory = directory

    def purge_expired(self, now: datetime | None = None) -> None:
        """Delete only this handler's dated archives outside the retention window."""

        cutoff = (
            (now or datetime.now(timezone.utc)).astimezone(timezone.utc).date()
            - timedelta(days=LogSettings.LOG_RETENTION_DAYS - 1)
        )

        pattern = rf"{re.escape(LogSettings.LOG_FILE_NAME)}\.(\d{{4}}-\d{{2}}-\d{{2}})"

        for path in self.directory.iterdir():
            match = re.fullmatch(pattern, path.name)

            if not match or not path.is_file():
                continue

            try:
                archive_day = datetime.strptime(
                    match.group(1), "%Y-%m-%d"
                ).date()
            except ValueError:
                continue

            if archive_day < cutoff:
                path.unlink(missing_ok=True)

    def doRollover(self) -> None:
        """Rotate the active log file and remove expired archives."""

        super().doRollover()
        self.purge_expired()


def configure_logging(directory: Path = LOG_DIRECTORY) -> logging.Handler:
    """Use console logging on Vercel and rotating file logging locally."""

    if os.getenv("VERCEL") == "1":
        handler = logging.StreamHandler()
    else:
        handler = DailyLogHandler(directory)

        if handler.rolloverAt <= time.time():
            handler.doRollover()

        handler.purge_expired()

    handler.setFormatter(
        logging.Formatter(
            "%(asctime)s %(levelname)s %(name)s %(message)s"
        )
    )

    root = logging.getLogger()
    root.addHandler(handler)
    root.setLevel(logging.INFO)

    return handler


def close_logging(handler: logging.Handler) -> None:
    """Detach and close the application logging handler."""

    root = logging.getLogger()
    root.removeHandler(handler)

    handler.flush()
    handler.close()
