'use strict';

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand
} from "@aws-sdk/lib-dynamodb";

// Use the Lambda function's configured AWS region.
const client = new DynamoDBClient({});
const dclient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    console.log("Received event:", JSON.stringify(event));

    // Support both API Gateway proxy events, where the JSON is in event.body,
    // and the existing direct event format.
    const request =
        typeof event.body === "string"
            ? JSON.parse(event.body)
            : event.body || event;

    const item = {
        ActionDetails: request.ActionDetails,

        // Must exactly match "actionId" sent from students.js.
        actionId: request.actionId,

        ActionType: request.ActionType,
        block: request.block,
        group: request.group,
        model: request.model,
        modelOrder: request.modelOrder,
        part: request.part,
        step: request.step,
        time: request.time,
        user: request.user
    };

    console.log("Writing DynamoDB item:", JSON.stringify(item));

    const command = new PutCommand({
        TableName: "lego_users",
        Item: item
    });

    try {
        const result = await dclient.send(command);

        console.log(
            "DynamoDB put succeeded:",
            JSON.stringify(item)
        );

        // An empty object is a normal successful DynamoDB Put response.
        return {};
    } catch (error) {
        console.error("DynamoDB put failed:", error);
        throw error;
    }
};