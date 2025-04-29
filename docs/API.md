# RoboMovie API Documentation

## Authentication

RoboMovie uses Supabase for authentication. All API endpoints require a valid JWT token in the Authorization header.

```http
Authorization: Bearer <your_jwt_token>
```

## Base URL

```
http://localhost:3000/api
```

For production, replace with your deployed API URL.

## Endpoints

### Script Management

#### Generate Script
```http
POST /generate-script
```

Generate a new script using AI.

**Request Body:**
```json
{
  "title": "string",
  "genre": "string",
  "length": "number",
  "mode": "managed | self_service",
  "topic": "string?",
  "numberOfScenes": "number"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "isGenerated": true,
  "createdAt": "timestamp"
}
```

#### List Scripts
```http
GET /scripts
```

Get all scripts for the authenticated user.

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "string",
    "content": "string",
    "filePath": "string?",
    "fileSize": "number?",
    "isGenerated": "boolean",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

#### Get Script
```http
GET /scripts/:id
```

Get a specific script by ID.

**Response:**
```json
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "filePath": "string?",
  "fileSize": "number?",
  "isGenerated": "boolean",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Update Script
```http
PUT /scripts/:id
```

Update an existing script.

**Request Body:**
```json
{
  "title": "string?",
  "content": "string?"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "string",
  "content": "string",
  "updatedAt": "timestamp"
}
```

#### Delete Script
```http
DELETE /scripts/:id
```

Delete a script.

**Response:** `204 No Content`

### Storyboarding

#### Process Script
```http
POST /storyboarding/process-script
```

Generate storyboard from a script.

**Request Body:**
```json
{
  "script": "string",
  "scriptId": "string",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "scenes": [
    {
      "id": "string",
      "sceneNumber": "number",
      "title": "string",
      "location": "string",
      "timeOfDay": "string",
      "characters": "string[]",
      "description": "string",
      "shots": [
        {
          "number": "number",
          "angle": "string",
          "movement": "string",
          "composition": "string",
          "lighting": "string",
          "effects": "string",
          "action": "string",
          "scriptSegment": "string?",
          "dialogue": {
            "speaker": "string",
            "text": "string"
          }
        }
      ],
      "technicalRequirements": {
        "equipment": "string[]",
        "vfx": "string[]"
      },
      "emotionalContext": {
        "mood": "string",
        "colorPalette": "string[]",
        "soundCues": "string[]"
      }
    }
  ]
}
```

#### Get Storyboard
```http
GET /storyboards/:userId/:id
```

Get a specific storyboard.

**Response:**
```json
{
  "id": "string",
  "content": {
    "scenes": [
      // Scene object as described above
    ]
  }
}
```

#### Delete Storyboard
```http
DELETE /storyboards/:userId/:id
```

Delete a storyboard.

**Response:** `204 No Content`

### Movie Editing

#### Create Movie Project
```http
POST /movie-editing
```

Create a new movie project.

**Request Body:**
```json
{
  "scriptId": "uuid",
  "title": "string",
  "description": "string?"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string?",
  "status": "processing",
  "createdAt": "timestamp"
}
```

#### Get Movie Project
```http
GET /movie-editing/:id
```

Get a specific movie project.

**Response:**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string?",
  "status": "processing | completed | failed",
  "videoUrl": "string?",
  "duration": "interval",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Update Movie Project
```http
PUT /movie-editing/:id
```

Update a movie project.

**Request Body:**
```json
{
  "title": "string?",
  "description": "string?",
  "status": "string?"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string?",
  "status": "string",
  "updatedAt": "timestamp"
}
```

#### Delete Movie Project
```http
DELETE /movie-editing/:id
```

Delete a movie project.

**Response:** `204 No Content`

### File Management

#### Upload File
```http
POST /upload
Content-Type: multipart/form-data
```

Upload a file.

**Request Body:**
```
file: File
type: "script" | "video" | "audio"
```

**Response:**
```json
{
  "id": "uuid",
  "name": "string",
  "type": "string",
  "size": "number",
  "path": "string",
  "mimeType": "string",
  "createdAt": "timestamp"
}
```

#### Get User Files
```http
GET /user-files/:userId
```

Get all files for a user.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "type": "string",
    "size": "number",
    "path": "string",
    "mimeType": "string",
    "metadata": "object?",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
]
```

### Reference Images

#### Generate Reference Image
```http
POST /reference-image
```

Generate a reference image for a shot.

**Request Body:**
```json
{
  "shot": {
    "number": "number",
    "angle": "string",
    "movement": "string",
    "action": "string"
  },
  "scene": {
    "location": "string",
    "timeOfDay": "string",
    "description": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "imageData": "base64",
  "revisedPrompt": "string"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API requests are limited to:
- 100 requests per minute per IP
- 1000 requests per hour per user
- 5 concurrent requests per user

Exceeding these limits will result in a 429 Too Many Requests response:
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": "number" // seconds until next available request
}
