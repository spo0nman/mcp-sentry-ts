# Sentry MCP Server

A Model Context Protocol (MCP) server for interacting with Sentry.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set the Sentry authentication token as an environment variable:
   ```
   export SENTRY_AUTH=your_sentry_auth_token
   ```

## Available Tools

### list_projects

Lists all accessible Sentry projects for a given organization.

**Parameters:**
- `organization_slug` (string, required): The slug of the organization to list projects from
- `view` (string, optional): View type, either "summary" or "detailed" (default: "detailed")
- `format` (string, optional): Output format, either "plain" or "markdown" (default: "markdown")

**Example Usage:**
```json
{
  "organization_slug": "your-organization",
  "view": "detailed",
  "format": "markdown"
}
```

**Response:**
The tool returns a formatted list or table of projects with details such as:
- Project ID
- Project Name
- Project Slug
- Platform
- Teams
- Environments
- Features

## Running the Server

```
node index.js
```

## Authentication

This tool requires a Sentry authentication token with appropriate permissions to access the Sentry API. You can generate a token in your Sentry account settings under "API Keys".

## Error Handling

The server includes comprehensive error handling for:
- Missing authentication token
- API request failures
- Invalid parameters
- Network errors

All errors are logged to the console for debugging.
