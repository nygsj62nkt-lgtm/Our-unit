# Our Unit v2 — security review patch

This archive is a modified copy of the user-provided `our-unit-v2.zip`, **not a verified production release**.

## Security changes

- Removed email-based implicit commander authorization in Firestore rules.
- Removed automatic commander promotion in `resolveOrBootstrapUserProfile`.
- New sign-ins create an **inactive soldier** account without a person link. A commander must approve and link it.
- Restricted soldier task updates to status transitions, timestamps, audit and rejection reason, with owner checks.
- Restricted notification creation to commanders and read-state edits to the recipient.
- Inactive users cannot read people, settings, shifts or events.

## REQUIRED BEFORE DEPLOYMENT

1. **Do not replace the live app yet.** Export/backup Firestore and test on a separate Firebase project or isolated staging environment first.
2. In Firebase Console > Authentication > Users, find the UID of the existing trusted administrator.
3. Using Firebase Console > Firestore, manually create `users/{TRUSTED_ADMIN_UID}` (using the exact UID as document ID) with fields:
   - `uid`: same UID (string)
   - `email`: actual verified administrator email (string)
   - `displayName`: administrator's name (string)
   - `role`: `commander` (string)
   - `personId`: matching person document ID, or empty string (string)
   - `active`: `true` (boolean)
   - `createdAt`: a timestamp-like text value (string)
   **Never make the bootstrap user by submitting a public form.** This is a privileged console action.
4. Deploy `firestore.rules` to the same Firebase project using Firebase CLI or Firebase Console. Confirm rules in the emulator, including denial of role self-promotion and cross-user data reads.
5. Install dependencies with `npm install`, then run `npm run typecheck` and `npm run build` in an environment with npm access.
6. Run migration only after creating a backup and reviewing counts and destination collections. Do not migrate on production before a dry run.
7. Validate commander and soldier sign-ins, role changes, approvals, notifications, and the on-call rota with separate test accounts.
8. Only then upload the repository files to GitHub and deploy through Vercel.

## Limitations of this patch

- This environment could not install dependencies because the npm registry was unreachable (`EAI_AGAIN`); the build was **not** verified.
- Firestore emulator security tests were **not** run.
- The migration and all features have **not** been end-to-end tested.
- Soldier task audit writes can still benefit from a server-controlled audit trail. Do not rely on client-authored audit as tamper-proof evidence.
- Soldier-originated notifications/push events may be denied by the stricter rules; they need a trusted backend workflow if required.
- Existing users who lack profiles must be approved and linked by a commander; first commander must be created in Firebase Console.

Do not publish this archive as a tested or secure production build without completing these steps.
