#!/bin/bash
# Script to update model names in DynamoDB using AWS CLI
# Changes:
# - "Sman" → "man"
# - "Scat" → "dog"
#
# Prerequisites:
# - AWS CLI installed and configured
# - Credentials with DynamoDB update permissions
#
# Usage: bash update-model-names.sh

TABLE_NAME="lego_users"
REGION="us-east-1"

echo "Starting update of model names in DynamoDB table: $TABLE_NAME"
echo "Region: $REGION"
echo ""

# Get all items with modelName Sman or Scat
echo "Scanning for items with modelName 'Sman' or 'Scat'..."

# Use query or scan to find items
aws dynamodb scan \
  --table-name $TABLE_NAME \
  --region $REGION \
  --filter-expression "modelName IN (:sman, :scat)" \
  --expression-attribute-values '{":sman":{"S":"Sman"},":scat":{"S":"Scat"}}' \
  --output json > /tmp/scan_results.json

# Count items found
ITEM_COUNT=$(jq '.Items | length' /tmp/scan_results.json)
echo "Found $ITEM_COUNT items to update"
echo ""

# Process each item and update
jq -r '.Items[] | "\(.user.S) \(.actionId.N)"' /tmp/scan_results.json | while read user actionId; do
  # Get the old modelName to display
  OLD_MODEL=$(jq -r ".Items[] | select(.user.S == \"$user\" and .actionId.N == \"$actionId\") | .modelName.S" /tmp/scan_results.json)
  
  # Determine new model name
  if [ "$OLD_MODEL" = "Sman" ]; then
    NEW_MODEL="man"
  elif [ "$OLD_MODEL" = "Scat" ]; then
    NEW_MODEL="dog"
  else
    continue
  fi

  echo "Updating: $OLD_MODEL → $NEW_MODEL (user: $user, actionId: $actionId)"

  # Update the item
  aws dynamodb update-item \
    --table-name $TABLE_NAME \
    --region $REGION \
    --key "{\"user\":{\"S\":\"$user\"},\"actionId\":{\"N\":\"$actionId\"}}" \
    --update-expression "SET modelName = :newName" \
    --expression-attribute-values '{":newName":{"S":"'"$NEW_MODEL"'"}}' \
    --output text > /dev/null
done

echo ""
echo "✓ Update complete!"
echo "  - Sman → man"
echo "  - Scat → dog"
echo ""
echo "Note: If no items were found, the DynamoDB table may not have records with"
echo "those model names, or they may be stored with different casing."
