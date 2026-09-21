# -*- coding: utf-8 -*-
"""
Git repository initialization, staging, and push script using Dulwich
"""

import os
import sys
from dulwich import porcelain
from dulwich.repo import Repo

REPO_PATH = r"c:\Lakshmi Priya\OOSE"
REMOTE_URL = "https://github.com/2416108/ParkMate.git"

def main():
    print(f"Initializing/Checking Git repository at {REPO_PATH}...")
    git_dir = os.path.join(REPO_PATH, ".git")
    if not os.path.exists(git_dir):
        repo = porcelain.init(REPO_PATH)
        print("Initialized empty Git repository.")
    else:
        repo = Repo(REPO_PATH)
        print("Existing Git repository loaded.")

    # Status check
    status = porcelain.status(REPO_PATH)
    print("Untracked files count:", len(status.untracked))
    
    # Filter files based on exclusions
    # Dulwich porcelain.add respects .gitignore or we can explicitly pass files
    print("Staging files...")
    # Add files
    porcelain.add(REPO_PATH)
    
    # Check what is staged
    status_after = porcelain.status(REPO_PATH)
    staged_new = len(status_after.staged['add'])
    print(f"Staged {staged_new} files for commit.")
    for f in list(status_after.staged['add'])[:15]:
        print(f"  + {f.decode('utf-8') if isinstance(f, bytes) else f}")
    if staged_new > 15:
        print(f"  ... and {staged_new - 15} more files.")

    # Commit
    if staged_new > 0:
        commit_id = porcelain.commit(
            REPO_PATH,
            message=b"Initial commit: ParkMate Smart Parking Management System (Source Code)",
            author=b"Lakshmi Priya <lakshmipriya@users.noreply.github.com>",
            committer=b"Lakshmi Priya <lakshmipriya@users.noreply.github.com>"
        )
        print("Commit created successfully with hash:", commit_id.decode() if isinstance(commit_id, bytes) else commit_id)
    else:
        print("No new files to commit.")

    # Set branch to main
    try:
        config = repo.get_config()
    except Exception:
        pass

    print("\nAttempting to push to remote repository:", REMOTE_URL)
    try:
        # Push to remote
        porcelain.push(repo, REMOTE_URL, refspecs=b"refs/heads/master:refs/heads/main")
        print("Successfully pushed to main branch!")
    except Exception as e:
        print("Push result / error:", e)

if __name__ == "__main__":
    main()
