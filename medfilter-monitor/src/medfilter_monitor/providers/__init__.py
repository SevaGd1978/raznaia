"""Базовый интерфейс провайдера данных о закупках."""

from __future__ import annotations

from abc import ABC, abstractmethod

from ..models import Procurement


class Provider(ABC):
    name: str = "base"

    @abstractmethod
    def search(self, query: str, *, limit: int = 25) -> list[Procurement]:
        raise NotImplementedError
