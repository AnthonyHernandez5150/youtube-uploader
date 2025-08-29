#!/usr/bin/env python3
"""
Script Manager - Handles the pre-generated script database
Provides scripts to the video pipeline without API calls
"""

import json
import random
from datetime import datetime
from pathlib import Path

SCRIPTS_FILE = Path("data/bible_scripts.json")

class ScriptManager:
    def __init__(self):
        self.scripts_file = SCRIPTS_FILE
        self.data = self.load_scripts()
    
    def load_scripts(self):
        """Load scripts from database file"""
        if self.scripts_file.exists():
            try:
                with open(self.scripts_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading scripts: {e}")
                return {"scripts": [], "generated_at": datetime.now().isoformat()}
        return {"scripts": [], "generated_at": datetime.now().isoformat()}
    
    def save_scripts(self):
        """Save scripts back to database"""
        with open(self.scripts_file, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)
    
    def get_next_script(self, mark_used=True):
        """Get the next unused script"""
        unused_scripts = [s for s in self.data["scripts"] if not s.get("used", False)]
        
        if not unused_scripts:
            return None
        
        # Get random unused script for variety
        script = random.choice(unused_scripts)
        
        if mark_used:
            # Mark as used
            for i, s in enumerate(self.data["scripts"]):
                if s["id"] == script["id"]:
                    self.data["scripts"][i]["used"] = True
                    self.data["scripts"][i]["used_at"] = datetime.now().isoformat()
                    break
            
            self.save_scripts()
        
        return script
    
    def get_script_stats(self):
        """Get statistics about script usage"""
        total = len(self.data["scripts"])
        used = len([s for s in self.data["scripts"] if s.get("used", False)])
        unused = total - used
        
        return {
            "total": total,
            "used": used,
            "unused": unused,
            "usage_percentage": (used / total * 100) if total > 0 else 0
        }
    
    def reset_usage(self):
        """Reset all scripts to unused (for testing)"""
        for script in self.data["scripts"]:
            script["used"] = False
            if "used_at" in script:
                del script["used_at"]
        
        self.save_scripts()
        print("✅ All scripts reset to unused")
    
    def preview_next_scripts(self, count=5):
        """Preview upcoming unused scripts"""
        unused_scripts = [s for s in self.data["scripts"] if not s.get("used", False)]
        
        if not unused_scripts:
            print("❌ No unused scripts available!")
            return
        
        print(f"📋 Next {min(count, len(unused_scripts))} unused scripts:")
        print("=" * 60)
        
        for i, script in enumerate(unused_scripts[:count]):
            print(f"\n🎬 Script {i+1} (ID: {script['id']}):")
            print(f"Style: {script.get('style', 'Unknown')}")
            print(f"Verse: {script.get('verse', 'Unknown')[:50]}...")
            print("Script Preview:")
            print(script['script'][:200] + ("..." if len(script['script']) > 200 else ""))
            print("-" * 40)

def get_script_for_pipeline():
    """
    Simple function for pipeline integration
    Returns just the script text, ready to use
    """
    manager = ScriptManager()
    script_data = manager.get_next_script()
    
    if not script_data:
        # Fallback script if database is empty
        return """HOOK: This Bible verse will inspire you today!
VERSE: Trust in the Lord with all your heart.
MEANING: Complete faith brings peace and direction.
APPLICATION: Choose trust over worry in every situation.
CTA: Share your testimony! #Bible #Faith #Trust #Inspiration"""
    
    return script_data["script"]

def check_script_supply():
    """Check if we need to generate more scripts"""
    manager = ScriptManager()
    stats = manager.get_script_stats()
    
    print(f"📊 Script Supply Status:")
    print(f"   Total scripts: {stats['total']}")
    print(f"   Used: {stats['used']}")
    print(f"   Remaining: {stats['unused']}")
    print(f"   Usage: {stats['usage_percentage']:.1f}%")
    
    if stats['unused'] < 10:
        print("\n⚠️  LOW SCRIPT SUPPLY!")
        print("   Run batch_script_generator.py to create more scripts")
        return False
    elif stats['unused'] < 25:
        print("\n🔔 Consider generating more scripts soon")
        return True
    else:
        print("\n✅ Good script supply")
        return True

if __name__ == "__main__":
    print("🎬 Bible Script Manager")
    print("=" * 30)
    
    manager = ScriptManager()
    
    # Show status
    check_script_supply()
    
    print("\nOptions:")
    print("1. Get next script")
    print("2. Preview upcoming scripts") 
    print("3. Show detailed stats")
    print("4. Reset all usage (testing)")
    print("5. Exit")
    
    while True:
        choice = input("\nEnter choice (1-5): ").strip()
        
        if choice == "1":
            script = manager.get_next_script()
            if script:
                print(f"\n🎬 Next Script (ID: {script['id']}):")
                print(f"Style: {script.get('style', 'Unknown')}")
                print(f"Verse: {script.get('verse', 'Unknown')}")
                print("\nScript:")
                print(script['script'])
                print("\n✅ Script marked as used")
            else:
                print("❌ No unused scripts available!")
                
        elif choice == "2":
            count = input("How many to preview? (default 5): ").strip()
            count = int(count) if count.isdigit() else 5
            manager.preview_next_scripts(count)
            
        elif choice == "3":
            stats = manager.get_script_stats()
            print(f"\n📊 Detailed Stats:")
            print(f"   Total scripts in database: {stats['total']}")
            print(f"   Scripts used: {stats['used']}")
            print(f"   Scripts remaining: {stats['unused']}")
            print(f"   Usage percentage: {stats['usage_percentage']:.1f}%")
            
        elif choice == "4":
            confirm = input("Reset all scripts to unused? (y/N): ").strip()
            if confirm.lower().startswith('y'):
                manager.reset_usage()
            
        elif choice == "5":
            break
            
        else:
            print("Invalid choice. Try again.")
