from typing import TypeVar, Generic

from pydantic import BaseModel
T = TypeVar('T')

class ResponseObject(BaseModel, Generic[T]):
    code: str
    message: str
    data: T | None = None
    errors: list[str] | None = None