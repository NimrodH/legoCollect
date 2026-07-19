"use strict";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand
} from "@aws-sdk/lib-dynamodb";

// Use the Lambda function's configured AWS region.
const client = new DynamoDBClient({});
const dclient = DynamoDBDocumentClient.from(client);

// DynamoDB table used for regular building actions.
const USER_ACTIONS_TABLE = "lego_users";

// DynamoDB table used when the participant selects NO.
const USER_RESULTS_TABLE = "lego_user_results";

export const handler = async (event) => {
    console.log("Received event:", JSON.stringify(event));

    // Support API Gateway proxy events and direct Lambda test events.
    const request =
        typeof event.body === "string"
            ? JSON.parse(event.body)
            : event.body || event;

    try {
        // A userResult request is produced only by the NO button.
        if (request.requestType === "userResult") {
            return await saveUserResult(request);
        }

        // Requests without userResult remain regular user-action requests.
        return await saveUserAction(request);
    } catch (error) {
        console.error("DynamoDB write failed:", error);
        throw error;
    }
};

// Save a regular building action in the existing lego_users table.
async function saveUserAction(request) {
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

    console.log(
        "Writing user action:",
        JSON.stringify(item)
    );

    const command = new PutCommand({
        TableName: USER_ACTIONS_TABLE,
        Item: item
    });

    await dclient.send(command);

    console.log(
        "User action saved:",
        JSON.stringify(item)
    );

    // An empty object is a normal successful response for the existing client.
    return {};
}

// Save the participant's result in the new lego_user_results table.
async function saveUserResult(request) {
    if (
        request.user === undefined ||
        request.group === undefined ||
        request.completedModelCount === undefined ||
        request.time === undefined
    ) {
        throw new Error(
            "userResult requires user, group, completedModelCount and time"
        );
    }

    const item = {
        // Store user consistently as a String.
        user: String(request.user),

        group: request.group,

        // Store the model count and timestamp as DynamoDB Numbers.
        completedModelCount: Number(request.completedModelCount),
        time: Number(request.time),

        // This can help identify the record when inspecting the table.
        resultType: "NO"
    };

    console.log(
        "Writing user result:",
        JSON.stringify(item)
    );

    const command = new PutCommand({
        TableName: USER_RESULTS_TABLE,
        Item: item
    });

    await dclient.send(command);

    console.log(
        "User result saved:",
        JSON.stringify(item)
    );

    return {};
}