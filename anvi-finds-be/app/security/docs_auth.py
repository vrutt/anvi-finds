
import secrets

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app.config.settings import settings

security = HTTPBasic()


def authenticate_docs(
    credentials: HTTPBasicCredentials = Depends(security),
):
    username_valid = secrets.compare_digest(
        credentials.username,
        settings.SWAGGER_USERNAME,
    )

    password_valid = secrets.compare_digest(
        credentials.password,
        settings.SWAGGER_PASSWORD,
    )

    if not (username_valid and password_valid):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid documentation credentials",
            headers={"WWW-Authenticate": "Basic"},
        )

    return credentials.username
