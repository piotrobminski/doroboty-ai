# Upload the static browser demo

The user selected a browser-only demonstration for S3-style object storage. This version needs no Node server, database, API, environment variables or credentials on the hosting service. Login is a role-selection simulation, not authentication or data protection. All edits stay in the current browser/origin; another browser starts with fresh synthetic data.

## Build and upload

From the source checkout, using Node.js 24 and the installed npm dependencies:

```sh
npm run build:s3
```

The single upload folder is **artifacts/s3-upload/**. Upload its **contents**, including index.html, assets/, cv/, company-logos/ and case/, preserving their relative paths. Put index.html at the root of the website. Upload the built files, not the source repository, dist from another build, the Node production archive or any .data/.env files. No credentials or runtime database are included.

Enable website/static hosting on the destination and set the index/default document to **index.html**. On Amazon S3 use the website endpoint or a configured CDN website URL, not an individual raw-object download link. Navigation uses `/#/...` hash routes, so route rewrites are unnecessary. Keep JavaScript/CSS/PDF content types correct when uploading (normal extension-based upload detection suffices). A private S3 origin can instead be served through CloudFront with the usual object access configuration. No cloud resources or access policies are created by this build.

Open the website URL after upload. ES modules require HTTP(S); opening index.html with file:// is not a hosting preview. For an update, upload the new assets before index.html, refresh/invalidate the cached index and keep old hashed assets until cached pages have expired. The new index references the new hashed filenames.

## Demo accounts and data

The login screen lists the five synthetic accounts; each uses demonstration password **Test1234**:

- `candidate-anna@doroboty.test`
- `candidate-marek@doroboty.test`
- `employer-brightlabs@doroboty.test`
- `employer-northstar@doroboty.test`
- `operator@doroboty.test`

Role-specific screens and workflow rules demonstrate the app. They do not protect browser data: anyone with access to this browser can inspect its complete synthetic scenario or choose another demo account. Use synthetic material only. Publications/applications/decisions are local simulations and are not sent to companies or other users. The banner on every route explains the demo boundary.

Data is stored under the separate localStorage key doroboty.static-demo.v1. The server-backed app, its SQLite database and older browser saves are untouched. Use one editing tab at a time. Browser storage must be allowed for edits to persist; private browsing, clearing site data, changing browser/domain or browser eviction may remove the demo state. Export a JSON copy from the operator's Settings before moving or clearing it. Confirmed import/reset affects only that browser. Corrupt saves are preserved for download until explicit recovery; failed writes retain form input. No analytics or provider API is called by the demo.

The existing **npm run dev**, **npm start** in the source checkout, and **npm run bundle:production** continue to use real server sessions and SQLite. build:s3 is an explicit alternate build, not an automatic fallback when their API is unavailable. Rebuild with the appropriate command for the intended hosting mode.

AWS references: [S3 website hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html), [index documents](https://docs.aws.amazon.com/AmazonS3/latest/userguide/IndexDocumentSupport.html). Local verification does not establish deployment, bucket/CDN settings or public availability.
