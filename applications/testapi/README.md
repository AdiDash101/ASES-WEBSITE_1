# ASES API Tester

## Run
1. `cd /Users/alexi/repos/ASES-WEBSITE_1/testapi`
2. `bun run dev`
3. Open `http://localhost:3000`

## Notes
- Set `APP_ORIGIN` in the backend to `http://localhost:3000`.
- Click "Get CSRF Token" before POST or DELETE requests.
- Applicant flow is: start application, upload payment proof, submit application.
- For payment proof upload, choose an image file and click "Upload Payment Proof".
- Admin decision flow: verify payment first, then submit `ACCEPTED` or `REJECTED`.
