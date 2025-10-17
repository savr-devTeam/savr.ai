/**
 * EXAMPLE: Protected Documents Route with Authentication
 * 
 * This file demonstrates how to protect API routes and scope data to authenticated users.
 * To use this:
 * 1. Rename to documents.js (or create a new route file)
 * 2. Update server.js to use verifyToken middleware if needed
 * 3. Ensure your DynamoDB table has a userId field
 */

import express from "express";
import AWS from "aws-sdk";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure AWS
AWS.config.update({ region: "us-east-1" });
const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * GET /documents
 * Returns documents for the authenticated user only
 * Requires: Bearer token in Authorization header
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    // req.user is populated by verifyToken middleware
    const userId = req.user.sub; // Cognito user ID

    const params = {
      TableName: "Users",
      FilterExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
    };

    const result = await dynamodb.scan(params).promise();

    res.json({
      success: true,
      count: result.Items.length,
      documents: result.Items,
    });
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ 
      error: "Failed to fetch documents",
      message: err.message 
    });
  }
});

/**
 * GET /documents/:id
 * Returns a specific document if it belongs to the authenticated user
 */
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const documentId = req.params.id;

    const params = {
      TableName: "Users",
      Key: { id: documentId },
    };

    const result = await dynamodb.get(params).promise();

    if (!result.Item) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Verify document belongs to user
    if (result.Item.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      success: true,
      document: result.Item,
    });
  } catch (err) {
    console.error("Error fetching document:", err);
    res.status(500).json({ 
      error: "Failed to fetch document",
      message: err.message 
    });
  }
});

/**
 * POST /documents
 * Creates a new document for the authenticated user
 */
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const userEmail = req.user.email;
    
    const documentData = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId,
      userEmail: userEmail,
      createdAt: new Date().toISOString(),
      ...req.body, // Spread the request body data
    };

    const params = {
      TableName: "Users",
      Item: documentData,
    };

    await dynamodb.put(params).promise();

    res.status(201).json({
      success: true,
      message: "Document created successfully",
      document: documentData,
    });
  } catch (err) {
    console.error("Error creating document:", err);
    res.status(500).json({ 
      error: "Failed to create document",
      message: err.message 
    });
  }
});

/**
 * PUT /documents/:id
 * Updates a document if it belongs to the authenticated user
 */
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const documentId = req.params.id;

    // First verify the document exists and belongs to the user
    const getParams = {
      TableName: "Users",
      Key: { id: documentId },
    };

    const existing = await dynamodb.get(getParams).promise();

    if (!existing.Item) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (existing.Item.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Update the document
    const updateParams = {
      TableName: "Users",
      Key: { id: documentId },
      UpdateExpression: "set #data = :data, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#data": "data",
      },
      ExpressionAttributeValues: {
        ":data": req.body,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    };

    const result = await dynamodb.update(updateParams).promise();

    res.json({
      success: true,
      message: "Document updated successfully",
      document: result.Attributes,
    });
  } catch (err) {
    console.error("Error updating document:", err);
    res.status(500).json({ 
      error: "Failed to update document",
      message: err.message 
    });
  }
});

/**
 * DELETE /documents/:id
 * Deletes a document if it belongs to the authenticated user
 */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const documentId = req.params.id;

    // First verify the document exists and belongs to the user
    const getParams = {
      TableName: "Users",
      Key: { id: documentId },
    };

    const existing = await dynamodb.get(getParams).promise();

    if (!existing.Item) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (existing.Item.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete the document
    const deleteParams = {
      TableName: "Users",
      Key: { id: documentId },
    };

    await dynamodb.delete(deleteParams).promise();

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ 
      error: "Failed to delete document",
      message: err.message 
    });
  }
});

/**
 * GET /documents/user/profile
 * Returns the authenticated user's profile information
 */
router.get("/user/profile", verifyToken, (req, res) => {
  // req.user contains the decoded JWT token data
  res.json({
    success: true,
    user: {
      id: req.user.sub,
      email: req.user.email,
      username: req.user.username,
      tokenUse: req.user.token_use,
    },
  });
});

export default router;

