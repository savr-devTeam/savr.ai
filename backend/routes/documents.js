import express from "express";
import AWS from "aws-sdk";

const router = express.Router();

// Configure AWS
AWS.config.update({ region: "us-east-1" }); // your region
const dynamodb = new AWS.DynamoDB.DocumentClient();

// GET /documents  → returns all DynamoDB items
router.get("/", async (req, res) => {
  try {
    const params = { TableName: "Users" }; // your table name
    const result = await dynamodb.scan(params).promise();

    res.json(result.Items);
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

export default router;
