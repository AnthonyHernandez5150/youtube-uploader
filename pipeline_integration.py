#!/usr/bin/env python3
"""
Pipeline Integration Script
Replaces HuggingFace Space calls with local script database
"""

import sys
import os
from pathlib import Path

# Add current directory to path for imports
sys.path.append(str(Path(__file__).parent))

from script_manager import get_script_for_pipeline, check_script_supply

def analyze_verse_for_script(verse_text: str = ""):
    """
    Drop-in replacement for HuggingFace Space function
    Returns pre-generated script instead of calling API
    """
    # Check script supply first
    if not check_script_supply():
        print("⚠️  Warning: Low script supply! Generate more scripts soon.")
    
    # Get pre-generated script
    script = get_script_for_pipeline()
    
    print(f"✅ Retrieved script from local database")
    return script

def test_pipeline_integration():
    """Test the pipeline integration"""
    print("🧪 Testing Pipeline Integration")
    print("=" * 40)
    
    # Test getting several scripts
    for i in range(3):
        print(f"\n📝 Test {i+1}: Getting script...")
        script = analyze_verse_for_script("John 3:16")
        print("Received script:")
        print(script)
        print("-" * 40)

if __name__ == "__main__":
    test_pipeline_integration()
