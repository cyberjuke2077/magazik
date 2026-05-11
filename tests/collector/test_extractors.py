"""Tests for data extractors."""

import pytest
from scripts.collector.extractors.base import BaseExtractor, ExtractResult
from scripts.collector.extractors.chipdip import ChipDipExtractor


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


def test_chipdip_get_url():
    """Test ChipDip URL generation."""
    extractor = ChipDipExtractor()
    url = extractor.get_url("AOZ1284PI", "AOS")
    
    assert "chipdip.ru" in url
    assert "AOZ1284PI" in url
