#!/bin/bash

# Get the GitHub variable from the repository
REPO="xmione/badminton_court"
VARIABLE_NAME="ENV_ENCRYPTION_KEY"

# Get the variable value from GitHub
VARIABLE_VALUE=$(gh variable list --repo "$REPO" --json name,value | jq -r ".[] | select(.name==\"$VARIABLE_NAME\") | .value")

if [ -n "$VARIABLE_VALUE" ]; then
    echo "[OK] $VARIABLE_NAME = $VARIABLE_VALUE"
else
    echo "Error: Variable '$VARIABLE_NAME' not found in '$REPO'." >&2
    exit 1
fi

echo "[OK] Retrieved GitHub variable '$VARIABLE_NAME' from repository '$REPO'."

# Return the variable value
echo "$VARIABLE_VALUE"