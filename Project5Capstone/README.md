# FuseDocs: A Hierarchical Content Authoring Tool

FuseDocs is a full-stack web application designed to be a comprehensive, web-based authoring tool. Unlike traditional flat-document editors (like a simple blog or wiki), FuseDocs allows users to create, manage, and view "Documents" as a hierarchical tree of content nodes. This structure is ideal for organizing complex material such as technical manuals, textbooks, or training modules, where content can be modularly created, reordered, and displayed in aggregate.

The application features a complete user authentication system, a document management dashboard, and a powerful, two-pane authoring environment. This environment includes a rich-text editor (powered by TinyMCE) that has been extended to support media attachments (images, video, audio) and a dedicated LaTeX math equation editor (powered by MathLive).

The backend is built with **Django** and the **Django REST Framework (DRF)**, providing a robust, token-authenticated JSON API. The frontend is a modern, stateful single-page application built with **React**, **TypeScript**, and **MobX** for state management, utilizing the **Fluent UI** component library.

## Distinctiveness and Complexity

This project satisfies the distinctiveness and complexity requirements through its sophisticated full-stack architecture, complex state management, and unique, feature-rich authoring environment, which goes far beyond typical CRUD (Create, Read, Update, Delete) applications.

**1. Backend Architecture & API Complexity:**
The backend is more than a simple set of CRUD endpoints. The core `Content` model in `models.py` is recursive (a `ForeignKey` to `'self'`), allowing for an infinitely deep tree structure. This introduces significant complexity, which the API is built to handle. For instance, the `Doc` model is atomically created alongside a `root_content_node` and the `views.py` provides a dedicated endpoint (`/api/document/<id>/content`) to serialize the *entire* document tree. Furthermore, the `Content` model features a `get_aggregated_content` method to recursively read and concatenate HTML files from a node and all its descendants, a key feature for the "viewer" mode. The most complex backend feature is the `/api/$batch` endpoint. This single endpoint is designed to accept `multipart/mixed` requests, parse individual HTTP sub-requests, and process database-modifying "changesets" within a `transaction.atomic()` block. This allows the frontend to perform complex, multi-step operations (like reordering an entire tree) in a single, efficient, and safe API call.

**2. Frontend State Management & UI:**
The frontend's complexity lies in its highly stateful nature, managed entirely by a central MobX view-model (`AuthoringToolVM.ts`). This VM is the "brain" of the application, tracking user authentication, the entire document content tree (`Records`), the currently selected node (`SelectedNode`), the selected *chapter* (the root of the current node's subtree), the rich-text editor's state (`IsDirty`, `IsEditMode`), and all dynamic UI state (`DrawerSize`, `MobileView`, `OpenBranchState`). The UI for reordering the content tree (`ReorderContentActions.tsx`) is particularly complex, involving local state manipulation of the tree (moving nodes up, down, or between parents) and then dispatching the changes to the backend's batch endpoint to persist the new order.

**3. Rich, Extended Authoring Environment:**
The core of the application is its customized TinyMCE editor, which has been significantly extended beyond its default capabilities.
* **Math Editor:** A custom plugin (`mathEditor.ts`) was written to add a "math" button to the toolbar and a context menu for existing equations. This opens a dedicated `MathDialog.tsx` component, which uses **MathLive** to provide a rich, real-time LaTeX editing experience.
* **Attachment Manager:** A full-featured `AttachmentDialog.tsx` allows users to upload images, videos, and audio files, which are associated with a specific content node. These attachments can then be inserted into the editor with appropriate HTML wrappers (e.g., `<figure>`, `<video>`).
* **Image Editing:** A custom image overlay (`imageOverlay.ts`) adds a context toolbar directly to images within the editor, allowing for in-line resizing while maintaining aspect ratio.
* **Content Viewer:** The `ContentViewer.tsx` and `HtmlFileRenderer.tsx` components are not just a simple `dangerouslySetInnerHTML`. They render the aggregated HTML content inside a sandboxed `iframe` and *dynamically inject* all necessary JavaScript and CSS `Resource` files (fetched from the backend) into the `iframe`'s `<head>`. This "hydrates" the static content, making it fully interactive as intended.

The combination of a recursive, transactional, batch-processing backend API with a state-intensive, hierarchical, and deeply customized rich-text editing frontend makes this project a complex and distinct system for structured content authoring.

## How to Run The Application

To run this application, you will need to run the Django backend server and the React frontend server simultaneously.

**Prerequisites:**
* Python 3.8+ and `pip`
* Node.js and `npm`

**1. Backend Setup (Django):**
1.  Navigate to the project's root directory (where `manage.py` is located).
2.  Create and activate a Python virtual environment:
    ```bash
    python -m venv venv
    # On macOS/Linux:
    source venv/bin/activate
    # On Windows:
    .\venv\Scripts\activate
    ```
3.  Install the required Python packages using `requirements.txt`:
    ```bash
    pip install -r requirements.txt
    ```
4.  Apply the database migrations to create the `db.sqlite3` file
    ```bash
    python manage.py migrate
    ```
5.  Run the backend server. It will be available at `http://localhost:8000`.
    ```bash
    python manage.py runserver
    ```

**2. Frontend Setup (React):**
1.  In a **new terminal**, navigate to the frontend application directory:
    ```bash
    cd authoring_tool/frontend/my-app
    ```
2.  Install the required Node.js modules:
    ```bash
    npm install
    ```
3.  Run the frontend development server. It will be available at `http://localhost:5173`.
    ```bash
    npm run dev
    ```

**3. Usage:**
1.  Open a web browser and go to `http://localhost:5173`.
2.  You will be greeted by the `LandingPage`. Click "Get Started" to register a new user.
3.  After registering, you will be logged in and taken to the `DocumentManager`.
4.  Click the "New" card (`DocumentCreator`) to create your first document.
5.  Once created, click the "Edit" button on your new `DocumentCard` to enter the `DocumentEditor`.
6.  You can now start building your content tree, adding and editing content, uploading attachments, and writing math equations.

## File Structure and Descriptions

The project is organized into a `capstone` (Django) backend and a `my-app` (React) frontend.

### Backend: `capstone/`

* `manage.py`: Django's command-line utility.
* `requirements.txt`: A list of all Python dependencies required for the backend.
* `db.sqlite3`: The SQLite database file
* **`capstone/` (Project Configuration)**
    * `settings.py`: Configures the Django project, including `INSTALLED_APPS` (like `rest_framework`, `corsheaders`), `MIDDLEWARE`, and `CORS_ALLOWED_ORIGINS`.
    * `urls.py`: The root URLconf that routes all `/` traffic to the `authoring_tool` app.
* **`authoring_tool/` (The Core Django App)**
    * `models.py`: Defines the database schema for `User` (custom), `Doc` (a document), `Content` (a recursive node in the tree), `Resource` (JS/CSS files), and `Attachment` (user-uploaded media).
    * `views.py`: Contains all API logic. It uses `@api_view` decorators from DRF to handle all requests for authentication, document CRUD, content tree operations, file uploads, and the complex `$batch` processing.
    * `urls.py`: Defines all API endpoints (e.g., `/api/documents`, `/api/content/<id>/file`, `/api/attachments/<id>`)
    * `serializers.py`: Defines the DRF serializers (`DocSerializer`, `ContentTreeSerializer`, `AttachmentSerializer`, etc.) that convert Django models to and from JSON
    * `admin.py`: Registers the models with the Django admin site for easy data management.
    * `migrations/`: Contains the database migration files generated by Django.

### Frontend: `authoring_tool/frontend/my-app/`

* **`src/` (Main Source Code)**
    * `main.tsx`: The entry point for the React application.
    * `ServiceProvider.ts`: A simple class to manage dependency injection (e.g., providing the `CdsService` to the `AuthoringToolVM`).
* **`src/components/` (React Components)**
    * `App.tsx`: The root component, responsible for the `FluentProvider` (theme), routing, and displaying global error messages.
    * `Layout.tsx`: The main layout shell, including the top navigation bar and the `<Outlet />` for child routes.
    * `Login.tsx` / `Register.tsx`: User authentication forms.
    * `LandingPage.tsx`: The public-facing homepage for unauthenticated users, featuring the `Iridescence.tsx` (OGL shader) component.
    * `DocumentManager/`: Components for the main user dashboard.
        * `DocumentManager.tsx`: Main page for viewing all user documents.
        * `DocumentCard.tsx`: A single card representing a document, with actions to edit, rename, or delete.
        * `DocumentCreator.tsx`: The "New" card component with a dialog to create a new document.
    * `DocumentEditor/`: The core authoring interface.
        * `DocumentEditor.tsx`: The top-level component that loads the document's data and hosts the `ContentDrawer`.
        * `ContentDrawer.tsx`: Manages the responsive two-pane layout (tree vs. content) and the main toolbar.
        * `Tree/`: Components for the hierarchical content tree.
            * `ContentTree.tsx`: Renders the root of the tree.
            * `ContentTreeItem.tsx`: Renders a single node in the tree, handling its open/closed state, selection, and context menu.
            * `ContentTreeItemMenu.tsx`: The context menu for a tree node (Edit, Delete, Add Chapter).
            * `ReorderContentActions.tsx`: The UI buttons (up, down, indent, outdent) shown in "Resequencing Mode".
            * `NewContentTreeItem.tsx` / `EditContentTreeItem.tsx`: Inline forms for creating or renaming a node directly within the tree.
        * `Editor/`: Components related to the rich-text editor.
            * `ContentEditor.tsx`: A wrapper that displays a loading spinner or the `TinyMCE` editor.
            * `TinyMCE.tsx`: Configures and initializes `BundledEditor.tsx` with all plugins, custom buttons, and event handlers.
            * `AttachmentDialog/`: The modal (`AttachmentDialog.tsx`) and list (`AttachmentsList.tsx`) for managing a node's media attachments.
            * `MathDialog/`: The modal (`MathDialog.tsx`) that hosts the `MathLiveEditor.tsx` component for LaTeX entry.
            * `imageOverlay.ts` / `mathEditor.ts`: TypeScript modules that are *not* React components but are used in `TinyMCE.tsx` to inject custom functionality into the editor instance.
        * `Viewer/`: Components for the read-only view.
            * `ContentViewer.tsx`: Displays the aggregated HTML content for the selected chapter.
            * `HtmlFileRenderer.tsx`: Renders the content in an `iframe` and dynamically injects the required JS/CSS resources.
* **`src/viewModel/`**
    * `AuthoringToolVM.ts`: The **MobX View-Model**, acting as the single source of truth for all frontend state. It manages user session, document data, the content tree structure, UI state (like drawer positions), editor state (`IsDirty`), and all business logic (like reordering nodes and saving content).
    * `context.tsx`: Exports the React Context and `useVM` hook to provide the `AuthoringToolVM` instance to all components.
* **`src/cdsService/`**
    * `CdsService.ts`: The API client layer. This class contains all `fetch` logic for communicating with the Django backend API, handling auth, and formatting requests/responses.
* **`src/types/` & `src/enums/`:** Contains all TypeScript interfaces (`Doc`, `Content`, `Attachment`) and enums (`filetype`, `resourcetype`) used throughout the application
* **`src/hooks/`**
    * `useMediaQuery.ts`: A custom hook used to toggle the UI between desktop and mobile layouts.

## Additional Information

* **Design Choices:**
    * **Backend:** Django + DRF was chosen for its robust ORM, built-in admin panel (for easy data verification), and powerful serialization which are essential for managing the project's complex, relational models. Token-based authentication was used for its stateless nature, which is a perfect fit for a decoupled REST API.
    * **Frontend:** React + TypeScript was chosen for a modern, type-safe, and component-driven UI.
    * **State Management:** MobX was chosen over Redux or simple React Context. The observable-based paradigm of MobX is extremely effective for managing complex, mutable, and nested state (like a content tree) with minimal boilerplate. The `AuthoringToolVM.ts` class demonstrates an object-oriented approach to state management that scales very well.
    * **Editor:** TinyMCE was selected for its power, maturity, and extensibility, which was critical for implementing custom features like the MathLive integration and the attachment manager.
    * **UI:** Fluent UI was chosen for its professional, clean aesthetic and its rich set of components, particularly the `Tree` and `Dialog` components.