# Document Viewer

Full-featured document viewer and annotation system built with Angular 13 (frontend) and Node.js + Express + MongoDB (backend). Supports PDF, TIFF, and JPG file viewing with annotations, drawing tools, stamps, image adjustments, and more.

## Features

- **File Viewing**: PDF (via pdf.js), TIFF (via UTIF.js), and JPG rendering on canvas
- **Export**: Export to PDF, TIFF, JPG/JPEG with quality settings
- **Sticky Notes**: Add, edit, delete with color options
- **Rubber Stamps**: Standard stamps (APPROVED, REJECTED, etc.) + custom stamps
- **Drawing Tools**: Arrow, circle, line, highlighter, freehand drawing
- **Crop**: Interactive crop tool with visual selection
- **Rotate**: 90/180/270 degree rotation
- **Image Adjustments**: Brightness and contrast sliders
- **Thumbnail Panel**: Right-side panel with page thumbnails and click navigation
- **Pagination**: Max 200 pages, first/last/prev/next navigation, go-to-page
- **Multi-document Navigation**: Previous/next document switching
- **File Selection**: Multi-select for batch delete
- **Re-indexing**: Drag-and-drop reorder of documents
- **Delete**: Single and batch file deletion
- **Cross References**: Link and navigate between related documents
- **Zoom Controls**: Zoom in/out, fit to screen, actual size, pan
- **Undo/Redo**: Full command-pattern undo/redo for all annotation actions
- **Auto-save**: Debounced auto-save of annotations (5-second delay)

## Prerequisites

- Node.js 16+ and npm
- MongoDB (running locally on port 27017, or set `MONGO_URI` env variable)
- Angular CLI 13 (installed globally or via npx)

## Quick Start

### 1. Start MongoDB

Make sure MongoDB is running locally:

```bash
mongod
```

Or use Docker:

```bash
docker run -d -p 27017:27017 --name mongo mongo:6
```

### 2. Start the Backend

```bash
cd server
npm install
npm start
```

Server runs on http://localhost:3000

### 3. Add Sample Files

Place PDF, TIFF, and/or JPG files into the `server/assets/` folder. The server will automatically scan and index them on first load.

### 4. Start the Frontend

```bash
cd client
npm install
npx ng serve
```

Frontend runs on http://localhost:4200

### 5. Open the Application

Navigate to http://localhost:4200 in your browser.

## Project Structure

```
vector-viewer/
  server/                         # Node.js + Express backend
    index.js                      # Express app entry point
    config/db.js                  # MongoDB connection
    models/                       # Mongoose models
      File.js                     # Document file metadata
      Annotation.js               # Annotation data
      CrossReference.js           # Document cross-references
    routes/                       # API routes
      files.js                    # File CRUD + scan/reorder
      annotations.js              # Annotation CRUD + batch save
      crossReferences.js          # Cross-reference CRUD
      export.js                   # Export to PDF/TIFF/JPG
    services/                     # Business logic
      thumbnailService.js         # Thumbnail generation
      exportService.js            # Export rendering
    assets/                       # Place viewable files here
  client/                         # Angular 13 frontend
    src/app/
      models/                     # TypeScript interfaces
      services/                   # Angular services
        file.service.ts           # File API calls
        annotation.service.ts     # Annotation API calls
        cross-reference.service.ts
        export.service.ts
        viewer-state.service.ts   # Shared application state
        undo-redo.service.ts      # Command pattern undo/redo
        auto-save.service.ts      # Debounced auto-save
      components/
        toolbar/                  # Top toolbar with all tools
        document-list/            # Left sidebar document list
        viewer/                   # Central canvas viewer + SVG annotations
        thumbnail-panel/          # Right sidebar page thumbnails
        pagination/               # Bottom pagination bar
        annotations/              # Annotation sub-components
          sticky-note/
          stamp-selector/
          drawing-canvas/
          crop-tool/
          image-adjust/
        export-dialog/            # Export settings dialog
        cross-ref-dialog/         # Cross-reference management
```

## API Endpoints

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/files/scan` | Scan assets folder for new files |
| GET | `/api/files` | List all files |
| GET | `/api/files/:id` | Get file metadata |
| GET | `/api/files/:id/content` | Serve file binary |
| GET | `/api/files/:id/thumbnail/:page` | Get page thumbnail |
| DELETE | `/api/files/:id` | Delete a file |
| POST | `/api/files/batch-delete` | Batch delete files |
| PUT | `/api/files/reorder` | Reorder files |

### Annotations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/annotations/:fileId` | Get annotations for a file |
| POST | `/api/annotations` | Create annotation |
| PUT | `/api/annotations/:id` | Update annotation |
| DELETE | `/api/annotations/:id` | Delete annotation |
| POST | `/api/annotations/batch` | Batch save annotations |

### Cross References
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cross-references/:fileId` | Get cross-references for a file |
| POST | `/api/cross-references` | Create a cross-reference |
| DELETE | `/api/cross-references/:id` | Delete a cross-reference |

### Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/export` | Export file(s) to PDF/TIFF/JPG |

## Keyboard Shortcuts

- **Ctrl+Z**: Undo
- **Ctrl+Shift+Z** or **Ctrl+Y**: Redo

## Technology Stack

- **Frontend**: Angular 13, TypeScript, Angular CDK (drag-drop), pdf.js, UTIF.js
- **Backend**: Node.js, Express, Mongoose, Sharp (image processing), pdf-lib
- **Database**: MongoDB
