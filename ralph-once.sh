#!/bin/bash

# Check if folder argument is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <folder-name>"
    echo "Example: $0 issue-42"
    exit 1
fi

FOLDER="$1"

# Check if folder exists
if [ ! -d "specs/$FOLDER" ]; then
    echo "Error: Folder '$FOLDER' does not exist"
    exit 1
fi

claude --permission-mode acceptEdits "spec/@$FOLDER/PRD.md @specs/$FOLDER/progress.txt \
1. Read the PRD and progress file. \
2. Find the next incomplete task and implement it. \
3. Commit your changes. \
4. Update progress.txt with what you did. \
ONLY DO ONE TASK AT A TIME."