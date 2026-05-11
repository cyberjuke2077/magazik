"""Tests for data extractors."""

import pytest
from scripts.collector.extractors.base import BaseExtractor, ExtractResult


def test_extract_result_success():
    """Test successful extraction result."""
    result = ExtractResult.success({"name": "Test"})
    
    assert result.success is True
    assert result.data == {"name": "Test"}
    assert result.error is None


def test_extract_result_failure():
    """Test failed extraction result."""
    result = ExtractResult.failure("Not found")
    
    assert result.success is False
    assert result.data is None
    assert result.error == "Not found"
