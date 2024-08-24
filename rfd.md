| authors | state |
|--|--|
| Maxim Dietz (max@kio.dev) | draft |


# RFD - Directory Browsing Application

## What

This RFD proposes the design and implementation of a simple directory browsing application with strong authentication, encryption, and web security. The application consists of a Go backend serving a web application and API, and a front-end UI for browsing directories, filtering, sorting, and navigating files and folders.

## Why

The purpose of this application is to demonstrate the ability to design and implement a secure and user-friendly directory browser similar to Google Drive or Dropbox, but with a simplified feature set. This project will showcase the ability to handle authentication, secure data transmission, and create a responsive, accessible, and aesthetic user interface.

## Details

### UX

#### User Stories
1. **User Authentication**
	- User navigates to the login page.
	- User enters valid credentials and logs in.
	- User is redirected to the directory browsing page.
2. **Directory Browsing**
  - User logs in
	- User is redirected and views the contents of the root directory.
	- User clicks on a subdirectory to view its contents.
	- User clicks on breadcrumbs to navigate back to parent directories.
3. **Directory Browsing (Unauthenticated)**
  - User navigates to the directory browsing page without logging in.
  - User is redirected to the login page with a redirect query parameter.
  - User logs in and is redirected to the relevant directory browsing page.
4. **Filtering and Sorting**
	- User types in the filter input to filter directory contents by filename.
	- User clicks on column headers to sort directory contents by filename, type, or size.
5. **Session Management**
	- User logs out from the application.
	- User can no longer view directory contents.

#### Wireframes
https://www.figma.com/design/yUVxh7iLWq30PlbTotSD4B/Teleport-FS-Interview---Directory-Browser-Application?node-id=2-30&t=8Hq1xoV291uDMrgP-1

### API Structure
Each endpoint will return a consistent wrapper, containing the status of the request ("success"/"error"), any encountered error, and the requested data:
```json
{
	"status": "ok", // "ok" | "error"
	"error": { // Defined only if "status" == "error"
		"message": "", // Error title
		"detail": "", // Optional description
	},
	"data": { ... } // Defined only if "status" == "ok"
}
```
This structure is consistent for both success and error cases, which simplifies the client-side handling of data and allows for strong typing client-side - i.e., if `status` is `"error"`, we know `data` will be empty, and `error` will be defined.

#### API Endpoints
- **GET /api/v1/files**: Fetches the contents of a directory.
	- Request Parameters: `path` (optional, slash-delimited, default is root directory).
	- The `data` field of a response will look like:
	```json
	{
		"name": "root",
		"type": "dir",
		"size": 2,
		"modified": 1720026612204,
		"contents": [
			{
				"name": "README.md",
				"type": "file",
				"size": 12345,
				"modified": 1720026612204
			},
			{
				"name": "images",
				"type": "dir",
				"size": 9,
				"modified": 1720026612204
			}
		]
	}
	```
	- Where:
		- `name` is a string,
		- `type` is an Enum of `file` or `dir`,
		- `size` is an integer representing the filesize in bytes (or number of items for directories),
		- `modified` is a Unix timestamp,
		- `contents` is a list containing sub-dirs and files (undefined for files).
	- The top-level object in any response will always be of type `dir`, as navigating to individual files is not in-scope.
- **POST /api/v1/auth/login**: Authenticates a user given a username and password.
	- Request Body:
	```json
	{
		"username": "user1",
		"password": "password123"
	}
	```
	- `data` field of response:
	```json
	{
		"username": "user1",
		"expires": 1720026612204
	}
	```
- **POST /api/v1/auth/logout**: Logs out the current user, removing their session and setting the session cookie to expire.
  - Request Body: None
  - `data` field of response: None
- **GET /api/v1/auth/me**: Returns the current user's session information, or an error if the user is not authenticated.
  - Request Parameters: None
  - `data` field of response (if authenticated):
  ```json
  {
    "username": "user1",
    "expires": 1720026612204
  }
  ```
  - `error` field of response (if not authenticated):
  ```json
  {
    "message": "Unauthorized",
    "detail": "User is not authenticated."
  }
  ```

### URL Structure

To maintain the user's position within the directory structure, the current path will be included in the URL after `/browse`. Ex: `/browse/path/to/directory`.

The sort state and filter query will be encoded as query parameters. Ex:
- `/browse/path/to/directory&sort=name&dir=desc`
- `/browse&filter=some%20query`

The sort state and filter query will be URL-encoded to ensure non-alphanumeric characters can be used without issue.

### Security

#### Authentication
- **Hard-coded credentials**: For simplicity, credentials will be hard-coded in the Go application as part of an `InMemoryBackend` struct. This will loosely mimick a database, containing usernames and their hashed passwords, along with active sessions.
- **Password Hashing and Salting**: The hard-coded passwords are hashed using bcrypt for secure storage. Since a sign-up flow is not in-scope, this hashing isn't exposed in an API endpoint, but could easily be, were a sign-up flow to be added in the future.
	- **Why bcrypt?** bcrypt is widely-used and specifically designed for secure password hashing. It incorporates a salt to protect against rainbow table attacks and allows for adjustment of the hashing complexity, making it an adaptable choice.

#### Request Security
- **Sessions**: Sessions will be used for authentication, managed by the Go server. They will be stored in the same `InMemoryBackend` struct as user credentials, and will consist of an ID, username, and expiry time. Session IDs will be returned as a cookie to the front-end after successful authentication. The cookie will have `httpOnly`, `secure`, and `SameSite` set to ensure it is only sent over secure connections and not accessible to Javascript.
  - **Why sessions?** Using sessions allows for secure storage of authentication data server-side, and limits exposure of sensitive information to the client and potential attackers. In some cases, JWTs may be preferable, but for this application, sessions are a simpler and more secure choice.
- **TLS Certificates**: TLS certificates will be configured for the Go server to encrypt data in transit. [mkcert](https://github.com/FiloSottile/mkcert) and [nss](https://github.com/nss-dev/nss) will be used for provisioning a trusted local certificate for `localhost`. TLS v1.2 and v1.3 will be supported, with Go's default cipher suites being used for each. The server will be configured to only accept secure connections.

#### Credential Validation
- **Password Comparison**: Passwords will be verified from login requests using bcrypt's comparison function. The process will include fetching the relevant `hashedPw` from the hardcoded users using the provided username. If the username doesn't exist, a fallback hashed password will be checked before failing to prevent timing attacks.
```go
user, err := inMemoryBackend.GetUser(creds.Username)
if err != nil {
	_ := bcrypt.CompareHashAndPassword(fallbackHash, []byte(creds.Password))
	writeErrorResponse(w, http.StatusUnauthorized, "Invalid credentials")
	return
}
err := bcrypt.CompareHashAndPassword(user.Password, []byte(creds.Password))
if err != nil {
	writeErrorResponse(w, http.StatusUnauthorized, "Invalid credentials")
	return
}
```

#### Protection Against Common Vulnerabilities
Given the current scope and lack of state-changing operations, many common web vulnerabilities are not applicable, but are still important to keep in mind for future expansions of the project.
- **Directory Traversal Prevention**: Path inputs passed as parameters from users should be sanitized to prevent directory traversal attacks. Viewing directories or files outside the intended root directory could expose sensitive information.
	```go
	sanitizedPath := filepath.Clean("/root/../../../../someDir")
	if !strings.HasPrefix(sanitizedPath, "/root") {
	    return errors.New("Invalid Path")
	}
	```
- **Input Validation**: All inputs should be sanitized and validated to prevent injection attacks and other forms of input manipulation.
- **Timing attacks**: Adding artificial delay or a fallback hashed password if a given username doesn't exist can prevent attackers from deducing whether a username is valid based on response time differences.

### Future Considerations
#### Mitigating Potential Attacks
- **CSRF Protection**: CSRF tokens should be implemented for any state-changing operations. Although the current scope does not include such operations, it would be important for such future features.
- **XSS Prevention**: All user content should be sanitized to prevent XSS attacks, especially if future features include file previews or user-generated content. While the current scope does not include these, it is a potential future risk.
- **Rate Limiting**: Certain endpoints, particularly the login endpoint, may benefit from rate-limiting repeated requests to protect against brute-force attacks.
- **Logging / Monitoring**: Logging events such as users logging in/out, requesting certain directories/files, or downloading content could be useful in spotting suspicious activity or potential errors not otherwise caught.

### Testing / Linting
#### Back-End
Unit tests will be implemented to ensure proper functioning of the authentication logic, API endpoints, and error states. These tests will be written using Go's built-in testing package. They will cover:
- Password hashing and verification
- Session provisioning and validation
- API endpoint responses, ensuring correct handling of auth'd and un-auth'd requests
- Error states, ensuring edge cases are covered for file retrieval and login

In addition to unit tests, `golangci-lint` will be used, which is a fast and flexible linter aggregator.
- **Linting**: `golangci-lint` will be configured to run a set of standard linters to catch potential issues, improve readability, and enforce coding standards.
- **Formatting**: `gofmt` will be used to automatically format the code, ensuring consistency and readability.

#### Front-End
Playwright will be used to perform end-to-end tests. Playwright is a powerful tool for browser automation and testing, allowing testing the UI application's UI and mocking user interactions. These tests will cover:
- User login and logout flows
- Navigation through directories
- Filtering and sorting of directory contents
- URL-based navigation and state persistence

For the front-end, Prettier and ESLint will be used to enforce consistent code style and catch potential issues.
- **Linting**: ESLint will be used for linting the TypeScript code. It helps to catch potential errors and, when used in combination with `typescript-eslint`, can catch common issues such as unnecessary Promises and unused variables.
- **Formatting**: Prettier will be used for code formatting. It ensures a consistent style across the code-base.

By integrating these tools, the codebase for both the back-end and front-end will maintain high standards of quality, readability, and maintainability. These tools will help enforce best practices, catch potential issues early, and ensure a consistent code style throughout the project.
