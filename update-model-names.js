#!/usr/bin/env node
/**
 * Script to update model names in DynamoDB table
 * Changes:
 * - "Sman" → "man"
 * - "Scat" → "dog"
 * 
 * Usage: node update-model-names.js
 */

const AWS = require('aws-sdk');

// Configure AWS SDK
const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: 'us-east-1'
});

const TABLE_NAME = 'lego_users';

async function updateModelNames() {
    try {
        console.log(`Starting update of model names in table: ${TABLE_NAME}`);
        
        // Scan all items with modelName Sman or Scat
        let params = {
            TableName: TABLE_NAME,
            FilterExpression: 'modelName IN (:sman, :scat)',
            ExpressionAttributeValues: {
                ':sman': 'Sman',
                ':scat': 'Scat'
            }
        };

        let items = [];
        let data;

        // Scan with pagination
        do {
            data = await dynamodb.scan(params).promise();
            items = items.concat(data.Items);
            params.ExclusiveStartKey = data.LastEvaluatedKey;
        } while (data.LastEvaluatedKey);

        console.log(`Found ${items.length} items to update`);

        // Update each item
        for (const item of items) {
            const oldName = item.modelName;
            let newName;

            if (oldName === 'Sman') {
                newName = 'man';
            } else if (oldName === 'Scat') {
                newName = 'dog';
            } else {
                continue;
            }

            // Update item
            const updateParams = {
                TableName: TABLE_NAME,
                Key: {
                    user: item.user,
                    actionId: item.actionId
                },
                UpdateExpression: 'SET modelName = :newName',
                ExpressionAttributeValues: {
                    ':newName': newName
                }
            };

            await dynamodb.update(updateParams).promise();
            console.log(`Updated: ${oldName} → ${newName} (user: ${item.user}, actionId: ${item.actionId})`);
        }

        console.log(`\n✓ Successfully updated ${items.length} items`);
        console.log('- Sman → man');
        console.log('- Scat → dog');

    } catch (error) {
        console.error('Error updating model names:', error);
        process.exit(1);
    }
}

// Run the update
updateModelNames();
