#!/bin/bash
set -e

# Configuration
TIMEOUT_SECONDS=600  # 10 minutes per iteration
LOG_FILE="ralph-afk.log"

# Check if folder argument is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <folder-name> <iterations>"
    echo "Example: $0 issue-42 5"
    exit 1
fi
FOLDER="$1"

if [ -z "$2" ]; then
  echo "Usage: $0 <folder-name> <iterations>"
  exit 1
fi

ITERATIONS="$2"

echo "Starting ralph-afk for specs/$FOLDER with $ITERATIONS iterations"
echo "Logging to $LOG_FILE"
echo "---" >> "$LOG_FILE"
echo "$(date): Starting run for $FOLDER with $ITERATIONS iterations" >> "$LOG_FILE"

for ((i=1; i<=$ITERATIONS; i++)); do
  echo "=== Iteration $i of $ITERATIONS ==="
  echo "$(date): Starting iteration $i" >> "$LOG_FILE"

  result=$(gtimeout $TIMEOUT_SECONDS claude --dangerously-skip-permissions -p "@specs/$FOLDER/PRD.md @specs/$FOLDER/progress.txt \
  1. Find the highest-priority task and implement it. \
  2. Run your tests and type checks. \
  3. Update the PRD with what was done. \
  4. Append your progress to progress.txt. \
  5. Commit your changes. \
  ONLY WORK ON A SINGLE TASK. \
  If the PRD is complete, output <promise>COMPLETE</promise>." 2>&1) || {
    exit_code=$?
    if [ $exit_code -eq 124 ]; then
      echo "WARNING: Iteration $i timed out after $TIMEOUT_SECONDS seconds"
      echo "$(date): Iteration $i TIMED OUT" >> "$LOG_FILE"
      continue
    else
      echo "ERROR: Claude exited with code $exit_code"
      echo "$(date): Iteration $i failed with exit code $exit_code" >> "$LOG_FILE"
      exit $exit_code
    fi
  }

  echo "$result"
  echo "$result" >> "$LOG_FILE"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete after $i iterations."
    echo "$(date): PRD COMPLETE after $i iterations" >> "$LOG_FILE"
    exit 0
  fi

  echo "$(date): Iteration $i completed" >> "$LOG_FILE"
done

echo "Completed $ITERATIONS iterations without PRD completion."
echo "$(date): Finished $ITERATIONS iterations without completion" >> "$LOG_FILE"