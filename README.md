# JAMF Session Emailer 📨
## Purpose
* Supplementary tool for JAMF session to remediate endpoints not enrolled in JAMF

* Allows the user to:
	* View users not enrolled in JAMF
	* Distinguish between users with a single endpoint not enrolled and multiple
  * Allows the user to email the given endpoint's owned via their GitHub email in the tool directly
  * Allows the user to email all endpoints that are non-compliant (use this feature with caution)

### Dependencies:
* JavaScript installed
* Node.js installed
* React installed
* An active internet connection
* npm install:
	* request package
	* express
	* dotenv
	* nodemailer
* Must have the correct `.env` file with proper credentials installed in  `emailer_jamf_tool`
* Must be a GitHub employee
* Must have JAMF Session server running on localhost:3000
* Must know the server's password to access data

** To install all dependencies (apart from credentials) run `npm install` in `jamf_session_gh/jamf_gear_app` and `yarn install` in `emailer_jamf_tool`

### Usage:
* Clone repo, e.g., `git clone Repo_URL`
* open your terminal and `cd` into the cloned repo
* Request .env credentials from repo admins (see below)
* Request server username and password from repo admins (see below)
* type `node app.js` to start the server (node) in `jamf_session_gh/jamf_gear_app` for JAMF session server
* type `yarn start` to run client (react) in `emailer_jamf_tool`
* Open internet browser to: `http://localhost:3001` to see the app running

#### Authors:
* [Austin Harshberger](https://github.com/aharshbe) => Node.js (server side)
