# LAMP-app-gateway
The app gateway server component for logging and push notifications.

## Environment

| Name  | Required | Description  |
|---|---|---|
| `SENTRY_DSN`   |   |   |
| `SENTRY_ENV`   |   |   |
| `API_KEYS`   | :heavy_check_mark:  | _Secret_. Comma-separated list of   |
| `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64`  | :heavy_check_mark:  | _Secret_. A base64 encoded service account key. These keys start as json in cleartext and must be base64 encoded before setting. To generate the service account json file, follow  |
| `APNS_KEY_FILE_BASE64`   | :heavy_check_mark:  | _Secret_.  |
| `APNS_KEY_ID`   | :heavy_check_mark:  |   |
| `APNS_TEAM_ID`   | :heavy_check_mark:  |   |
| `APNS_IS_PRODUCTION` | | Set to `true` if production APNs endpoints should be used. Else, `false` or not set. |

_Note about `base64` encoded variables_

Variables ending in `_BASE64` are values that must be base64 encoded prior to being set in the environment or parameter store secrets. Typically these environment variables are files, such as google's serivce accounts or apns' certificate bundles.

To encode a file:

```
# OSX
base64 -w 0 input_file | pbcopy

# Linux
base64 -w 0 input_file | xclip -selection clipboard
```

To encode a value:

```
# OSX
echo -n "input_value" | base64 -w 0 | pbcopy

# Linux
echo -n "input_value" | base64 -w 0 | xclip -selection clipboard
```

Warning: there are several variants of base-64 encoding out there. `base64` uses the one defined in RFC 4648. When decoding in node, use `Buffer.from(base64String, 'base64').toString('utf8');`. Beware of functions that encode or decode base-64 using alterative character sets or padding. See [this mdn article](https://developer.mozilla.org/en-US/docs/Glossary/Base64) for more.

### Adding a new API Key

To generate a new API key, use `openssl rand -base64 12`. Append it to the list with a comma, without spaces.

### Setting Firebase Variables

To configure the Firebase Admin application in our non-google environment, we must set credentials manually rather than relying on Google's "Application Default Credentials" look-up chain. Our application has a service account for each environment:

  - `dev`: `LAMP-notif-dev`
  - `staging`: `LAMP-notif-stg`
  - `prod`: `LAMP-notif-prod`

Each of these service accounts should be grantend the "Service Account Token Creator" and "Firebase Admin SDK Administrator Service Agent" roles on the "LAMP Platform" resource.

To (re)configure the keys to each of these service accounts, follow these steps:

  1. Determine the email address of the environment's service account (see above)
  2. Find the service account by email in the ["IAM & Admin / Service accounts" console](https://console.cloud.google.com/iam-admin/serviceaccounts). Under the "Actions" column, selct "Manage keys" from the three-dot pull down menu.
  3. Create a new "JSON" key for the service account using the "Add key" dropdown. This will automatically download the file to your computer.
  4. In a terminal, navigate to the downloaded key. Once there, base64 encode the file to your clipboard. See instructions above about doing this on the command line.
  5. Set the appropriate `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64` secret in AWS's Parameter Store `"/env/{env}/gateway/FIREBASE_SERVICE_ACCOUNT_JSON_BASE64`. Be sure to save the new parameter. Note that the new key will not be used until the next full deployment of the gateway's ECS service. Either using the ECS console or triggering a new deploy from github.
  6. Back on the command line, `shred <downloaded-key-file>` and `rm <downloaded-key-file>`
  7. Force a new deployment in the ECS console to pick up the new service account key.
  8. Once confirmed the key is up and working, delete the old key.

**Warning**: Do not delete the old key, if any, until the service is restarted and confirmed working. Once a container is running, it will continue to use the same service account key until it is restarted or redeployed.

### Setting Apple Push Notification Service (APNs) Variables

To (re)configure keys for the Apple Push Notification Service (APNs):

  1. In the [developer account portal](https://developer.apple.com/account), select "Keys" under the "Certificates, IDs & Profiles" section. It should bring you [here](https://developer.apple.com/account/resources/authkeys/list)
  2. Click the `+` button next to the `Keys` table header. This should take you to a "Register a New Key" form. Fill it in as follows:
    - Key Name: `<appname> App Gateway <env> <date: YYYYMMdd>` -- note no special characters permitted, use spaces
    - Key Usage Description: `APNS Key in the <env> App Gateway`
    - Check the 'Enable' box next to "Apple Push Notifications service (APNs)
      - Click the conifgure button, select "Production" if this is the `prod` environment's key and "Sandbox" for all others
      - Key Restriction should be "Team Scoped (All Topics)"
      - Save
    - Click "Continue" button
    - Click "Register" button
  3. Download the key
  4. In a terminal, navigate to the downloaded key. Once there, base64 encode the file to your clipboard. See instructions above about doing this on the command line.
  5. Set the appropriate `APNS_KEY_ID` secret in AWS's Parameter Store `"/env/{env}/gateway/APNS_KEY_ID`. This is not a secret, but it is useful to have it co-located in the secrets with the corresponding encoded keys as they must change together. Note that `APNS_TEAM_ID` is unchanging and set in the LAMP-infra configuration of the environment.
  6. Set the appropriate `APNS_KEY_FILE_BASE64` secret in AWS's Parameter Store `"/env/{env}/gateway/APNS_KEY_FILE_BASE64`. Be sure to save the new parameter.
  7. Back on the command line, `shred <downloaded-key-file>` and `rm <downloaded-key-file>`
  8. Force a new deployment in the ECS console to pick up the new service account key.
  9. Once confirmed the key is up and working, delete the old key.

  Note that the new key and key id will not be used until the next full deployment of the gateway's ECS service. Either using the ECS console or triggering a new deploy from github.
