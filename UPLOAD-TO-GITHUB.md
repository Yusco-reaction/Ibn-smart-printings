# Upload Ibn Smart Print to GitHub

This archive contains the Ibn Smart Print source project. It is prepared for source-code upload; it is not yet a confirmation that the application is cloud-deployment-ready.

## Recommended repository
- Repository name: `ibn-smart-print`
- Visibility: `Private`

## Upload using GitHub website
1. Sign in at https://github.com/.
2. Select **New repository**.
3. Enter `ibn-smart-print`, select **Private**, then create the repository.
4. Extract this ZIP on your phone or computer. Do not upload the ZIP as a single file if you want GitHub/Render to access the source tree.
5. Open the new empty repository, select **Add file** → **Upload files**.
6. Upload the extracted project files and folders (including `src`, `public`, `backend`, `django_admin`, and `agent`).
7. Commit the upload to the `main` branch.

## Important security notes
- Do not upload `.env` files, passwords, API keys, payment credentials, or real customer documents.
- `.env.example` contains placeholders only. Configure real secrets later in Render's Environment settings.
- Keep payment integration in test mode until the live payment flow has been reviewed and explicitly switched.

## Project contents
- React/Vite customer application source (`src/`, `public/`)
- FastAPI backend (`backend/`)
- Django administration source (`django_admin/`)
- Windows printer agent (`agent/`)
- Python dependencies (`requirements.txt`)

## Deployment note
The project includes multiple application components. Before creating Render services, the backend entry point, frontend API URL, database persistence, file storage, and Django deployment configuration must be checked and configured. Do not assume that uploading the repository automatically deploys all components.
